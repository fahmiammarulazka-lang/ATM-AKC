import React, { useState, useRef } from 'react';
import {
  Bug,
  X,
  Upload,
  Send,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  ShieldAlert,
  Clock,
  HelpCircle,
  Sparkles,
  CheckSquare,
  Square,
  Search,
  GraduationCap,
  Lock,
  Bot,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { MINTOL_ADMIN_FEATURES_CATALOG } from '../data/empireAndMintolCatalog';
import { formatRupiah } from '../utils/bankUtils';
import { AppTutorialModal } from './AppTutorialModal';
import { AppAiBotModal } from './AppAiBotModal';

export const GlobalChatAndNotificationLayer: React.FC = () => {
  const {
    currentAccount,
    googleUser,
    bugReports,
    isBugReportModalOpen,
    setIsBugReportModalOpen,
    submitBugReport,
    adminHelpRequests,
    isMintolModalOpen,
    setIsMintolModalOpen,
    submitMintolRequest,
  } = useBank();

  // State Lapor Bug
  const [description, setDescription] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);
  const [photoFileName, setPhotoFileName] = useState<string | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // State Minta Tolong ke Admin (Mintol Admin)
  const [mintolTab, setMintolTab] = useState<'form' | 'history'>('form');
  const [selectedMintolFeatures, setSelectedMintolFeatures] = useState<string[]>([
    'mintol_suntik_saldo',
    'mintol_koin_spin_gratis',
  ]);
  const [mintolCategoryFilter, setMintolCategoryFilter] = useState<string>('Semua');
  const [mintolSearch, setMintolSearch] = useState<string>('');
  const [mintolMessage, setMintolMessage] = useState<string>('');
  const [mintolAmount, setMintolAmount] = useState<string>('50000000');
  const [mintolCoins, setMintolCoins] = useState<string>('10000');
  const [mintolLevel, setMintolLevel] = useState<string>('50');
  const [mintolUrgency, setMintolUrgency] = useState<'normal' | 'penting' | 'darurat_sultan'>(
    'darurat_sultan'
  );
  const [mintolError, setMintolError] = useState<string | null>(null);
  const [mintolSuccess, setMintolSuccess] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('File yang dipilih harus berupa gambar/foto (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('Ukuran foto maksimal 4 MB agar tetap ringan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoDataUrl(reader.result);
        setPhotoFileName(file.name);
        setErrorMsg(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoDataUrl(undefined);
    setPhotoFileName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitBug = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!description.trim()) {
      setErrorMsg('Penjelasan bug WAJIB diisi sebelum mengirim laporan!');
      return;
    }

    const res = submitBugReport({
      description: description.trim(),
      photoDataUrl,
      photoFileName,
    });

    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }

    setSuccessMsg(res.message);
    setDescription('');
    handleRemovePhoto();
  };

  const toggleMintolFeature = (featureId: string) => {
    setSelectedMintolFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((id) => id !== featureId) : [...prev, featureId]
    );
  };

  const selectAllVisibleFeatures = (visibleIds: string[]) => {
    setSelectedMintolFeatures((prev) => {
      const merged = new Set([...prev, ...visibleIds]);
      return Array.from(merged);
    });
  };

  const handleSubmitMintol = (e: React.FormEvent) => {
    e.preventDefault();
    setMintolError(null);
    setMintolSuccess(null);

    if (!mintolMessage.trim()) {
      setMintolError('⚠️ Pesan penjelasan minta tolong ke Admin WAJIB diisi (tidak boleh kosong)!');
      return;
    }

    if (selectedMintolFeatures.length === 0) {
      setMintolError('Pilih minimal 1 fitur bantuan dari daftar fitur Mintol Admin di bawah.');
      return;
    }

    const res = submitMintolRequest({
      selectedFeatures: selectedMintolFeatures,
      requestedAmount: Number(mintolAmount) || undefined,
      requestedCoins: Number(mintolCoins) || undefined,
      requestedLevel: Number(mintolLevel) || undefined,
      urgency: mintolUrgency,
      message: mintolMessage.trim(),
    });

    if (!res.success) {
      setMintolError(res.message);
      return;
    }

    setMintolSuccess(res.message);
    setMintolMessage('');
  };

  const myReports = bugReports.filter(
    (b) => !currentAccount || b.accountId === currentAccount.id
  );

  const myMintolRequests = adminHelpRequests.filter(
    (r) => !currentAccount || r.accountId === currentAccount.id
  );

  const categories = [
    'Semua',
    'Saldo & Uang',
    'Spin Wheel & Koin',
    'Lowongan Kerja',
    'Kartu & Akun',
    'Kerajaan Bisnis',
    'Layanan & VIP',
  ];

  const filteredMintolFeatures = MINTOL_ADMIN_FEATURES_CATALOG.filter((f) => {
    const matchCat = mintolCategoryFilter === 'Semua' || f.category === mintolCategoryFilter;
    const matchSearch =
      !mintolSearch.trim() ||
      f.label.toLowerCase().includes(mintolSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(mintolSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(mintolSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  if (!isBugReportModalOpen && !isMintolModalOpen) return null;

  return (
    <>
      {/* MODAL 1: LAPOR BUG */}
      {isBugReportModalOpen && (
        <div className="fixed inset-0 z-[105] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
          <div className="w-full max-w-2xl bg-slate-900 border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
            {/* Header Modal Lapor Bug */}
            <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950 px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                  <Bug className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">
                      Lapor Bug & Kendala Aplikasi
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-extrabold uppercase">
                      Terkirim ke Panel Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kirim foto bebas (opsional) beserta penjelasan kendala (wajib diisi).
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBugReportModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Info Pelapor */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Pelapor Aktif: </span>
                  <span className="font-bold text-white">
                    {currentAccount?.fullName || googleUser?.name || 'Nasabah Bank Nusantara'}
                  </span>
                </div>
                <div className="text-amber-300 font-mono font-bold">
                  Rek: {currentAccount?.accountNumber || '-'}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmitBug} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                    Penjelasan Bug / Kendala <span className="text-rose-400">* (WAJIB DIISI)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                    placeholder="Jelaskan secara lengkap bug atau kendala yang kamu temukan..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
                    Lampirkan Foto Bebas / Screenshot{' '}
                    <span className="text-slate-400 font-normal">(OPSIONAL)</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />

                  {!photoDataUrl ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-800/40 hover:bg-slate-800/80 transition flex flex-col items-center justify-center gap-2 text-slate-300 cursor-pointer"
                    >
                      <Upload className="w-6 h-6 text-amber-400" />
                      <span className="text-xs font-bold">
                        Klik untuk Pilih Foto Bebas / Screenshot (Opsional)
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mendukung JPG, PNG, WEBP (Maks. 4 MB)
                      </span>
                    </button>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-800 border border-amber-500/40 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold truncate">
                          <ImageIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{photoFileName || 'foto-lampiran.jpg'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Foto
                        </button>
                      </div>
                      <img
                        src={photoDataUrl}
                        alt="Preview Lampiran Bug"
                        className="max-h-56 rounded-xl border border-white/10 object-contain mx-auto bg-slate-950"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Kirim Laporan Bug ke Panel Admin
                </button>
              </form>

              {myReports.length > 0 && (
                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Riwayat Laporan Bug Kamu ({myReports.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {myReports.map((rep) => (
                      <div
                        key={rep.id}
                        className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                rep.status === 'resolved'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                  : rep.status === 'reviewed'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                              }`}
                            >
                              {rep.status === 'resolved'
                                ? 'Selesai Diperbaiki'
                                : rep.status === 'reviewed'
                                ? 'Sedang Ditinjau Admin'
                                : 'Menunggu Admin'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(rep.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <p className="text-slate-200 whitespace-pre-wrap">{rep.description}</p>
                          {rep.adminNote && (
                            <p className="text-emerald-300 font-semibold mt-1">
                              Balasan Admin: {rep.adminNote}
                            </p>
                          )}
                        </div>
                        {rep.photoDataUrl && (
                          <img
                            src={rep.photoDataUrl}
                            alt="Lampiran"
                            className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MINTA TOLONG KE ADMIN (MINTOL ADMIN) - PESAN WAJIB & 35 FITUR LENGKAP */}
      {isMintolModalOpen && (
        <div className="fixed inset-0 z-[106] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 md:p-6">
          <div className="w-full max-w-4xl bg-slate-900 border-2 border-amber-400/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
            {/* Header Modal Mintol Admin */}
            <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-amber-950 px-5 py-4 border-b border-white/15 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-2xl">
                  🙏
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black text-base md:text-lg text-white">
                      Minta Tolong ke Admin (Mintol Admin Center)
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-black uppercase">
                      {MINTOL_ADMIN_FEATURES_CATALOG.length} Fitur Mintol Tersedia • Pesan Wajib
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Pilih sebanyak mungkin fitur bantuan di bawah (Saldo, Koin Spin, Diskon Spin,
                    Level Kerja, Kerajaan Bisnis, Unban, dll) & tulis pesan wajib ke Admin!
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsMintolModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-Tab Form vs Riwayat Mintol */}
            <div className="px-5 pt-3 bg-slate-950/60 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex gap-2 pb-3">
                <button
                  type="button"
                  onClick={() => setMintolTab('form')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    mintolTab === 'form'
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  ✨ Buat Permintaan Mintol ({selectedMintolFeatures.length} Fitur Dipilih)
                </button>
                <button
                  type="button"
                  onClick={() => setMintolTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                    mintolTab === 'history'
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  📜 Riwayat & Balasan Admin ({myMintolRequests.length})
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 pb-3">
                <span>Pemohon:</span>
                <span className="font-black text-amber-300">
                  {currentAccount?.fullName || 'Nasabah'} ({currentAccount?.accountNumber || '-'})
                </span>
              </div>
            </div>

            {/* Isi Modal */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {mintolTab === 'form' ? (
                <form onSubmit={handleSubmitMintol} className="space-y-5">
                  {mintolError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-rose-200 text-xs font-bold flex items-center gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                      <span>{mintolError}</span>
                    </div>
                  )}

                  {mintolSuccess && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{mintolSuccess}</span>
                    </div>
                  )}

                  {/* BAGIAN 1: PESAN PENJELASAN WAJIB */}
                  <div className="bg-slate-800/90 border-2 border-amber-400/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <span>1. Pesan Permintaan ke Admin</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black">
                          WAJIB DIISI *
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { id: 'normal', label: 'Biasa' },
                            { id: 'penting', label: 'Penting' },
                            { id: 'darurat_sultan', label: '🔥 Darurat Sultan' },
                          ] as const
                        ).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setMintolUrgency(u.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer ${
                              mintolUrgency === u.id
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {u.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={mintolMessage}
                      onChange={(e) => setMintolMessage(e.target.value)}
                      required
                      rows={3}
                      placeholder="Tulis pesan wajib ke Admin (Contoh: Halo Admin, tolong suntik saldo Rp 50 Juta, kasih 10.000 Koin Spin gratis, diskon spin 80%, naikin level kerja ke 25, dan kasih modal bisnis Sultan ya!)..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white placeholder:text-slate-500"
                    />

                    {/* Template Pesan Cepat */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-slate-400 font-bold">Isi Cepat:</span>
                      {[
                        'Min tolong suntik saldo Rp 50 Juta & bagi 10.000 Koin Spin gratis dong!',
                        'Admin tolong kasih diskon Spin Wheel 80%, murahin koin, & gedein hoki jackpot 20 Juta!',
                        'Min tolong naikin Level Kerja ke Level 25, bagi Voucher Level, & gajian instan Rp 2 Juta!',
                        'Admin tolong unban kartu saya, kasih Centang Biru, & modalkan semua 12 Bisnis Sultan!',
                      ].map((tpl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMintolMessage(tpl)}
                          className="px-2.5 py-1 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-amber-200 text-[11px] font-semibold transition cursor-pointer"
                        >
                          + Template {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BAGIAN 2: PARAMETER ANGKA (OPSIONAL SESUAI FITUR) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-3">
                      <label className="text-[11px] font-bold text-emerald-300 uppercase block mb-1">
                        Nominal Saldo Diminta (Rp)
                      </label>
                      <input
                        type="number"
                        value={mintolAmount}
                        onChange={(e) => setMintolAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white"
                      />
                    </div>
                    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-3">
                      <label className="text-[11px] font-bold text-amber-300 uppercase block mb-1">
                        Jumlah Koin Spin Diminta (🪙)
                      </label>
                      <input
                        type="number"
                        value={mintolCoins}
                        onChange={(e) => setMintolCoins(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white"
                      />
                    </div>
                    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-3">
                      <label className="text-[11px] font-bold text-purple-300 uppercase block mb-1">
                        Target Level Kerja (Lv.50 Buka Kerajaan)
                      </label>
                      <input
                        type="number"
                        value={mintolLevel}
                        onChange={(e) => setMintolLevel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-black text-white"
                      />
                    </div>
                  </div>

                  {/* BAGIAN 3: PILIH DARI 35 FITUR MINTOL KE ADMIN */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs md:text-sm font-black uppercase tracking-wider text-white">
                          2. Pilih Fitur yang Dimintol ke Admin ({selectedMintolFeatures.length}{' '}
                          Dipilih dari {MINTOL_ADMIN_FEATURES_CATALOG.length} Fitur)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Bisa centang banyak fitur sekaligus! Saat Admin menekan tombol Kabulkan,
                          semua fitur yang kamu centang langsung dieksekusi otomatis.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            selectAllVisibleFeatures(filteredMintolFeatures.map((f) => f.id))
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold cursor-pointer"
                        >
                          Centang Semua
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMintolFeatures([])}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-extrabold cursor-pointer"
                        >
                          Reset Pilihan
                        </button>
                      </div>
                    </div>

                    {/* Filter Kategori & Search */}
                    <div className="flex flex-col md:flex-row gap-2">
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setMintolCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                              mintolCategoryFilter === cat
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div className="relative md:w-60">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={mintolSearch}
                          onChange={(e) => setMintolSearch(e.target.value)}
                          placeholder="Cari fitur mintol..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Grid 35 Fitur Mintol */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {filteredMintolFeatures.map((feat) => {
                        const isChecked = selectedMintolFeatures.includes(feat.id);
                        return (
                          <div
                            key={feat.id}
                            onClick={() => toggleMintolFeature(feat.id)}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                              isChecked
                                ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                                : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="mt-0.5 text-amber-400 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-black text-xs text-white truncate">
                                  {feat.icon} {feat.label}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 shrink-0">
                                  {feat.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {feat.description}
                              </p>
                              <p className="text-[10px] text-emerald-300 font-bold mt-1">
                                ⚡ Efek Admin: {feat.defaultValueHint}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    Kirim Permintaan Minta Tolong ({selectedMintolFeatures.length} Fitur) ke Panel
                    Admin
                  </button>
                </form>
              ) : (
                <div className="space-y-3">
                  {myMintolRequests.length === 0 ? (
                    <div className="p-8 text-center bg-slate-800/50 rounded-2xl border border-slate-700 text-slate-400 text-sm">
                      Belum ada riwayat permintaan Minta Tolong ke Admin.
                    </div>
                  ) : (
                    myMintolRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                req.status === 'granted'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                  : req.status === 'rejected'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                              }`}
                            >
                              {req.status === 'granted'
                                ? '✅ DIKABULKAN & DIEKSEKUSI ADMIN'
                                : req.status === 'rejected'
                                ? '❌ DITOLAK ADMIN'
                                : '⏳ MENUNGGU ACC ADMIN'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(req.createdAt).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-amber-300 uppercase">
                            Prioritas: {req.urgency}
                          </span>
                        </div>

                        <p className="text-xs md:text-sm font-bold text-white bg-slate-900/80 p-3 rounded-xl border border-white/10">
                          "{req.message}"
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {req.featureLabels.map((lbl, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold"
                            >
                              {lbl}
                            </span>
                          ))}
                        </div>

                        {req.adminReply && (
                          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 font-semibold">
                            💬 Tindakan Admin: {req.adminReply}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tutorial Lengkap Aplikasi (Khusus Kartu yang Sudah Disetujui Admin) & Bot AI Suara */}
      <AppTutorialModal />
      <AppAiBotModal />
    </>
  );
};

/**
 * Tombol di paling bawah (Footer):
 * 1. Lapor Bug (Kirim Foto Opsional + Penjelasan Wajib)
 * 2. Minta Tolong ke Admin / Mintol Admin (Pesan Wajib + 35 Fitur Lengkap)
 * 3. Tutorial Aplikasi (Bagi Kartu yang Sudah Disetujui Admin • Otomatis Bertambah Saat Ada Fitur Baru)
 */
export const AllowNotificationFooterButton: React.FC = () => {
  const {
    currentAccount,
    setIsBugReportModalOpen,
    bugReports,
    setIsMintolModalOpen,
    adminHelpRequests,
    setIsTutorialModalOpen,
    featureConfigs,
  } = useBank();

  const openBugCount = bugReports.filter((b) => b.status === 'open').length;
  const pendingMintolCount = adminHelpRequests.filter((r) => r.status === 'pending').length;
  const isCardApprovedByAdmin = currentAccount?.cardStatus === 'active';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setIsBugReportModalOpen(true)}
        className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 shadow-sm"
      >
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        <span>Lapor Bug (Kirim Foto &amp; Penjelasan)</span>
        {openBugCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
            {openBugCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setIsMintolModalOpen(true)}
        className="px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer bg-amber-400/20 text-amber-300 border border-amber-400/50 hover:bg-amber-400/30 shadow-sm"
      >
        <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span>🙏 Minta Tolong ke Admin (Bantuan Cepat)</span>
        {pendingMintolCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
            {pendingMintolCount}
          </span>
        )}
      </button>

      {/* Tombol Tutorial di Paling Bawah Bagi Kartunya yang Sudah Disetujui Admin */}
      <button
        onClick={() => setIsTutorialModalOpen(true)}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shadow-sm border ${
          isCardApprovedByAdmin
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/30'
            : 'bg-slate-800/80 text-amber-300 border-amber-500/40 hover:bg-slate-800'
        }`}
        title={
          isCardApprovedByAdmin
            ? 'Buka Tutorial Lengkap Seluruh Tombol & Fitur (Kartu Sudah Disetujui Admin)'
            : 'Pembuatan kartu harus disetujui Admin dulu baru ada tutorialnya'
        }
      >
        {isCardApprovedByAdmin ? (
          <>
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span>🎓 Tutorial Lengkap Aplikasi</span>
          </>
        ) : (
          <>
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>🔒 Tutorial Aplikasi (Wajib Kartu Disetujui Admin Dulu)</span>
          </>
        )}
      </button>
    </div>
  );
};
