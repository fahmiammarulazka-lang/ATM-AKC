/**
 * Bank Nusantara — Halaman Riwayat Update Editorial Gelap Mewah
 * - Menampilkan rilis publik secara konsisten (catatan & poin khusus Admin otomatis disaring)
 * - Nomor versi tampil bersih & ringkas tanpa lencana tipe rilis maupun kotak panduan format
 * - Garis timeline vertikal terbuka penuh tanpa tombol "Lihat Detail" dan tanpa pemotongan teks
 * - Dilengkapi pencarian real-time + filter segmen Semua, Era Baru, dan Arsip Lama
 */
import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Search,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { isStructuredThreePartVersion } from '../services/autoUpdateReleaseService';

interface UpdateHistoryViewProps {
  onNavigateToView: (view: 'dashboard' | 'atm' | 'admin' | 'guide' | 'chat' | 'updates') => void;
}

type EraFilter = 'all' | 'new_era' | 'legacy';

export const UpdateHistoryView: React.FC<UpdateHistoryViewProps> = ({
  onNavigateToView,
}) => {
  const { publicAppUpdates, publicCurrentUpdate, activeBuildInfo } = useBank();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [eraFilter, setEraFilter] = useState<EraFilter>('all');

  const currentUpdate = publicCurrentUpdate || publicAppUpdates[0] || null;
  const previousUpdates = useMemo(
    () => publicAppUpdates.filter((u) => u.id !== currentUpdate?.id),
    [publicAppUpdates, currentUpdate?.id]
  );

  const eraCounts = useMemo(() => {
    let newEra = 0;
    let legacy = 0;
    for (const item of previousUpdates) {
      if (isStructuredThreePartVersion(item.version)) {
        newEra += 1;
      } else {
        legacy += 1;
      }
    }
    return { all: previousUpdates.length, newEra, legacy };
  }, [previousUpdates]);

  const filteredPreviousUpdates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return previousUpdates.filter((u) => {
      if (eraFilter === 'new_era' && !isStructuredThreePartVersion(u.version)) return false;
      if (eraFilter === 'legacy' && isStructuredThreePartVersion(u.version)) return false;
      if (!q) return true;
      const pointsText = (u.highlights || u.changes || []).join(' ').toLowerCase();
      return (
        u.title.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q) ||
        (u.fullDate || u.dateText || '').toLowerCase().includes(q) ||
        u.version.toLowerCase().includes(q) ||
        pointsText.includes(q)
      );
    });
  }, [previousUpdates, searchQuery, eraFilter]);

  const currentPoints =
    currentUpdate?.highlights && currentUpdate.highlights.length > 0
      ? currentUpdate.highlights
      : currentUpdate?.changes || [];

  const activeVersionLabel =
    currentUpdate?.version || activeBuildInfo.catalogVersion || 'v12.34.00';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 pb-12">
      {/* Editorial Header */}
      <header className="relative overflow-hidden rounded-2xl bg-slate-900/75 border border-slate-800 px-6 py-7 sm:px-9 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
        />
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-slate-400">
              <span className="text-emerald-400 font-semibold">Catatan Rilis Resmi</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-amber-300 font-semibold">{activeVersionLabel}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{publicAppUpdates.length} Rilis Publik</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Build {activeBuildInfo.buildId}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white [text-wrap:balance]">
              Riwayat Pembaruan Bank Nusantara
            </h1>

            <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed max-w-2xl">
              Seluruh pembaruan fitur, peningkatan kenyamanan transaksi, dan perbaikan stabilitas aplikasi tersusun rapi secara kronologis dari versi terbaru hingga arsip terdahulu.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToView('guide')}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Buku Panduan</span>
            </button>
          </div>
        </div>
      </header>

      {/* BAGIAN 1: UPDATE SEKARANG (Focal Hero) */}
      {currentUpdate ? (
        <section
          aria-label="Pembaruan Terbaru"
          className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/85 to-slate-950 border border-emerald-500/35 px-6 py-7 sm:px-9 sm:py-9 space-y-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-emerald-500/10 via-emerald-400/80 to-amber-300/60"
          />

          {/* Top Editorial Meta Row */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-800/90 pb-5">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
              <span className="font-mono tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400">
                {currentUpdate.version}
              </span>
              <span className="text-xs font-semibold text-amber-300 tracking-wide">
                Update Sekarang
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{currentUpdate.fullDate || currentUpdate.dateText}</span>
            </div>
          </div>

          {/* Full Headline & Full Description (Zero Truncation) */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug [text-wrap:balance]">
              {currentUpdate.title}
            </h2>

            <p className="text-sm sm:text-[15px] text-slate-300 leading-relaxed whitespace-pre-wrap">
              {currentUpdate.description}
            </p>
          </div>

          {/* Full List of Public Highlights */}
          {currentPoints.length > 0 && (
            <div className="pt-2 space-y-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-emerald-300 tracking-wide">
                Rincian Pembaruan pada {currentUpdate.version}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5">
                {currentPoints.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed"
                  >
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Meta + Primary Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span>
                Diterbitkan oleh{' '}
                <strong className="text-slate-200 font-semibold">
                  {currentUpdate.author || 'Tim Pengembangan Bank Nusantara'}
                </strong>
              </span>
              {currentUpdate.buildId && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono tabular-nums text-slate-400">
                    ID Build {currentUpdate.buildId}
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => onNavigateToView('dashboard')}
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <span>Buka Dashboard Mobile Banking</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl bg-slate-900/70 border border-slate-800 px-6 py-12 text-center space-y-2">
          <p className="text-sm font-semibold text-white">
            Belum ada catatan pembaruan publik yang tersedia.
          </p>
          <p className="text-xs text-slate-400">
            Catatan pembaruan terbaru akan muncul otomatis di halaman ini segera setelah diterbitkan.
          </p>
        </section>
      )}

      {/* BAGIAN 2: ARSIP TIMELINE VERTIKAL UPDATE SEBELUMNYA */}
      <section aria-label="Riwayat Update Sebelumnya" className="space-y-6">
        {/* Toolbar: Heading + Segmented Era Filter + Live Search */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-5 border-b border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400">
              <span>Arsip Kronologis</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-amber-300 font-semibold">
                {filteredPreviousUpdates.length} dari {previousUpdates.length} Rilis Sebelumnya
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Riwayat Update Sebelumnya
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Segmented Filter Control: Semua / Era Baru / Arsip Lama */}
            <div
              role="tablist"
              aria-label="Filter era riwayat update"
              className="inline-flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={eraFilter === 'all'}
                onClick={() => setEraFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  eraFilter === 'all'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua · {eraCounts.all}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={eraFilter === 'new_era'}
                onClick={() => setEraFilter('new_era')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  eraFilter === 'new_era'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Era Baru · {eraCounts.newEra}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={eraFilter === 'legacy'}
                onClick={() => setEraFilter('legacy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  eraFilter === 'legacy'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Arsip Lama · {eraCounts.legacy}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari versi, fitur, atau tanggal"
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-emerald-400/70 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Vertical Editorial Timeline (Terbuka Penuh, Tanpa Tombol Lihat Detail & Tanpa Pemotongan) */}
        {filteredPreviousUpdates.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 px-6 py-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-200">
              Tidak ditemukan catatan update yang sesuai dengan filter saat ini.
            </p>
            <p className="text-xs text-slate-400">
              Ubah kata kunci pencarian atau pilih kategori Semua untuk melihat seluruh arsip rilis.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setEraFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-9">
            {/* Garis Timeline Vertikal */}
            <div
              aria-hidden="true"
              className="absolute left-2 sm:left-3 top-2 bottom-2 w-px bg-gradient-to-b from-emerald-500/60 via-slate-800 to-slate-900"
            />

            <div className="space-y-8">
              {filteredPreviousUpdates.map((upd) => {
                const isNewEra = isStructuredThreePartVersion(upd.version);
                const points =
                  upd.highlights && upd.highlights.length > 0
                    ? upd.highlights
                    : upd.changes || [];

                return (
                  <article
                    key={upd.id}
                    className="relative rounded-2xl bg-slate-900/60 border border-slate-800/90 hover:border-slate-700 transition-colors px-5 py-6 sm:px-7 sm:py-7 space-y-4"
                  >
                    {/* Simpul Garis Timeline */}
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[22px] sm:-left-[30px] top-7 w-3 h-3 rounded-full border-2 ${
                        isNewEra
                          ? 'bg-emerald-400 border-slate-950 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]'
                          : 'bg-slate-600 border-slate-950'
                      }`}
                    />

                    {/* Baris Metadata Editorial Tanpa Kapsul */}
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3.5 border-b border-slate-800/80">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span
                          className={`font-mono tabular-nums text-base sm:text-lg font-bold tracking-tight ${
                            isNewEra ? 'text-emerald-400' : 'text-amber-300'
                          }`}
                        >
                          {upd.version}
                        </span>
                        {upd.buildId && (
                          <>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono tabular-nums text-[11px] text-slate-400">
                              Build {upd.buildId}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono tabular-nums text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{upd.fullDate || upd.dateText}</span>
                      </div>
                    </div>

                    {/* Judul & Deskripsi Lengkap Tanpa Pemotongan */}
                    <div className="space-y-3">
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                        {upd.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {upd.description}
                      </p>
                    </div>

                    {/* Daftar Poin Perubahan Terbuka Penuh */}
                    {points.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/70 space-y-2.5">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Rincian Perubahan
                        </span>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-7 gap-y-2.5">
                          {points.map((point, pIdx) => (
                            <li
                              key={pIdx}
                              className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-300 leading-relaxed"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"
                              />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
