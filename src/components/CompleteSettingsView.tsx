import React, { useState } from 'react';
import {
  Settings,
  Trash2,
  RotateCcw,
  User,
  Shield,
  CreditCard,
  Volume2,
  Palette,
  Zap,
  Database,
  CheckCircle2,
  AlertCircle,
  Search,
  Lock,
  Unlock,
  KeyRound,
  PlusCircle,
  Eye,
  EyeOff,
  Globe,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

export const CompleteSettingsView: React.FC = () => {
  const {
    currentAccount,
    userSettings,
    updateUserSettings,
    resetUserSettings,
    updateCustomerProfileIdentity,
    featureConfigs,
    deletedFeaturesList,
    deleteFeatureById,
    deleteMultipleFeatures,
    restoreDeletedFeature,
    restoreAllDeletedFeatures,
    adminAddCustomFeature,
    toggleCardFreezeWithPin,
    regenerateAccountNumberWithPin,
    changePin,
    requestPinReset,
    updateCardSpendingLimit,
    toggleInternationalUsage,
    markAllNotificationsAsRead,
    adminExportMasterBankJson,
    resetAllData,
    startFromZero,
  } = useBank();

  const [activeTab, setActiveTab] = useState<
    | 'deleted_features'
    | 'profile'
    | 'security'
    | 'limits'
    | 'audio'
    | 'appearance'
    | 'automation'
    | 'data_backup'
  >('deleted_features');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // State untuk Tab Fitur Dihapus
  const [featureSearch, setFeatureSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Semua');
  const [selectedFeatureIdsToDelete, setSelectedFeatureIdsToDelete] = useState<string[]>([]);
  const [newCustomFeatureTitle, setNewCustomFeatureTitle] = useState('');
  const [newCustomFeatureCat, setNewCustomFeatureCat] = useState('Layanan Tambahan');
  const [newCustomFeatureAmount, setNewCustomFeatureAmount] = useState(50000);

  // State untuk Tab Profil
  const [editFullName, setEditFullName] = useState(currentAccount?.fullName || '');
  const [editPhone, setEditPhone] = useState(currentAccount?.phone || '');
  const [editEmail, setEditEmail] = useState(currentAccount?.email || '');
  const [editAddress, setEditAddress] = useState(currentAccount?.address || '');
  const [editNik, setEditNik] = useState(currentAccount?.nik || '');
  const [regenAccPin, setRegenAccPin] = useState('');
  const [showCardSecret, setShowCardSecret] = useState(false);

  // State untuk Tab Keamanan & PIN
  const [freezePin, setFreezePin] = useState('');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [forgotPinReason, setForgotPinReason] = useState('');

  // State untuk Tab Limit Kartu
  const [spendingLimitVal, setSpendingLimitVal] = useState<number>(
    currentAccount?.dailySpendingLimit || 25_000_000
  );

  if (!currentAccount) {
    return (
      <div className="p-6 bg-slate-900 text-white rounded-3xl text-center">
        Silakan pilih rekening aktif terlebih dahulu.
      </div>
    );
  }

  const allCategories = [
    'Semua',
    ...Array.from(new Set(featureConfigs.map((f) => f.category))),
  ];

  const filteredActiveFeatures = featureConfigs.filter((f) => {
    const matchCat =
      selectedCategoryFilter === 'Semua' || f.category === selectedCategoryFilter;
    const q = featureSearch.trim().toLowerCase();
    const matchQ =
      !q ||
      (f.title || '').toLowerCase().includes(q) ||
      (f.category || '').toLowerCase().includes(q) ||
      (f.description || '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const toggleSelectFeatureForDelete = (id: string) => {
    setSelectedFeatureIdsToDelete((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteSelectedFeatures = () => {
    if (selectedFeatureIdsToDelete.length === 0) {
      setFeedback({
        type: 'error',
        text: 'Pilih minimal 1 fitur yang ingin dihapus terlebih dahulu!',
      });
      return;
    }
    const res = deleteMultipleFeatures(selectedFeatureIdsToDelete);
    setSelectedFeatureIdsToDelete([]);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateCustomerProfileIdentity({
      fullName: editFullName,
      phone: editPhone,
      email: editEmail,
      address: editAddress,
      nik: editNik,
    });
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleAddQuickCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomFeatureTitle.trim()) return;
    const res = adminAddCustomFeature({
      title: newCustomFeatureTitle.trim(),
      category: newCustomFeatureCat,
      description: `Fitur kustom yang ditambahkan melalui Pusat Pengaturan.`,
      defaultAmount: Number(newCustomFeatureAmount) || 50000,
      isPaidWithMoney: true,
      requireAdminPin: false,
      requireAdminApproval: false,
    });
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) setNewCustomFeatureTitle('');
  };

  const navItems = [
    {
      id: 'deleted_features' as const,
      label: `🗑️ Fitur Dihapus & Kelola (${deletedFeaturesList.length})`,
      icon: Trash2,
      badge: deletedFeaturesList.length > 0 ? `${deletedFeaturesList.length} Dihapus` : 'Aktif',
    },
    { id: 'profile' as const, label: '👤 Profil & Identitas', icon: User },
    { id: 'security' as const, label: '🔐 PIN & Privasi Keamanan', icon: Shield },
    { id: 'limits' as const, label: '💳 Limit Kartu & Internasional', icon: CreditCard },
    { id: 'audio' as const, label: '🔊 Audio ATM & Suara AI', icon: Volume2 },
    { id: 'appearance' as const, label: '🎨 Tema, Font & Tampilan', icon: Palette },
    { id: 'automation' as const, label: '⚡ Otomatisasi Mining & Spin', icon: Zap },
    { id: 'data_backup' as const, label: '💾 Backup & Reset Sistem', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER PUSAT PENGATURAN SUPER LENGKAP */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase mb-2">
              <Settings className="w-3.5 h-3.5" />
              60+ PENGATURAN LENGKAP & MANAJEMEN FITUR DIHAPUS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              ⚙️ Pusat Pengaturan Super Lengkap & Kelola Fitur Dihapus
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Atur seluruh preferensi keamanan rekening, PIN ATM, limit transaksi internasional, suara mesin ATM & Voice AI, tema tampilan, hingga{' '}
              <strong>menghapus fitur yang tidak diinginkan atau memulihkan fitur yang dihapus</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-right">
              <p className="text-[10px] font-bold uppercase text-slate-400">Fitur Aktif / Dihapus</p>
              <p className="text-sm font-black text-emerald-400">
                {featureConfigs.length} Aktif •{' '}
                <span className="text-rose-400">{deletedFeaturesList.length} Dihapus</span>
              </p>
            </div>
            <button
              onClick={() => {
                const res = resetUserSettings();
                setFeedback({ type: 'success', text: res.message });
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-extrabold text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Setelan
            </button>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg'
                    : 'bg-slate-950/70 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 1: FITUR DIHAPUS (HAPUS FITUR & PULIHKAN FITUR YANG DIHAPUS) */}
      {/* ===================================================================== */}
      {activeTab === 'deleted_features' && (
        <div className="space-y-6">
          {/* BAGIAN A: KERANJANG FITUR YANG DIHAPUS (RECYCLE BIN) */}
          <div className="bg-white rounded-3xl p-6 border-2 border-rose-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-black uppercase">
                  🗑️ Daftar Fitur yang Dihapus ({deletedFeaturesList.length} Fitur)
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Keranjang Fitur Dihapus & Pemulihan Instan
                </h3>
                <p className="text-xs text-slate-500">
                  Semua fitur yang Anda hapus disimpan di sini. Fitur yang dihapus tidak akan tampil di menu pembayaran atau tutorial sampai dipulihkan.
                </p>
              </div>
              {deletedFeaturesList.length > 0 && (
                <button
                  onClick={() => {
                    const res = restoreAllDeletedFeatures();
                    setFeedback({ type: 'success', text: res.message });
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow flex items-center gap-2 transition cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-4 h-4" />
                  ♻️ Pulihkan Semua ({deletedFeaturesList.length} Fitur)
                </button>
              )}
            </div>

            {deletedFeaturesList.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                <p className="text-sm font-bold text-slate-600">
                  Belum ada fitur yang dihapus saat ini.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Gunakan daftar Katalog Fitur Aktif di bawah untuk menghapus satu atau beberapa fitur sekaligus.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {deletedFeaturesList.map((feat) => (
                  <div
                    key={feat.id}
                    className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-200/70 text-rose-800">
                        DIHAPUS • {feat.category}
                      </span>
                      <p className="text-sm font-black text-slate-900 truncate mt-1">
                        {feat.title}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{feat.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        const res = restoreDeletedFeature(feat.id);
                        setFeedback({ type: 'success', text: res.message });
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Pulihkan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BAGIAN B: HAPUS FITUR DARI KATALOG AKTIF (SINGLE ATAU BULK DELETE) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  📋 Kelola & Hapus Fitur dari Katalog Aktif ({featureConfigs.length} Fitur Aktif)
                </h3>
                <p className="text-xs text-slate-500">
                  Centang beberapa fitur untuk dihapus sekaligus, atau klik tombol <strong>🗑️ Hapus</strong> pada fitur mana pun yang ingin Anda hilangkan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedFeatureIdsToDelete.length > 0 && (
                  <button
                    onClick={handleBulkDeleteSelectedFeatures}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus {selectedFeatureIdsToDelete.length} Fitur Terpilih
                  </button>
                )}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={featureSearch}
                    onChange={(e) => setFeatureSearch(e.target.value)}
                    placeholder="Cari nama fitur untuk dihapus..."
                    className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 w-56"
                  />
                </div>
              </div>
            </div>

            {/* Filter Kategori */}
            <div className="flex flex-wrap gap-1.5">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedCategoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredActiveFeatures.map((feat) => {
                const isChecked = selectedFeatureIdsToDelete.includes(feat.id);
                return (
                  <div
                    key={feat.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isChecked
                        ? 'bg-rose-50 border-rose-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectFeatureForDelete(feat.id)}
                        className="mt-1 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {feat.category}
                        </span>
                        <p className="text-xs font-black text-slate-900 truncate mt-1">
                          {feat.title}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{feat.description}</p>
                      </div>
                    </label>
                    <button
                      onClick={() => {
                        const res = deleteFeatureById(feat.id);
                        setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-700 font-black text-xs transition shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BAGIAN C: TAMBAH FITUR BARU PENGGANTI */}
          <form
            onSubmit={handleAddQuickCustomFeature}
            className="bg-indigo-50/70 rounded-3xl p-5 border border-indigo-200 flex flex-col md:flex-row items-end gap-3"
          >
            <div className="flex-1 w-full">
              <label className="block text-xs font-extrabold text-indigo-950 mb-1">
                ➕ Tambah Fitur Baru Pengganti (Otomatis Masuk Katalog & Tutorial)
              </label>
              <input
                type="text"
                value={newCustomFeatureTitle}
                onChange={(e) => setNewCustomFeatureTitle(e.target.value)}
                placeholder="Contoh: Bayar Langganan Starlink Satelit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-semibold"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-indigo-900 mb-1">Kategori</label>
              <input
                type="text"
                value={newCustomFeatureCat}
                onChange={(e) => setNewCustomFeatureCat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-semibold"
              />
            </div>
            <div className="w-full md:w-40">
              <label className="block text-xs font-bold text-indigo-900 mb-1">Nominal Default</label>
              <input
                type="number"
                value={newCustomFeatureAmount}
                onChange={(e) => setNewCustomFeatureAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-semibold"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Fitur
            </button>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: PROFIL, IDENTITAS & NOMOR REKENING */}
      {/* ===================================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
          >
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-600" />
              Edit Profil & Identitas Lengkap Nasabah
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Sesuai KTP</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">NIK KTP (16 Digit)</label>
                  <input
                    type="text"
                    value={editNik}
                    onChange={(e) => setEditNik(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP Aktif</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email Resmi</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Domisili</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow cursor-pointer"
            >
              Simpan Perubahan Identitas Nasabah
            </button>
          </form>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Detail Kartu ATM & Rekening</h3>
                <button
                  onClick={() => setShowCardSecret(!showCardSecret)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  {showCardSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showCardSecret ? 'Sembunyikan CVV/PIN' : 'Tampilkan CVV & PIN'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Nomor Rekening:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {currentAccount.accountNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nomor Kartu ATM:</span>
                  <span className="font-mono font-black text-sm text-slate-900">
                    {currentAccount.cardNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">CVV & Masa Berlaku:</span>
                  <span className="font-mono font-black text-sm text-indigo-600">
                    {showCardSecret ? `${currentAccount.cvv} • Exp ${currentAccount.expiryDate}` : '*** • Exp **/**'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">PIN ATM Saat Ini:</span>
                  <span className="font-mono font-black text-sm text-emerald-600">
                    {showCardSecret ? currentAccount.pin : '••••••'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Acak / Ganti Nomor Rekening Baru (Masukkan PIN ATM)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={6}
                    value={regenAccPin}
                    onChange={(e) => setRegenAccPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN 6 Digit"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      const res = regenerateAccountNumberWithPin(regenAccPin);
                      setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                      if (res.success) setRegenAccPin('');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer"
                  >
                    Ganti No. Rekening
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: KEAMANAN, PIN ATM, BIOMETRIK & PRIVASI */}
      {/* ===================================================================== */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Bekukan Kartu & Ganti PIN */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900">Kunci / Bekukan Kartu Sementara</h4>
                  <p className="text-xs text-slate-500">
                    Status Kartu:{' '}
                    <strong className="uppercase text-indigo-600">{currentAccount.cardStatus}</strong>
                  </p>
                </div>
                <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
                  {currentAccount.cardStatus === 'frozen' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={freezePin}
                  onChange={(e) => setFreezePin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan PIN 6 Digit"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <button
                  onClick={() => {
                    const res = toggleCardFreezeWithPin(freezePin);
                    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                    if (res.success) setFreezePin('');
                  }}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs text-white cursor-pointer ${
                    currentAccount.cardStatus === 'frozen' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {currentAccount.cardStatus === 'frozen' ? 'Buka Kunci Kartu' : 'Bekukan Kartu'}
                </button>
              </div>
            </div>

            {/* Ganti PIN ATM */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600" />
                Ubah PIN ATM 6 Digit
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  maxLength={6}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN Lama (6 Digit)"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="PIN Baru (6 Digit)"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <button
                onClick={() => {
                  const res = changePin(oldPin, newPin);
                  setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                  if (res.success) {
                    setOldPin('');
                    setNewPin('');
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer"
              >
                Simpan PIN Baru
              </button>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-amber-800">Lupa PIN ATM? Minta Admin Tampilkan PIN</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={forgotPinReason}
                    onChange={(e) => setForgotPinReason(e.target.value)}
                    placeholder="Alasan lupa PIN..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    onClick={() => {
                      const res = requestPinReset(currentAccount.id, forgotPinReason);
                      setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs cursor-pointer"
                  >
                    Ajukan Lupa PIN
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 9 Toggle Keamanan & Privasi */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h4 className="font-black text-slate-900">Pengaturan Keamanan Berlapis & Privasi</h4>
            {[
              {
                key: 'hideBalanceDefault' as const,
                title: 'Sensor Saldo Otomatis Saat Masuk',
                desc: 'Sembunyikan nominal saldo dengan bintang (Rp •••••••) saat pertama membuka layar.',
              },
              {
                key: 'requirePinForTransferUnder1M' as const,
                title: 'Wajib PIN untuk Transfer di Bawah Rp 1.000.000',
                desc: 'Selalu minta verifikasi PIN meskipun nominal transfer kecil.',
              },
              {
                key: 'twoFactorOtpSim' as const,
                title: 'Verifikasi 2 Langkah (2FA Kode OTP)',
                desc: 'Tambahkan perlindungan ekstra pada transaksi nominal besar.',
              },
              {
                key: 'blockScreenshotsSim' as const,
                title: 'Proteksi Anti-Sadap Layar & CVV',
                desc: 'Samarkan nomor CVV kartu secara otomatis dari tangkapan layar.',
              },
              {
                key: 'suspiciousLoginAlert' as const,
                title: 'Notifikasi Peringatan Login Perangkat Baru',
                desc: 'Kirimkan peringatan instan jika rekening diakses dari browser lain.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer"
              >
                <div className="pr-3">
                  <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(userSettings[item.key])}
                  onChange={(e) => updateUserSettings({ [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </label>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Kode Anti-Phishing Resmi
                </label>
                <input
                  type="text"
                  value={userSettings.antiPhishingCode}
                  onChange={(e) => updateUserSettings({ antiPhishingCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Auto-Lock Layar (Menit)
                </label>
                <select
                  value={userSettings.autoLockMinutes}
                  onChange={(e) => updateUserSettings({ autoLockMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  {[1, 5, 15, 30, 60].map((m) => (
                    <option key={m} value={m}>
                      {m} Menit
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: LIMIT KARTU, PAYWAVE & INTERNASIONAL */}
      {/* ===================================================================== */}
      {activeTab === 'limits' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Pengaturan Limit Belanja & Transfer Harian
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Limit Belanja Debit Harian Kartu:</span>
                <span className="text-indigo-600 font-black">{formatRupiah(spendingLimitVal)}</span>
              </div>
              <input
                type="range"
                min={1_000_000}
                max={500_000_000}
                step={1_000_000}
                value={spendingLimitVal}
                onChange={(e) => setSpendingLimitVal(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <button
                onClick={() => {
                  const res = updateCardSpendingLimit(spendingLimitVal);
                  setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer"
              >
                Simpan Limit Belanja Kartu
              </button>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Limit Maksimal Sekali Transaksi:</span>
                <span className="text-emerald-600 font-black">
                  {formatRupiah(userSettings.singleTransactionMaxLimit)}
                </span>
              </div>
              <input
                type="range"
                min={5_000_000}
                max={1_000_000_000}
                step={5_000_000}
                value={userSettings.singleTransactionMaxLimit}
                onChange={(e) =>
                  updateUserSettings({ singleTransactionMaxLimit: Number(e.target.value) })
                }
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Limit Maksimal Transfer Harian:</span>
                <span className="text-amber-600 font-black">
                  {formatRupiah(userSettings.dailyTransferMaxLimit)}
                </span>
              </div>
              <input
                type="range"
                min={10_000_000}
                max={2_000_000_000}
                step={10_000_000}
                value={userSettings.dailyTransferMaxLimit}
                onChange={(e) =>
                  updateUserSettings({ dailyTransferMaxLimit: Number(e.target.value) })
                }
                className="w-full accent-amber-600"
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              Akses Kartu Internasional, PayWave & E-Commerce
            </h3>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 cursor-pointer">
              <div>
                <p className="text-xs font-black text-indigo-950">
                  Transaksi Internasional Kartu ATM (Overseas Usage)
                </p>
                <p className="text-[11px] text-indigo-700">
                  Izinkan pembayaran kartu di merchant luar negeri & valuta asing.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(currentAccount.internationalUsageEnabled)}
                onChange={() => {
                  const res = toggleInternationalUsage();
                  setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                }}
                className="w-4 h-4 accent-indigo-600"
              />
            </label>

            {[
              {
                key: 'contactlessPaywaveEnabled' as const,
                title: 'Fitur Contactless PayWave (Tap Tanpa Gesek)',
                desc: 'Transaksi cepat dengan menempelkan kartu pada mesin EDC.',
              },
              {
                key: 'onlineEcommerceEnabled' as const,
                title: 'Transaksi Debit Online & Marketplace E-Commerce',
                desc: 'Izinkan pembayaran langsung di aplikasi belanja online.',
              },
              {
                key: 'autoDebitSubscriptionEnabled' as const,
                title: 'Auto-Debit Langganan Bulanan (Streaming / Cloud)',
                desc: 'Izinkan pendebitan otomatis untuk tagihan rutin.',
              },
              {
                key: 'overseasAtmWithdrawalEnabled' as const,
                title: 'Tarik Tunai di Jaringan ATM Internasional (Cirrus/Plus)',
                desc: 'Izinkan penarikan uang tunai di mesin ATM luar negeri.',
              },
              {
                key: 'qrisCrossBorderEnabled' as const,
                title: 'QRIS Cross-Border (Singapura, Malaysia, Thailand, Jepang)',
                desc: 'Aktifkan pembayaran scan QRIS otomatis saat bepergian ke luar negeri.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer"
              >
                <div className="pr-3">
                  <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(userSettings[item.key])}
                  onChange={(e) => updateUserSettings({ [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: AUDIO ATM, SUARA HITUNG UANG & VOICE AI */}
      {/* ===================================================================== */}
      {activeTab === 'audio' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            Pengaturan Efek Suara Mesin ATM & Voice Chat Bot AI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: 'atmBeepSoundEnabled' as const,
                title: 'Suara Beep Tombol Mesin ATM',
                desc: 'Efek suara klik khas mesin ATM saat menekan tombol.',
              },
              {
                key: 'cashCountingSoundEnabled' as const,
                title: 'Suara Mesin Hitung Uang Kertas (Cash Dispenser)',
                desc: 'Efek suara uang keluar saat tarik tunai, gajian, dan menang spin.',
              },
              {
                key: 'voiceReceiptReadoutEnabled' as const,
                title: 'Pembacaan Struk Transaksi dengan Suara Otomatis',
                desc: 'Bacakan nominal transaksi berhasil menggunakan suara Bahasa Indonesia.',
              },
              {
                key: 'aiVoiceAutoSpeak' as const,
                title: 'Bot AI Otomatis Berbicara (Voice Chat Auto-Speak)',
                desc: 'Bot AI langsung membacakan jawaban dengan suara saat Anda bertanya.',
              },
              {
                key: 'notificationChimeSound' as const,
                title: 'Suara Lonceng Notifikasi & Broadcast Admin',
                desc: 'Bunyikan nada dering lembut saat ada pesan atau saldo masuk.',
              },
              {
                key: 'hapticVibrationSim' as const,
                title: 'Umpan Balik Getar Haptik (Haptic Feedback)',
                desc: 'Efek respons sentuhan pada perangkat mobile.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer"
              >
                <div className="pr-3">
                  <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(userSettings[item.key])}
                  onChange={(e) => updateUserSettings({ [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 max-w-md">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kecepatan Bicara Suara Bot AI ({userSettings.aiVoiceSpeechRate}x)
            </label>
            <input
              type="range"
              min={0.8}
              max={1.5}
              step={0.05}
              value={userSettings.aiVoiceSpeechRate}
              onChange={(e) => updateUserSettings({ aiVoiceSpeechRate: Number(e.target.value) })}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: TAMPILAN, TEMA WARNA & AKSESIBILITAS */}
      {/* ===================================================================== */}
      {activeTab === 'appearance' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600" />
            Personalisasi Tema Warna, Ukuran Teks & Tata Letak
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tema Aksen Warna</label>
              <select
                value={userSettings.themeColorAccent}
                onChange={(e) =>
                  updateUserSettings({ themeColorAccent: e.target.value as any })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="indigo">Indigo Nusantara (Default)</option>
                <option value="emerald">Emerald Syariah & Makmur</option>
                <option value="amber">Amber Gold Sultan</option>
                <option value="cyan">Cyan Cyber Mining VIP</option>
                <option value="rose">Rose Ruby Executive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Skala Ukuran Huruf</label>
              <select
                value={userSettings.fontSizeScale}
                onChange={(e) => updateUserSettings({ fontSizeScale: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="normal">Normal (Standar)</option>
                <option value="large">Besar (Nyaman Dibaca)</option>
                <option value="xlarge">Ekstra Besar (Aksesibilitas)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Format Bahasa & Regional</label>
              <select
                value={userSettings.languageLocale}
                onChange={(e) => updateUserSettings({ languageLocale: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
              >
                <option value="id-ID">🇮🇩 Bahasa Indonesia (IDR)</option>
                <option value="en-US">🌐 English International (IDR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: 'animationsConfettiEnabled' as const,
                title: 'Efek Hujan Confetti Saat Jackpot & Gajian',
                desc: 'Tampilkan perayaan confetti meriah saat menang Spin atau klaim Mining.',
              },
              {
                key: 'currencyDisplayDecimals' as const,
                title: 'Tampilkan Desimal Recehan (,00) pada Saldo Utama',
                desc: 'Tampilkan angka sen/desimal secara lengkap pada tampilan Rupiah.',
              },
              {
                key: 'compactCardLayout' as const,
                title: 'Mode Tampilan Kartu Ringkas (Compact Mode)',
                desc: 'Rapatkan jarak antar komponen agar muat lebih banyak di layar.',
              },
              {
                key: 'highContrastMode' as const,
                title: 'Mode Kontras Tinggi (High Contrast)',
                desc: 'Pertegas garis tepi dan keterbacaan teks.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer"
              >
                <div className="pr-3">
                  <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(userSettings[item.key])}
                  onChange={(e) => updateUserSettings({ [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 7: OTOMATISASI TRANSAKSI, MINING KRIPTO & SPIN WHEEL */}
      {/* ===================================================================== */}
      {activeTab === 'automation' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Otomatisasi Pintar Transaksi, Mining Kripto & Spin the Wheel
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: 'autoPrintReceiptAfterTx' as const,
                title: 'Tampilkan Struk Bukti Otomatis Setelah Transaksi',
                desc: 'Langsung buka resi bukti transaksi setiap kali pembayaran selesai.',
              },
              {
                key: 'autoSaveRoundUpPocket' as const,
                title: 'Auto-Save Pembulatan Receh ke Celengan Impian',
                desc: 'Otomatis sisihkan recehan transaksi untuk ditabung.',
              },
              {
                key: 'autoClaimMiningOnOpen' as const,
                title: 'Siapkan Klaim Cepat Rig Mining Saat Menu Dibuka',
                desc: 'Mempercepat sinkronisasi blok saat membuka menu Mining & Lelang VIP.',
              },
              {
                key: 'spinTurboAnimation' as const,
                title: 'Mode Putaran Turbo Spin the Wheel',
                desc: 'Percepat durasi putaran roda Spin the Wheel.',
              },
              {
                key: 'workClickVisualEffect' as const,
                title: 'Efek Partikel Klik pada Lowongan Pekerjaan',
                desc: 'Tampilkan animasi angka saat mengetuk tombol kerja.',
              },
              {
                key: 'autoRedeemPulsaTokenNotif' as const,
                title: 'Pengingat Otomatis Kode Voucher Pulsa & Token PLN Belum Ditukar',
                desc: 'Beri tahu jika masih ada kode voucher yang belum dimasukkan.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer"
              >
                <div className="pr-3">
                  <p className="text-xs font-extrabold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(userSettings[item.key])}
                  onChange={(e) => updateUserSettings({ [item.key]: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 8: BACKUP DATA JSON, PEMBERSIHAN & RESET SISTEM */}
      {/* ===================================================================== */}
      {activeTab === 'data_backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Ekspor Snapshot Data & Pemeliharaan
            </h3>
            <p className="text-xs text-slate-500">
              Salin cadangan data rekening, mutasi transaksi, dan konfigurasi fitur Anda ke clipboard dalam format JSON.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const res = adminExportMasterBankJson();
                  setFeedback({ type: 'success', text: res.message });
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer"
              >
                📋 Salin Backup JSON ke Clipboard
              </button>
              <button
                onClick={() => {
                  markAllNotificationsAsRead();
                  setFeedback({
                    type: 'success',
                    text: 'Seluruh notifikasi telah ditandai sudah dibaca!',
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer"
              >
                ✓ Tandai Semua Notifikasi Dibaca
              </button>
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-3xl p-6 border border-rose-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-rose-950">Reset Sistem & Mulai Ulang</h3>
            <p className="text-xs text-rose-700">
              Anda dapat mengembalikan seluruh data ke kondisi demo awal atau memulai aplikasi benar-benar dari nol.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  resetAllData();
                  setFeedback({
                    type: 'success',
                    text: 'Data berhasil dikembalikan ke kondisi demo standar!',
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs cursor-pointer"
              >
                🔄 Reset ke Data Demo Awal
              </button>
              <button
                onClick={() => {
                  startFromZero();
                  setFeedback({
                    type: 'success',
                    text: 'Aplikasi direset mulai dari nol!',
                  });
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs cursor-pointer"
              >
                ⚠️ Mulai Dari Nol (Kosongkan Rekening)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
