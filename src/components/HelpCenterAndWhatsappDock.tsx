/**
 * Tombol Logo WhatsApp Pojok Kanan Bawah Dashboard + Popup 2 Pilihan (Pusat Bantuan FAQ & Contact Us)
 * - Tombol bulat hijau khas WhatsApp (#25D366) bersih dengan tooltip "Bantuan"
 * - Selalu tampil di sebelah kanan tombol Surat & Hadiah Admin
 * - Pusat Bantuan 50+ FAQ (5 Kategori Utama, pencarian real-time, akordeon + langkah bernomor + tips)
 * - Contact Us (WhatsApp & Email) dengan pemilih Topik Kendala, template tiket panjang & lengkap
 *   yang otomatis terisi seluruh data akun aktif (Nama, No. Rek, User ID, Tier, Email, Domisili, Status Kartu),
 *   tautan wa.me & mailto aman, serta tombol Salin Pesan Lengkap 1-klik.
 */
import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Lightbulb,
  Clock,
  ArrowRight,
  BookOpen,
  Headphones,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { SupportFaqCategory } from '../types/bank';
import {
  SUPPORT_FAQ_CATEGORIES,
  SUPPORT_CONTACT_TOPICS,
  formatWhatsappDisplay,
  interpolateSupportTemplate,
  buildWhatsAppSupportUrl,
  buildEmailSupportUrl,
  SupportTemplateVars,
} from '../data/supportFaqCatalog';
import { CARD_TIER_CONFIGS, ensureAccountUserId16, formatUserId16 } from '../utils/bankUtils';

const WhatsAppGlyph: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M16.003 3.2c-7.058 0-12.8 5.742-12.8 12.8 0 2.256.59 4.458 1.71 6.398L3.1 28.9l6.678-1.752a12.74 12.74 0 0 0 6.225 1.616h.005c7.057 0 12.797-5.742 12.797-12.8 0-3.42-1.333-6.635-3.752-9.052A12.718 12.718 0 0 0 16.003 3.2Zm0 23.402h-.004a10.59 10.59 0 0 1-5.402-1.48l-.388-.23-3.963 1.04 1.058-3.864-.252-.402a10.587 10.587 0 0 1-1.622-5.664c0-5.845 4.756-10.602 10.606-10.602 2.832 0 5.494 1.104 7.495 3.106a10.54 10.54 0 0 1 3.103 7.5c-.002 5.845-4.758 10.596-10.631 10.596Zm5.814-7.943c-.318-.16-1.886-.93-2.178-1.037-.292-.106-.505-.16-.718.16-.213.318-.824 1.036-1.01 1.249-.186.213-.372.24-.69.08-.318-.16-1.345-.496-2.562-1.58-.947-.844-1.586-1.886-1.772-2.205-.186-.318-.02-.49.14-.649.144-.143.318-.372.478-.558.16-.186.213-.319.319-.531.106-.213.053-.399-.027-.558-.08-.16-.718-1.73-.984-2.368-.26-.623-.523-.538-.718-.548-.186-.01-.399-.012-.612-.012-.213 0-.558.08-.85.399-.293.318-1.117 1.09-1.117 2.66 0 1.568 1.143 3.084 1.303 3.296.16.213 2.25 3.435 5.451 4.817.762.329 1.356.525 1.82.673.764.243 1.46.208 2.01.126.613-.092 1.886-.771 2.152-1.516.266-.744.266-1.382.186-1.515-.08-.133-.292-.213-.611-.372Z" />
  </svg>
);

const MAIN_5_CATEGORIES: SupportFaqCategory[] = [
  'akun',
  'kartu',
  'atm',
  'pinjaman',
  'keamanan',
];

function formatCardStatusLabel(status?: string): string {
  switch (status) {
    case 'active':
      return 'AKTIF';
    case 'pending_approval':
      return 'MENUNGGU PERSETUJUAN ADMIN';
    case 'frozen':
      return 'DIBEKUKAN (FREEZE)';
    case 'banned':
      return 'DITANGGUHKAN (BANNED)';
    case 'rejected':
      return 'DITOLAK';
    default:
      return (status || 'AKTIF').toUpperCase();
  }
}

export interface HelpCenterAndWhatsappDockProps {
  externalOpenRequest?: 'menu' | 'faq' | 'contact' | null;
  onExternalRequestHandled?: () => void;
  onMenuOpening?: () => void;
}

