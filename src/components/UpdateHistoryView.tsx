/**
 * Bank Nusantara — Riwayat Update Resmi (Update Sekarang & Update Sebelumnya)
 * Sesuai permintaan user:
 * "Di sebelah panduan itu ada riwayat update yang menampilkan update sekarang dan juga update sebelumnya.
 *  Tanggalnya lengkap, namanya, deskripsinya, dan itu bisa diisi di panel admin."
 */
import React, { useState } from 'react';
import {
  History,
  Sparkles,
  Calendar,
  CheckCircle2,
  BookOpen,
  Search,
  Layers,
  Clock,
  ShieldCheck,
  ArrowRight,
  Wrench,
  FileText,
} from 'lucide-react';
import { useBank } from '../context/BankContext';

interface UpdateHistoryViewProps {
  onNavigateToView: (view: 'dashboard' | 'atm' | 'admin' | 'guide' | 'chat' | 'updates') => void;
  onOpenAdminUpdateManager?: () => void;
}

export const UpdateHistoryView: React.FC<UpdateHistoryViewProps> = ({
  onNavigateToView,
  onOpenAdminUpdateManager,
}) => {
  const { appUpdates, featureConfigs } = useBank();
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Separate Current Update ("Update Sekarang") and Previous Updates ("Update Sebelumnya")
  const currentUpdate = appUpdates.find((u) => u.isCurrent) || appUpdates[0] || null;
  const previousUpdates = appUpdates.filter((u) => u.id !== currentUpdate?.id);

  const filteredPreviousUpdates = previousUpdates.filter(
    (u) =>
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.fullDate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.version.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Banner with Quick Switch to Panduan (Next to it) & Admin Portal */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/50 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>PUSAT CATATAN RILIS & RIWAYAT UPDATE RESMI</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold text-[10px]">
              Total {appUpdates.length} Catatan Update • {featureConfigs.length}+ Fitur Aktif
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            📜 Riwayat Update — Update Sekarang &amp; Update Sebelumnya
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Halaman ini menampilkan <strong>Update Sekarang (Versi Terbaru)</strong> beserta daftar lengkap <strong>Update Sebelumnya</strong> dengan <strong>Tanggal Lengkap</strong>, <strong>Nama Update</strong>, dan <strong>Deskripsi Lengkap</strong>. Seluruh riwayat update ini dapat ditambahkan, diisi, atau diperbarui kapan saja melalui <strong>Panel Admin</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToView('guide')}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-600/25 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>← Buku Panduan (60 Bab)</span>
          </button>

          {onOpenAdminUpdateManager && (
            <button
              type="button"
              onClick={onOpenAdminUpdateManager}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>Isi / Tambah Update di Panel Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* =====================================================================
          BAGIAN 1: UPDATE SEKARANG (VERSI TERBARU SAAT INI)
         ===================================================================== */}
      {currentUpdate && (
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-950 border-2 border-emerald-400/70 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>🌟 UPDATE SEKARANG (SAAT INI)</span>
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono font-black text-xs">
                Versi {currentUpdate.version}
              </span>
              {currentUpdate.categoryBadge && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 font-mono text-[11px] font-semibold">
                  {currentUpdate.categoryBadge}
                </span>
              )}
            </div>

            {/* Tanggal Lengkap */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Tanggal Lengkap: {currentUpdate.fullDate}</span>
            </div>
          </div>

          {/* Nama Update & Deskripsi Lengkap */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                NAMA UPDATE SEKARANG:
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 leading-snug">
                {currentUpdate.title}
              </h2>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>DESKRIPSI LENGKAP UPDATE SEKARANG:</span>
              </span>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                {currentUpdate.description}
              </p>
            </div>

            {/* Poin Rincian Perubahan (Highlights) */}
            {currentUpdate.highlights && currentUpdate.highlights.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                  ✓ Rincian Fitur &amp; Pembaruan pada {currentUpdate.version}:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {currentUpdate.highlights.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Diterbitkan oleh: <strong className="text-white">{currentUpdate.author || 'Admin Utama Bank Nusantara'}</strong></span>
            </span>
            <button
              type="button"
              onClick={() => onNavigateToView('dashboard')}
              className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Coba Fitur Terbaru di Mobile Banking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          BAGIAN 2: RIWAYAT UPDATE SEBELUMNYA (LENGKAP DENGAN TANGGAL, NAMA & DESKRIPSI)
         ===================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono font-bold text-[10px] uppercase tracking-wider">
                ARSIP KRONOLOGIS
              </span>
              <span className="text-xs font-mono text-amber-300 font-bold">
                {previousUpdates.length} Update Sebelumnya
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Daftar Riwayat Update Sebelumnya</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Catatan lengkap seluruh update terdahulu beserta tanggal lengkap, nama versi, dan deskripsi perubahannya.
            </p>
          </div>

          {/* Search Previous Updates */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama update, versi, atau tanggal..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {filteredPreviousUpdates.length === 0 ? (
          <div className="p-10 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Tidak ditemukan catatan update sebelumnya yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPreviousUpdates.map((upd, idx) => (
              <div
                key={upd.id}
                className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-[10px] uppercase">
                      UPDATE SEBELUMNYA #{previousUpdates.length - idx}
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 font-mono font-black text-xs">
                      {upd.version}
                    </span>
                    {upd.categoryBadge && (
                      <span className="px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[10px] font-semibold">
                        {upd.categoryBadge}
                      </span>
                    )}
                  </div>

                  {/* Tanggal Lengkap */}
                  <div className="flex items-center gap-1.5 text-xs font-mono text-amber-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{upd.fullDate}</span>
                  </div>
                </div>

                {/* Nama Update */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                    Nama Update:
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {upd.title}
                  </h4>
                </div>

                {/* Deskripsi Lengkap */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/90 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold block">
                    Deskripsi Lengkap:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {upd.description}
                  </p>
                </div>

                {/* Highlights if available */}
                {upd.highlights && upd.highlights.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                      Daftar Perubahan ({upd.highlights.length} Poin):
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                      {upd.highlights.map((h, i) => (
                        <li
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-start gap-2"
                        >
                          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
