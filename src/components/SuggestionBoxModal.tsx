/**
 * Bank Nusantara — Modal Kirim Saran & Ide Fitur + Program Hadiah Saran (v15.39.49)
 * Terhubung dari tombol paling bawah tepat di sebelah Lapor Bug.
 */
import React, { useState, useRef } from 'react';
import {
  Lightbulb,
  X,
  Send,
  Gift,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Gem,
  AlertCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { SuggestionPriority } from '../types/bank';
import { formatRupiah } from '../utils/bankUtils';
import {
  SUGGESTION_CATEGORIES,
  SUGGESTION_PRIORITIES,
  getSuggestionStatusMeta,
  hasAnySuggestionRewardConfigured,
} from '../data/suggestionRewardCatalog';

export const SuggestionBoxModal: React.FC = () => {
  const {
    currentAccount,
    googleUser,
    suggestions,
    suggestionRewardConfig,
    isSuggestionModalOpen,
    setIsSuggestionModalOpen,
    submitSuggestion,
  } = useBank();

  const [activeModalTab, setActiveModalTab] = useState<'form' | 'history'>('form');
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>(SUGGESTION_CATEGORIES[0]);
  const [priority, setPriority] = useState<SuggestionPriority>('sedang');
  const [explanation, setExplanation] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isSuggestionModalOpen) return null;

  const mySuggestions = suggestions.filter(
    (s) =>
      (currentAccount && s.reporterAccountId === currentAccount.id) ||
      (currentAccount && s.reporterAccountNumber === currentAccount.accountNumber) ||
      (googleUser?.email && s.reporterEmail === googleUser.email)
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', text: 'File harus berupa gambar (PNG/JPG/WebP).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxDim = 1080;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setPhotoDataUrl(canvas.toDataURL('image/jpeg', 0.8));
          setPhotoFileName(file.name);
        } else {
          setPhotoDataUrl(rawUrl);
          setPhotoFileName(file.name);
        }
      };
      img.onerror = () => {
        setPhotoDataUrl(rawUrl);
        setPhotoFileName(file.name);
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFeedback(null);
    setSubmitting(true);
    const res = await submitSuggestion({
      title,
      category,
      priority,
      explanation,
      photoDataUrl: photoDataUrl || undefined,
      photoFileName: photoFileName || undefined,
    });
    setSubmitting(false);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.message });
      return;
    }
    setFeedback({ type: 'success', text: res.message });
    setTitle('');
    setExplanation('');
    setPhotoDataUrl('');
    setPhotoFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setActiveModalTab('history');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-indigo-500/40 text-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-teal-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-white truncate">
                Kirim Saran &amp; Ide Fitur Bank Nusantara
              </h3>
              <p className="text-[11px] text-indigo-200/80 truncate">
                Sampaikan ide fitur, peningkatan UI, atau masukan membangun langsung ke Panel Admin
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSuggestionModalOpen(false)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveModalTab('form')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeModalTab === 'form'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Kirim Saran Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeModalTab === 'history'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <span>Riwayat Saran Saya</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/15 text-[10px] tabular-nums">
              {mySuggestions.length}
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Banner Program Hadiah Saran (Auto-hidden if disabled by Admin) */}
          {suggestionRewardConfig.enabled &&
            hasAnySuggestionRewardConfigured(suggestionRewardConfig) && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-teal-950/70 border border-indigo-400/35 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-300 shrink-0" />
                    <span className="font-extrabold text-amber-300 text-xs sm:text-sm">
                      Program Hadiah Saran Terpilih Aktif!
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Cair Otomatis saat Diterima Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Setiap ide atau saran terbaik yang diterima &amp; diapresiasi Admin berhak mendapatkan paket hadiah berikut langsung ke akun Anda:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestionRewardConfig.cashAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-bold text-[11px] tabular-nums">
                      +{formatRupiah(suggestionRewardConfig.cashAmount)}
                    </span>
                  )}
                  {suggestionRewardConfig.coinAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200 font-bold text-[11px] tabular-nums">
                      +{suggestionRewardConfig.coinAmount.toLocaleString('id-ID')} Coin
                    </span>
                  )}
                  {suggestionRewardConfig.diamondAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-200 font-bold text-[11px] inline-flex items-center gap-1 tabular-nums">
                      <Gem className="w-3 h-3" />+{suggestionRewardConfig.diamondAmount.toLocaleString('id-ID')} Permata
                    </span>
                  )}
                  {suggestionRewardConfig.goldGrams > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-yellow-500/15 border border-yellow-400/30 text-yellow-200 font-bold text-[11px] tabular-nums">
                      +{suggestionRewardConfig.goldGrams.toLocaleString('id-ID')} gr Emas 24K
                    </span>
                  )}
                  {suggestionRewardConfig.voucherAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-400/30 text-violet-200 font-bold text-[11px] tabular-nums">
                      +{suggestionRewardConfig.voucherAmount.toLocaleString('id-ID')} Voucher Level
                    </span>
                  )}
                  {suggestionRewardConfig.pointsAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 font-bold text-[11px] tabular-nums">
                      +{suggestionRewardConfig.pointsAmount.toLocaleString('id-ID')} Poin
                    </span>
                  )}
                  {suggestionRewardConfig.familySlotAmount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-400/30 text-teal-200 font-bold text-[11px] tabular-nums">
                      +{suggestionRewardConfig.familySlotAmount.toLocaleString('id-ID')} Slot Keluarga
                    </span>
                  )}
                </div>
              </div>
            )}

          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {activeModalTab === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Judul Singkat Saran <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Tambah fitur stiker lucu di Chat Global & Privat"
                  className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-200 block mb-1">Kategori Saran</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-400"
                  >
                    {SUGGESTION_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-200 block mb-1">
                    Tingkat Dampak / Prioritas
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SuggestionPriority)}
                    className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-400"
                  >
                    {SUGGESTION_PRIORITIES.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Penjelasan Lengkap Ide / Saran <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={3000}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Jelaskan ide fitur atau saran Anda sedetail mungkin serta manfaatnya bagi nasabah Bank Nusantara..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Optional Image / Mockup Reference */}
              <div className="space-y-2">
                <label className="font-bold text-slate-200 block">
                  Lampirkan Foto / Sketsa Referensi <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{photoDataUrl ? 'Ganti Gambar' : 'Pilih Gambar / Mockup'}</span>
                  </button>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl('');
                        setPhotoFileName('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
                {photoDataUrl && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-slate-800 inline-block">
                    <img
                      src={photoDataUrl}
                      alt={photoFileName || 'Referensi saran'}
                      className="max-h-40 rounded-lg object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSuggestionModalOpen(false)}
                  className="px-4 min-h-[42px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !explanation.trim()}
                  className="px-5 min-h-[42px] rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 disabled:opacity-50 text-white font-extrabold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Mengirim...' : 'Kirim Saran Sekarang'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {mySuggestions.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <Sparkles className="w-9 h-9 text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-200">Anda belum pernah mengirim saran</p>
                  <p>Kirim ide fitur terbaik Anda dan berkesempatan memperoleh hadiah langsung dari Admin!</p>
                </div>
              ) : (
                mySuggestions.map((s) => {
                  const meta = getSuggestionStatusMeta(s.status);
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-white text-sm">{s.title}</h4>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{s.category}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(s.createdAt).toLocaleString('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold whitespace-nowrap ${meta.badgeClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>

                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {s.explanation}
                      </p>

                      {s.photoDataUrl && (
                        <img
                          src={s.photoDataUrl}
                          alt="Lampiran saran"
                          className="max-h-36 rounded-xl border border-slate-800 object-contain"
                        />
                      )}

                      {s.adminReply && (
                        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-100">
                          <span className="font-bold text-indigo-300 block mb-0.5">
                            Balasan Admin Bank Nusantara:
                          </span>
                          <p>{s.adminReply}</p>
                        </div>
                      )}

                      {s.reward?.given && (
                        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-emerald-100 space-y-1">
                          <span className="font-extrabold text-emerald-300 flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5" />
                            Hadiah Program Saran Sudah Cair ke Akun Anda!
                          </span>
                          <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-bold">
                            {s.reward.cashAmount > 0 && (
                              <span>+{formatRupiah(s.reward.cashAmount)}</span>
                            )}
                            {s.reward.coinAmount > 0 && <span>+{s.reward.coinAmount} Coin</span>}
                            {s.reward.diamondAmount > 0 && (
                              <span>+{s.reward.diamondAmount} Permata</span>
                            )}
                            {(s.reward.goldGrams || 0) > 0 && (
                              <span>+{s.reward.goldGrams} gr Emas</span>
                            )}
                            {s.reward.voucherAmount > 0 && (
                              <span>+{s.reward.voucherAmount} Voucher</span>
                            )}
                            {s.reward.pointsAmount > 0 && (
                              <span>+{s.reward.pointsAmount} Poin</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