export const HelpCenterAndWhatsappDock: React.FC<HelpCenterAndWhatsappDockProps> = ({
  onMenuOpening,
}) => {
  const { currentAccount, googleUser, supportFaqs, supportContactConfig } = useBank();

  const [quickPopupOpen, setQuickPopupOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'none' | 'faq' | 'contact'>('none');

  // FAQ state
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SupportFaqCategory>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Contact Us state
  const [selectedTopicId, setSelectedTopicId] = useState<string>(SUPPORT_CONTACT_TOPICS[0].id);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [extraNote, setExtraNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeFaqs = useMemo(
    () => supportFaqs.filter((f) => f.isActive !== false),
    [supportFaqs]
  );

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: activeFaqs.length };
    for (const f of activeFaqs) {
      map[f.category] = (map[f.category] || 0) + 1;
    }
    return map;
  }, [activeFaqs]);

  const visibleCategories = useMemo(() => {
    const base = SUPPORT_FAQ_CATEGORIES.filter(
      (c) => MAIN_5_CATEGORIES.includes(c.id) || (categoryCounts[c.id] || 0) > 0
    );
    return base;
  }, [categoryCounts]);

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return activeFaqs.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (!q) return true;
      const inQuestion = item.question.toLowerCase().includes(q);
      const inAnswer = item.answer.toLowerCase().includes(q);
      const inSteps = (item.steps || []).some((s) => s.toLowerCase().includes(q));
      const inKeywords = (item.keywords || []).some((k) => k.toLowerCase().includes(q));
      return inQuestion || inAnswer || inSteps || inKeywords;
    });
  }, [activeFaqs, selectedCategory, faqSearch]);

  const selectedTopicObj = useMemo(
    () =>
      SUPPORT_CONTACT_TOPICS.find((t) => t.id === selectedTopicId) ||
      SUPPORT_CONTACT_TOPICS[0],
    [selectedTopicId]
  );

  const templateVars: SupportTemplateVars = useMemo(() => {
    const nowFormatted = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const resolvedEmail =
      currentAccount?.googleEmail ||
      currentAccount?.email ||
      googleUser?.email ||
      'Tidak terhubung / Akun Tanpa Email';
    const resolvedAddress = currentAccount?.isGuestAccount
      ? 'Akun Guest (Tanpa Alamat Domisili)'
      : currentAccount?.address?.trim() || 'Belum dilengkapi';
    const tierCfg = currentAccount
      ? CARD_TIER_CONFIGS[currentAccount.cardTier]
      : undefined;

    return {
      nama: currentAccount?.fullName || googleUser?.name || 'Nasabah Bank Nusantara',
      no_rek: currentAccount?.accountNumber || 'Belum Ada Rekening',
      user_id: currentAccount ? formatUserId16(ensureAccountUserId16(currentAccount)) : '-',
      tier: tierCfg ? `${tierCfg.name} (${currentAccount?.cardTier.toUpperCase()})` : 'Reguler',
      email: resolvedEmail,
      domisili: resolvedAddress,
      status_kartu: formatCardStatusLabel(currentAccount?.cardStatus || currentAccount?.status),
      topik: selectedTopicObj.label,
      waktu: `${nowFormatted} WIB`,
    };
  }, [currentAccount, googleUser, selectedTopicObj]);

  const previewWhatsappMessage = useMemo(() => {
    const base = interpolateSupportTemplate(
      supportContactConfig.whatsappAutoMessage,
      templateVars
    );
    return extraNote.trim()
      ? `${base}\n\nCATATAN TAMBAHAN NASABAH:\n${extraNote.trim()}`
      : base;
  }, [supportContactConfig.whatsappAutoMessage, templateVars, extraNote]);

  const previewEmailSubject = useMemo(
    () => interpolateSupportTemplate(supportContactConfig.emailAutoSubject, templateVars),
    [supportContactConfig.emailAutoSubject, templateVars]
  );

  const previewEmailBody = useMemo(() => {
    const base = interpolateSupportTemplate(
      supportContactConfig.emailAutoBody,
      templateVars
    );
    return extraNote.trim()
      ? `${base}\n\nCATATAN TAMBAHAN NASABAH:\n${extraNote.trim()}`
      : base;
  }, [supportContactConfig.emailAutoBody, templateVars, extraNote]);

  const whatsappHref = useMemo(
    () => buildWhatsAppSupportUrl(supportContactConfig, templateVars, extraNote),
    [supportContactConfig, templateVars, extraNote]
  );

  const emailHref = useMemo(
    () => buildEmailSupportUrl(supportContactConfig, templateVars, extraNote),
    [supportContactConfig, templateVars, extraNote]
  );

  const handleCopyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2200);
  };

  const openFaqFromMenu = () => {
    setQuickPopupOpen(false);
    setActiveModal('faq');
  };

  const openContactFromMenu = (topicId?: string) => {
    if (topicId) setSelectedTopicId(topicId);
    setQuickPopupOpen(false);
    setActiveModal('contact');
  };

  const toggleQuickPopup = () => {
    const next = !quickPopupOpen;
    if (next && onMenuOpening) {
      onMenuOpening();
    }
    setQuickPopupOpen(next);
  };

  return (
    <>
      {/* Trigger Container (duduk langsung di kanan tombol Surat & Hadiah Admin) */}
      <div className="relative flex flex-col items-end">
        {/* Popup 2 Pilihan Cepat */}
        {quickPopupOpen && (
          <div className="absolute bottom-14 right-0 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-3.5 space-y-2.5 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {supportContactConfig.serviceName || 'Bantuan Bank Nusantara'}
                </h4>
                <p className="text-[11px] text-slate-400 truncate">
                  {supportContactConfig.responseEstimate || 'Siap membantu 24 Jam'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickPopupOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
                aria-label="Tutup menu bantuan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={openFaqFromMenu}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Pusat Bantuan (FAQ)
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-cyan-400">
                      {activeFaqs.length} Panduan
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Jawaban lengkap &amp; langkah bernomor seputar Akun, Kartu, ATM, Pinjaman, dan Keamanan.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => openContactFromMenu()}
                className="w-full p-3 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-lg bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] shrink-0 mt-0.5">
                  <Headphones className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Contact Us (WA &amp; Email)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Hubungi Admin resmi via WhatsApp atau Email dengan pesan tiket otomatis berisi data akun Anda.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Tombol Bulat Hijau Khas WhatsApp + Tooltip "Bantuan" */}
        <div className="relative group">
          <span
            role="tooltip"
            className="pointer-events-none absolute -top-9 right-0 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-white text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            Bantuan
          </span>
          <button
            type="button"
            onClick={toggleQuickPopup}
            title="Bantuan"
            aria-label="Bantuan & Contact Us"
            aria-expanded={quickPopupOpen}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl border-2 transition-transform active:scale-95 cursor-pointer ${
              quickPopupOpen
                ? 'bg-emerald-600 border-emerald-300 scale-105'
                : 'bg-[#25D366] hover:bg-[#1fb858] border-emerald-300/70 hover:scale-105'
            }`}
          >
            {quickPopupOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <WhatsAppGlyph className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================
          MODAL 1: PUSAT BANTUAN (50+ FAQ LENGKAP + CARI + 5 KATEGORI + AKORDEON)
         ======================================================================== */}
      {activeModal === 'faq' && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>Pusat Bantuan Resmi Bank Nusantara</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {activeFaqs.length} Topik FAQ
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Panduan Lengkap, Petunjuk Langkah &amp; Keamanan
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Temukan solusi cepat seputar pengelolaan akun, penggunaan kartu, operasional ATM, pinjaman daring, dan praktik terbaik keamanan.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer shrink-0"
                aria-label="Tutup Pusat Bantuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="px-5 py-3.5 border-b border-slate-800 space-y-3 bg-slate-900/95">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={faqSearch}
                    onChange={(e) => setFaqSearch(e.target.value)}
                    placeholder="Cari pertanyaan, contoh: ubah PIN, tarik tunai, pinjaman, alamat, banned..."
                    className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-sm text-white placeholder:text-slate-500 outline-none"
                  />
                  {faqSearch && (
                    <button
                      type="button"
                      onClick={() => setFaqSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openContactFromMenu()}
                  className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <WhatsAppGlyph className="w-4 h-4" />
                  <span>Hubungi Contact Us</span>
                </button>
              </div>

              {/* Segmented Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Semua <span className="font-mono tabular-nums opacity-80">({activeFaqs.length})</span>
                </button>
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                      selectedCategory === cat.id
                        ? cat.accentClass
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.shortLabel}{' '}
                    <span className="font-mono tabular-nums opacity-80">
                      ({categoryCounts[cat.id] || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Accordion List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5">
              {filteredFaqs.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <p className="text-sm font-semibold text-white">
                    Tidak ditemukan FAQ yang cocok dengan kata kunci &quot;{faqSearch}&quot;.
                  </p>
                  <p className="text-xs text-slate-400">
                    Anda dapat mengganti kata kunci pencarian atau langsung menghubungi Tim Admin melalui Contact Us.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFaqSearch('');
                        setSelectedCategory('all');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                    >
                      Tampilkan Semua FAQ
                    </button>
                    <button
                      type="button"
                      onClick={() => openContactFromMenu()}
                      className="px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#1fb858] text-xs font-bold text-slate-950 cursor-pointer"
                    >
                      Tanya via Contact Us
                    </button>
                  </div>
                </div>
              ) : (
                filteredFaqs.map((item, idx) => {
                  const isOpen = expandedFaqId === item.id;
                  const catMeta =
                    SUPPORT_FAQ_CATEGORIES.find((c) => c.id === item.category) ||
                    SUPPORT_FAQ_CATEGORIES[0];
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border transition-colors ${
                        isOpen
                          ? 'bg-slate-950 border-cyan-500/50'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaqId(isOpen ? null : item.id)}
                        className="w-full px-4 py-3.5 text-left flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono tabular-nums text-cyan-400 font-bold">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="font-medium text-slate-300">
                              {catMeta.shortLabel}
                            </span>
                            {item.steps && item.steps.length > 0 && (
                              <>
                                <span className="text-slate-600">·</span>
                                <span className="font-mono tabular-nums text-slate-400">
                                  {item.steps.length} Langkah
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-sm font-semibold text-white leading-snug">
                            {item.question}
                          </h3>
                        </div>
                        <span className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 shrink-0 mt-0.5">
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 space-y-3.5">
                          {/* Penjelasan Lengkap */}
                          <div className="space-y-1">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                              Penjelasan Lengkap
                            </div>
                            <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </p>
                          </div>

                          {/* Petunjuk Langkah Bernomor */}
                          {item.steps && item.steps.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                                Petunjuk Langkah demi Langkah
                              </div>
                              <ol className="space-y-1.5">
                                {item.steps.map((step, sIdx) => (
                                  <li
                                    key={sIdx}
                                    className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-200 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2"
                                  >
                                    <span className="w-5 h-5 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono tabular-nums text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                      {sIdx + 1}
                                    </span>
                                    <span className="leading-relaxed">{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* Tips Praktis / Keamanan */}
                          {item.tip && (
                            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold text-amber-300">Tips Praktis: </span>
                                <span>{item.tip}</span>
                              </div>
                            </div>
                          )}

                          {/* Pintasan Contact Us terkait kategori ini */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
                            <span className="text-[11px] text-slate-400">
                              Masih butuh bantuan lanjutan untuk topik ini?
                            </span>
                            <button
                              type="button"
                              onClick={() => openContactFromMenu(item.category)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Tanyakan ke Admin (Contact Us)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Menampilkan{' '}
                  <strong className="text-white font-mono tabular-nums">
                    {filteredFaqs.length}
                  </strong>{' '}
                  dari{' '}
                  <strong className="text-white font-mono tabular-nums">
                    {activeFaqs.length}
                  </strong>{' '}
                  panduan resmi.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          MODAL 2: CONTACT US (PILIH TOPIK + TEMPLATE TIKET PANJANG + WA / EMAIL)
         ======================================================================== */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-4 bg-slate-950/60">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <Headphones className="w-4 h-4 shrink-0" />
                  <span>{supportContactConfig.serviceName || 'Contact Us Resmi Bank Nusantara'}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {supportContactConfig.operatingHours}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                  Hubungi Layanan Nasabah (WhatsApp &amp; Email)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih topik kendala dan saluran komunikasi. Data rekening lengkap Anda terisi otomatis ke dalam pesan tiket resmi.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal('faq')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Lihat FAQ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  aria-label="Tutup Contact Us"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Step 1: Pilih Saluran Komunikasi (WhatsApp / Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!supportContactConfig.whatsappEnabled}
                  onClick={() => setSelectedChannel('whatsapp')}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedChannel === 'whatsapp'
                      ? 'bg-emerald-950/40 border-[#25D366]'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-[#25D366] text-slate-950 flex items-center justify-center shrink-0">
                        <WhatsAppGlyph className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">WhatsApp Resmi</div>
                        <div className="text-xs font-mono tabular-nums text-emerald-300">
                          {formatWhatsappDisplay(supportContactConfig.whatsappNumber)}
                        </div>
                      </div>
                    </div>
                    {selectedChannel === 'whatsapp' && (
                      <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {supportContactConfig.whatsappEnabled
                      ? `Respon cepat (${supportContactConfig.responseEstimate || '1–5 menit'}) langsung terhubung ke Admin.`
                      : 'Saluran WhatsApp sedang dinonaktifkan sementara oleh Admin.'}
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!supportContactConfig.emailEnabled}
                  onClick={() => setSelectedChannel('email')}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedChannel === 'email'
                      ? 'bg-sky-950/40 border-sky-400'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white">Email Layanan Resmi</div>
                        <div className="text-xs font-mono text-sky-300 truncate">
                          {supportContactConfig.emailAddress || 'Belum diatur Admin'}
                        </div>
                      </div>
                    </div>
                    {selectedChannel === 'email' && (
                      <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {supportContactConfig.emailEnabled
                      ? 'Cocok untuk tiket formal, lampiran tangkapan layar, dan arsip korespondensi.'
                      : 'Saluran Email sedang dinonaktifkan sementara oleh Admin.'}
                  </p>
                </button>
              </div>

              {/* Step 2: Pilih Kategori Topik Kendala */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white">
                    1. Pilih Kategori Topik Kendala
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Template tiket otomatis menyesuaikan topik pilihan Anda
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {SUPPORT_CONTACT_TOPICS.map((topic) => {
                    const active = selectedTopicId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-cyan-500/15 border-cyan-500/70 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold">{topic.shortLabel}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {topic.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ringkasan Data Akun yang Otomatis Disisipkan */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <UserCheck className="w-4 h-4 text-cyan-400" />
                  <span>Data Akun Nasabah yang Otomatis Terisi ke Pesan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                  <div>
                    <span className="text-slate-500">Nama: </span>
                    <span className="text-slate-200 font-semibold">{templateVars.nama}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">No. Rekening: </span>
                    <span className="text-slate-200 font-mono tabular-nums">{templateVars.no_rek}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">ID 16 Digit: </span>
                    <span className="text-slate-200 font-mono tabular-nums">{templateVars.user_id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Tier &amp; Status: </span>
                    <span className="text-slate-200 font-semibold">
                      {templateVars.tier} · {templateVars.status_kartu}
                    </span>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Email: </span>
                    <span className="text-slate-200 font-mono">{templateVars.email}</span>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <span className="text-slate-500">Domisili: </span>
                    <span className="text-slate-300">{templateVars.domisili}</span>
                  </div>
                </div>
              </div>

              {/* Catatan Tambahan Opsional */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-white block">
                  2. Tambahan Kronologi / Detail Kendala Anda (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={extraNote}
                  onChange={(e) => setExtraNote(e.target.value)}
                  placeholder="Contoh: Saya sudah mengajukan kartu sejak pukul 14.00 WIB, mohon bantu pengecekan aktivasi..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                />
              </div>

              {/* Pratinjau Pesan Otomatis Lengkap */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    3. Pratinjau Pesan Tiket Otomatis ({selectedChannel === 'whatsapp' ? 'WhatsApp' : 'Email'})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(
                        'message',
                        selectedChannel === 'whatsapp'
                          ? previewWhatsappMessage
                          : `Subjek: ${previewEmailSubject}\n\n${previewEmailBody}`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'message' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Pesan Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Pesan Lengkap</span>
                      </>
                    )}
                  </button>
                </div>

                {selectedChannel === 'email' && (
                  <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold">Subjek Email: </span>
                    <span className="text-sky-300 font-medium">{previewEmailSubject}</span>
                  </div>
                )}

                <pre className="w-full max-h-64 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-[11.5px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap">
                  {selectedChannel === 'whatsapp' ? previewWhatsappMessage : previewEmailBody}
                </pre>
              </div>
            </div>

            {/* Footer Action Buttons (Safe Anchor Links — NO window.open) */}
            <div className="px-5 py-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'contact_target',
                      selectedChannel === 'whatsapp'
                        ? supportContactConfig.whatsappNumber
                        : supportContactConfig.emailAddress
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'contact_target' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Kontak Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        Salin {selectedChannel === 'whatsapp' ? 'Nomor WA' : 'Alamat Email'}
                      </span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'footer_msg',
                      selectedChannel === 'whatsapp'
                        ? previewWhatsappMessage
                        : `Subjek: ${previewEmailSubject}\n\n${previewEmailBody}`
                    )
                  }
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'footer_msg' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Pesan Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Pesan</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedChannel === 'whatsapp' ? (
                  whatsappHref && supportContactConfig.whatsappEnabled ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
                    >
                      <WhatsAppGlyph className="w-4 h-4" />
                      <span>Buka WhatsApp &amp; Kirim Pesan</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold">
                      Nomor WhatsApp belum diaktifkan Admin
                    </span>
                  )
                ) : emailHref && supportContactConfig.emailEnabled ? (
                  <a
                    href={emailHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Buka Aplikasi Email &amp; Kirim</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-rose-400 font-semibold">
                    Email layanan belum diaktifkan Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
