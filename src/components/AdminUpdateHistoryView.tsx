/**
 * Bank Nusantara — Halaman Riwayat Update Admin (Eksklusif Kartu Tier Admin & Super Admin Utama)
 * - Gaya editorial gelap selaras Riwayat Update publik dengan aksen emas eksklusif Admin
 * - Menampilkan seluruh catatan pembaruan khusus Admin dan campuran TANPA penyaringan
 * - Menggunakan jalur penomoran versi Admin terpisah (vAdmin) sehingga tidak pernah menaikkan versi publik
 * - Dilengkapi pencarian real-time, filter segmen, dan tombol cepat Tambah Update Admin untuk Super Admin
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  Crown,
  Plus,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  getAdminAppUpdates,
  getNextAdminVersion,
  type AdminUpdateViewItem,
} from '../services/autoUpdateReleaseService';
import {
  isPrimarySystemOwnerAccount,
  resolveEffectiveAdminPermissions,
} from '../types/adminAnalyticsAndTier';
import { useAdminAnalyticsAndTierSync } from '../hooks/useAdminAnalyticsAndTierSync';

interface AdminUpdateHistoryViewProps {
  onNavigateToView: (
    view: 'dashboard' | 'atm' | 'admin' | 'guide' | 'chat' | 'updates' | 'admin_updates'
  ) => void;
  onMarkAdminUpdatesRead?: (latestId: string) => void;
}

type AdminUpdateFilter = 'all' | 'admin_only' | 'mixed';

function formatCurrentWibFullDate(): string {
  try {
    const now = new Date();
    const datePart = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    const timePart = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
    return `${datePart} • Pukul ${timePart.replace('.', ':')} WIB`;
  } catch {
    return new Date().toLocaleString('id-ID');
  }
}

export const AdminUpdateHistoryView: React.FC<AdminUpdateHistoryViewProps> = ({
  onNavigateToView,
  onMarkAdminUpdatesRead,
}) => {
  const {
    appUpdates,
    currentAccount,
    googleUser,
    firebaseUser,
    adminUnlocked,
    adminAddAppUpdate,
    publicCurrentUpdate,
  } = useBank();
  const { adminTierGrantsMap } = useAdminAnalyticsAndTierSync();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [kindFilter, setKindFilter] = useState<AdminUpdateFilter>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [draftVersion, setDraftVersion] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftDescription, setDraftDescription] = useState<string>('');
  const [draftHighlightsText, setDraftHighlightsText] = useState<string>('');
  const [draftCategory, setDraftCategory] = useState<string>('Rilis Internal Admin');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const adminUpdates = useMemo(() => getAdminAppUpdates(appUpdates), [appUpdates]);
  const latestItem: AdminUpdateViewItem | null = adminUpdates[0] || null;
  const historyItems = useMemo(
    () => (latestItem ? adminUpdates.filter((it) => it.record.id !== latestItem.record.id) : []),
    [adminUpdates, latestItem]
  );

  // Tandai sudah dibaca saat halaman dibuka sehingga titik merah BARU di Navbar hilang
  useEffect(() => {
    if (latestItem?.record?.id) {
      onMarkAdminUpdatesRead?.(latestItem.record.id);
    }
  }, [latestItem?.record?.id, onMarkAdminUpdatesRead]);

  const currentGrant = currentAccount ? adminTierGrantsMap[currentAccount.id] || null : null;
  const effectivePerms = resolveEffectiveAdminPermissions({
    account: currentAccount,
    signedInEmail: googleUser?.email || firebaseUser?.email || null,
    adminUnlocked,
    grant: currentGrant,
  });

  const isSuperAdmin =
    isPrimarySystemOwnerAccount(currentAccount, googleUser?.email || firebaseUser?.email) ||
    effectivePerms.isSuperOwner;

  const counts = useMemo(() => {
    let adminOnly = 0;
    let mixed = 0;
    for (const item of historyItems) {
      if (item.kind === 'admin_only') adminOnly += 1;
      else mixed += 1;
    }
    return { all: historyItems.length, adminOnly, mixed };
  }, [historyItems]);

  const filteredHistory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return historyItems.filter((item) => {
      if (kindFilter === 'admin_only' && item.kind !== 'admin_only') return false;
      if (kindFilter === 'mixed' && item.kind !== 'mixed') return false;
      if (!q) return true;
      const rec = item.record;
      const points = (rec.highlights || rec.changes || []).join(' ').toLowerCase();
      return (
        rec.title.toLowerCase().includes(q) ||
        rec.description.toLowerCase().includes(q) ||
        rec.version.toLowerCase().includes(q) ||
        (rec.fullDate || rec.dateText || '').toLowerCase().includes(q) ||
        points.includes(q)
      );
    });
  }, [historyItems, searchQuery, kindFilter]);

  const openQuickAddModal = () => {
    setDraftVersion(getNextAdminVersion(appUpdates));
    setDraftTitle('');
    setDraftDescription('');
    setDraftHighlightsText('');
    setDraftCategory('Rilis Internal Admin');
    setFeedback(null);
    setShowAddModal(true);
  };

  const handlePublishAdminUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVer = draftVersion.trim() || getNextAdminVersion(appUpdates);
    const safeAdminVersion = /^v?admin\b/i.test(cleanVer) ? cleanVer : `vAdmin ${cleanVer}`;
    const highlights = draftHighlightsText
      .split('\n')
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);

    const res = adminAddAppUpdate({
      version: safeAdminVersion,
      title: draftTitle,
      fullDate: formatCurrentWibFullDate(),
      description: draftDescription,
      highlights: highlights.length > 0 ? highlights : undefined,
      changes: highlights.length > 0 ? highlights : undefined,
      isCurrent: false, // Tidak pernah mengubah versi aktif publik
      visibilityMode: 'admin_only',
      categoryBadge: draftCategory.trim() || 'Rilis Internal Admin',
      author: currentAccount?.fullName
        ? `${currentAccount.fullName} (Super Admin)`
        : 'Super Admin Utama (AzkaAKC)',
      releaseType: 'minor',
    });

    setFeedback({ ok: res.success, text: res.message });
    if (res.success) {
      setShowAddModal(false);
    }
  };

  const latestPoints =
    latestItem?.record.highlights && latestItem.record.highlights.length > 0
      ? latestItem.record.highlights
      : latestItem?.record.changes || [];

  const publicVersionLabel = publicCurrentUpdate?.version || 'v16.47.24';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-12">
      {/* Editorial Header — Gold Admin Reserve */}
      <header className="relative overflow-hidden rounded-2xl bg-slate-900/85 border border-amber-500/35 px-6 py-7 sm:px-9 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"
        />

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-slate-400">
              <span className="text-amber-300 font-semibold inline-flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Log Internal Kartu Tier Admin</span>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-amber-200 font-semibold">
                {latestItem?.record.version || 'vAdmin 1.0.0'}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{adminUpdates.length} Catatan Tanpa Filter</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Versi Publik Tetap {publicVersionLabel}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Riwayat Update Admin
            </h1>

            <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
              Seluruh pembaruan khusus Panel Admin, kebijakan otoritas Kartu Tier Admin, dan pembaruan campuran ditampilkan secara utuh tanpa penyaringan. Penomoran versi Admin terpisah penuh agar tidak memengaruhi versi publik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={openQuickAddModal}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Tambah Update Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToView('updates')}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold cursor-pointer inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lihat Versi Publik</span>
            </button>
          </div>
        </div>
      </header>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-medium border flex items-center justify-between gap-3 ${
            feedback.ok
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
            aria-label="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* BAGIAN 1: PEMBARUAN ADMIN TERBARU (Focal Hero) */}
      {latestItem ? (
        <section
          aria-label="Pembaruan Admin Terbaru"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/85 to-slate-950 border border-amber-400/45 px-6 py-7 sm:px-9 sm:py-9 space-y-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-500/20 via-amber-300/90 to-amber-500/20"
          />

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-800/90 pb-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-amber-300">
                {latestItem.record.version}
              </span>
              <span className="text-xs font-semibold text-amber-200/90 tracking-wide">
                {latestItem.kind === 'admin_only'
                  ? 'Khusus Admin · Rilis Terbaru'
                  : 'Update Campuran (Tampil Utuh Tanpa Filter)'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{latestItem.record.fullDate || latestItem.record.dateText}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug [text-wrap:balance]">
              {latestItem.record.title}
            </h2>

            <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {latestItem.record.description}
            </p>
          </div>

          {latestPoints.length > 0 && (
            <div className="pt-2 space-y-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-amber-300 tracking-wide">
                Rincian Lengkap Pembaruan pada {latestItem.record.version}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                {latestPoints.map((point, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed"
                  >
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>
                Diterbitkan oleh{' '}
                <strong className="text-slate-200 font-semibold">
                  {latestItem.record.author || 'Super Admin Utama (AzkaAKC)'}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Jalur Versi Internal Admin (Terpisah dari Publik)</span>
            </div>
          </div>
        </section>
      ) : (
        <div className="rounded-2xl bg-slate-900/75 border border-slate-800 p-8 text-center text-sm text-slate-400">
          Belum ada catatan pembaruan Admin yang tersimpan.
        </div>
      )}

      {/* BAGIAN 2: ARSIP RIWAYAT UPDATE ADMIN & CAMPURAN (UNFILTERED TIMELINE) */}
      <section aria-label="Arsip Riwayat Update Admin" className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Arsip Lengkap Pembaruan Admin &amp; Campuran
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Menampilkan seluruh rilis khusus Admin maupun rilis gabungan beserta poin internal yang disembunyikan dari publik.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Interactive Segmented Filter */}
            <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setKindFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  kindFilter === 'all'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua ({counts.all})
              </button>
              <button
                type="button"
                onClick={() => setKindFilter('admin_only')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  kindFilter === 'admin_only'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Khusus Admin ({counts.adminOnly})
              </button>
              <button
                type="button"
                onClick={() => setKindFilter('mixed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  kindFilter === 'mixed'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Campuran ({counts.mixed})
              </button>
            </div>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari versi Admin, judul pembaruan, fitur Panel Admin, atau tanggal..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-400/70 focus:outline-none text-sm text-white placeholder-slate-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Hapus pencarian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filteredHistory.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-200">
              Tidak ada catatan pembaruan Admin yang cocok dengan filter saat ini.
            </p>
            <p className="text-xs text-slate-400">
              Coba ubah kata kunci pencarian atau pilih kategori Semua.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-amber-500/30">
            {filteredHistory.map((item) => {
              const rec = item.record;
              const pts =
                rec.highlights && rec.highlights.length > 0 ? rec.highlights : rec.changes || [];
              return (
                <article
                  key={rec.id}
                  className="relative rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/35 transition-colors px-5 py-5 sm:px-7 sm:py-6 space-y-4"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-[22px] sm:-left-[26px] top-7 w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-slate-950"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono tabular-nums text-lg font-bold text-amber-300">
                        {rec.version}
                      </span>
                      <span className="text-xs font-medium text-slate-400">
                        {item.kind === 'admin_only'
                          ? 'Khusus Admin'
                          : `Campuran · ${item.hiddenPublicPointsCount} poin internal disaring dari publik`}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      {rec.fullDate || rec.dateText}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                      {rec.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {rec.description}
                    </p>
                  </div>

                  {pts.length > 0 && (
                    <ul className="space-y-2 pt-2 border-t border-slate-800/70">
                      {pts.map((p, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-[13px] text-slate-200 leading-relaxed"
                        >
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-1" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="text-[11px] text-slate-500 pt-1">
                    Oleh <span className="text-slate-300 font-medium">{rec.author || 'Tim Admin Bank Nusantara'}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Tambah Update Admin Cepat (Khusus Super Admin) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-amber-400/40 shadow-2xl overflow-hidden text-white">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-white">Tambah Update Khusus Admin</h3>
                  <p className="text-[11px] text-slate-400">
                    Disimpan terpisah dengan versi vAdmin tanpa menaikkan versi publik ({publicVersionLabel}).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishAdminUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Versi Admin (Terpisah)
                  </label>
                  <input
                    type="text"
                    required
                    value={draftVersion}
                    onChange={(e) => setDraftVersion(e.target.value)}
                    placeholder="vAdmin 1.1.0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm font-mono tabular-nums text-amber-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Label Kategori Internal
                  </label>
                  <input
                    type="text"
                    value={draftCategory}
                    onChange={(e) => setDraftCategory(e.target.value)}
                    placeholder="Rilis Internal Admin"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Judul Update Admin
                </label>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Contoh: Penyempurnaan Kontrol RBAC & Audit Real-Time"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Deskripsi Lengkap
                </label>
                <textarea
                  rows={3}
                  required
                  value={draftDescription}
                  onChange={(e) => setDraftDescription(e.target.value)}
                  placeholder="Tuliskan ringkasan lengkap pembaruan khusus Admin..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white resize-y"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Daftar Poin Perubahan (satu poin per baris)
                </label>
                <textarea
                  rows={4}
                  value={draftHighlightsText}
                  onChange={(e) => setDraftHighlightsText(e.target.value)}
                  placeholder={'Peningkatan sistem izin per-tab Panel Admin\nPembaruan deteksi lokasi Multi-Server GeoIP'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-sm text-white resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Terbitkan Update Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
