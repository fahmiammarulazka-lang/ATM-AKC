/**
 * Tombol Logo WhatsApp Pojok Kanan Bawah Dashboard + Portal Modal Pusat Bantuan (350 FAQ Acak) & Contact Us (10 Kategori & 70 Sub-Pilihan Preset)
 * - Dirender melalui React Portal (document.body) dengan z-[9999] di atas Navbar agar header tidak pernah tertutup atau terpotong di HP maupun Laptop.
 * - Header di atas kolom pencarian menggunakan pembungkusan multi-baris utuh (tanpa truncate/potongan teks) dan responsif penuh untuk layar HP & Laptop.
 * - Pusat Bantuan 350 FAQ Acak lintas 10 kategori fitur (lengkap dengan penjelasan mendalam, 4-7 langkah bernomor, kotak tips keamanan, tombol Acak Ulang Urutan, dan pemuatan bertahap yang ringan di HP).
 * - Contact Us (WhatsApp & Email) dengan 10 Kategori Topik & 6-8 Sub-Pilihan per kategori (bisa pilih 1 atau centang beberapa sub-pilihan sekaligus) serta Kotak Editor Penjelasan Preset yang bisa diatur langsung oleh nasabah sebelum dikirim.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Shuffle,
  RotateCcw,
  Layers,
  CheckSquare,
  Square,
  Edit3,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  SupportFaqCategory,
  SupportContactCategoryPreset,
  SupportContactSubOptionPreset,
} from '../types/bank';
import {
  SUPPORT_FAQ_CATEGORIES,
  formatWhatsappDisplay,
  interpolateSupportTemplate,
  buildWhatsAppSupportUrl,
  buildEmailSupportUrl,
  SupportTemplateVars,
  getResolvedPresetCategories,
  combineSubOptionExplanations,
  shuffleSupportFaqsList,
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

const INITIAL_FAQ_BATCH_SIZE = 30;

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

  // FAQ state (350 FAQ Acak + Muat Bertahap + Acak Ulang Urutan)
  const [faqSearch, setFaqSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | SupportFaqCategory>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_FAQ_BATCH_SIZE);

  // Contact Us state (10 Kategori Topik & 6-8 Sub-Pilihan + Penjelasan Bisa Diatur)
  const resolvedCategories: SupportContactCategoryPreset[] = useMemo(
    () =>
      getResolvedPresetCategories(supportContactConfig.presetCategories).filter(
        (c) => c.isActive !== false
      ),
    [supportContactConfig.presetCategories]
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    () => resolvedCategories[0]?.id || 'akun'
  );
  const [selectedSubOptionIds, setSelectedSubOptionIds] = useState<string[]>(() => {
    const firstSub = resolvedCategories[0]?.subOptions?.find((s) => s.isActive !== false);
    return firstSub ? [firstSub.id] : [];
  });
  const [multiSelectSubMode, setMultiSelectSubMode] = useState<boolean>(false);
  const [editableExplanation, setEditableExplanation] = useState<string>('');
  const [isExplanationManuallyEdited, setIsExplanationManuallyEdited] = useState<boolean>(false);
  const [selectedChannel, setSelectedChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [extraNote, setExtraNote] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeCategoryObj: SupportContactCategoryPreset = useMemo(() => {
    return (
      resolvedCategories.find((c) => c.id === selectedCategoryId) ||
      resolvedCategories[0] || {
        id: 'akun',
        label: '1. Pengelolaan Akun, Pendaftaran & Profil',
        shortLabel: 'Akun & Profil',
        description: 'Bantuan akun dan profil nasabah Bank Nusantara.',
        subOptions: [],
      }
    );
  }, [resolvedCategories, selectedCategoryId]);

  const activeCategorySubOptions: SupportContactSubOptionPreset[] = useMemo(() => {
    return (activeCategoryObj.subOptions || []).filter((s) => s.isActive !== false);
  }, [activeCategoryObj]);

  // Pastikan selalu ada minimal 1 sub-pilihan terpilih saat kategori berubah
  useEffect(() => {
    const validIds = selectedSubOptionIds.filter((id) =>
      activeCategorySubOptions.some((s) => s.id === id)
    );
    if (validIds.length === 0 && activeCategorySubOptions.length > 0) {
      const first = activeCategorySubOptions[0];
      setSelectedSubOptionIds([first.id]);
      setEditableExplanation(first.explanation);
      setIsExplanationManuallyEdited(false);
    }
  }, [activeCategoryObj.id, activeCategorySubOptions, selectedSubOptionIds]);

  const selectedSubOptionObjects: SupportContactSubOptionPreset[] = useMemo(() => {
    const found = activeCategorySubOptions.filter((s) => selectedSubOptionIds.includes(s.id));
    if (found.length > 0) return found;
    return activeCategorySubOptions.length > 0 ? [activeCategorySubOptions[0]] : [];
  }, [activeCategorySubOptions, selectedSubOptionIds]);

  const defaultCombinedExplanation = useMemo(
    () => combineSubOptionExplanations(selectedSubOptionObjects),
    [selectedSubOptionObjects]
  );

  // Sinkronkan penjelasan preset otomatis setiap kali sub-pilihan berganti (kecuali sedang diedit manual, atau langsung update saat klik sub-pilihan baru)
  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    const cat = resolvedCategories.find((c) => c.id === catId);
    const subs = (cat?.subOptions || []).filter((s) => s.isActive !== false);
    if (subs.length > 0) {
      setSelectedSubOptionIds([subs[0].id]);
      setEditableExplanation(subs[0].explanation);
      setIsExplanationManuallyEdited(false);
    } else {
      setSelectedSubOptionIds([]);
      setEditableExplanation(
        'Saya ingin mengajukan permohonan bantuan dan pengecekan resmi pada rekening Bank Nusantara milik saya.'
      );
      setIsExplanationManuallyEdited(false);
    }
  };

  const handleClickSubOption = (sub: SupportContactSubOptionPreset) => {
    if (!multiSelectSubMode) {
      setSelectedSubOptionIds([sub.id]);
      setEditableExplanation(sub.explanation);
      setIsExplanationManuallyEdited(false);
      return;
    }

    // Mode centang beberapa sub-pilihan sekaligus
    const exists = selectedSubOptionIds.includes(sub.id);
    let nextIds: string[];
    if (exists) {
      if (selectedSubOptionIds.length <= 1) {
        nextIds = [sub.id];
      } else {
        nextIds = selectedSubOptionIds.filter((id) => id !== sub.id);
      }
    } else {
      nextIds = [...selectedSubOptionIds, sub.id];
    }
    setSelectedSubOptionIds(nextIds);
    const nextObjs = activeCategorySubOptions.filter((s) => nextIds.includes(s.id));
    setEditableExplanation(combineSubOptionExplanations(nextObjs));
    setIsExplanationManuallyEdited(false);
  };

  const handleResetExplanationToPreset = () => {
    setEditableExplanation(defaultCombinedExplanation);
    setIsExplanationManuallyEdited(false);
  };

  // Pastikan editableExplanation terisi pada render pertama
  useEffect(() => {
    if (!editableExplanation && defaultCombinedExplanation) {
      setEditableExplanation(defaultCombinedExplanation);
    }
  }, [defaultCombinedExplanation, editableExplanation]);

  const activeFaqs = useMemo(() => {
    const base = supportFaqs.filter((f) => f.isActive !== false);
    if (shuffleSeed === 0) {
      return base;
    }
    return shuffleSupportFaqsList(base, shuffleSeed);
  }, [supportFaqs, shuffleSeed]);

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: activeFaqs.length };
    for (const f of activeFaqs) {
      map[f.category] = (map[f.category] || 0) + 1;
    }
    return map;
  }, [activeFaqs]);

  const visibleCategories = useMemo(() => {
    return SUPPORT_FAQ_CATEGORIES.filter((c) => (categoryCounts[c.id] || 0) > 0);
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

  // Reset visibleCount saat filter/search berubah agar tetap ringan di HP
  useEffect(() => {
    setVisibleCount(INITIAL_FAQ_BATCH_SIZE);
  }, [selectedCategory, faqSearch, shuffleSeed]);

  const displayedFaqs = useMemo(
    () => filteredFaqs.slice(0, visibleCount),
    [filteredFaqs, visibleCount]
  );

  const selectedSubTopikLabel = useMemo(() => {
    if (selectedSubOptionObjects.length === 0) {
      return activeCategoryObj.shortLabel;
    }
    if (selectedSubOptionObjects.length === 1) {
      return selectedSubOptionObjects[0].label;
    }
    return selectedSubOptionObjects.map((s) => s.shortLabel || s.label).join(' + ');
  }, [selectedSubOptionObjects, activeCategoryObj.shortLabel]);

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
      topik: activeCategoryObj.label,
      sub_topik: selectedSubTopikLabel,
      penjelasan: editableExplanation.trim() || defaultCombinedExplanation,
      waktu: `${nowFormatted} WIB`,
    };
  }, [
    currentAccount,
    googleUser,
    activeCategoryObj.label,
    selectedSubTopikLabel,
    editableExplanation,
    defaultCombinedExplanation,
  ]);

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

  const openFaqFromMenu = (catFilter?: 'all' | SupportFaqCategory) => {
    if (catFilter) {
      setSelectedCategory(catFilter);
    }
    setQuickPopupOpen(false);
    setActiveModal('faq');
  };

  const openContactFromMenu = (categoryId?: string) => {
    if (categoryId) {
      const mappedId = resolvedCategories.some((c) => c.id === categoryId)
        ? categoryId
        : categoryId === 'oa_guest' || categoryId === 'umum'
        ? 'teknis'
        : resolvedCategories[0]?.id || 'akun';
      handleSelectCategory(mappedId);
    }
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

  const handleReshuffleFaqs = () => {
    setShuffleSeed(Date.now());
    setExpandedFaqId(null);
  };

  // Map kategori Contact Us ke kategori FAQ untuk pintasan balik
  const mapContactCatToFaqCat = (contactCatId: string): 'all' | SupportFaqCategory => {
    const map: Record<string, SupportFaqCategory> = {
      akun: 'akun',
      kartu: 'kartu',
      atm: 'atm',
      pinjaman: 'pinjaman',
      keamanan: 'keamanan',
      transfer: 'transfer',
      emas: 'emas',
      spin: 'spin',
      banned: 'umum',
      teknis: 'oa_guest',
    };
    return map[contactCatId] || 'all';
  };

  const faqModalNode =
    activeModal === 'faq' && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pusat-bantuan-modal-title"
          >
            <div className="w-full max-w-5xl h-[95dvh] sm:h-auto sm:max-h-[92dvh] rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl flex flex-col overflow-hidden my-auto">
              {/* Header Atas — Tampil Utuh Multi-Baris Tanpa Potongan di HP maupun Laptop */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-cyan-400 text-[11px] sm:text-xs font-semibold">
                      <HelpCircle className="w-4 h-4 shrink-0" />
                      <span className="break-words">Pusat Bantuan Resmi Bank Nusantara</span>
                      <span className="text-slate-600">•</span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 font-mono tabular-nums text-cyan-300">
                        {activeFaqs.length} Bantuan FAQ Acak
                      </span>
                    </div>
                    <h2
                      id="pusat-bantuan-modal-title"
                      className="text-sm sm:text-lg md:text-xl font-bold text-white leading-snug break-words whitespace-normal"
                    >
                      Panduan Lengkap, Petunjuk Langkah demi Langkah &amp; Praktik Keamanan
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed break-words whitespace-normal">
                      Seluruh {activeFaqs.length} panduan disusun secara acak lintas kategori (Akun, Kartu, ATM, Pinjaman, Keamanan, Transfer, Emas 24K, Spin &amp; Hadiah, OA, serta Guest) lengkap dengan langkah bernomor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal('none')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 cursor-pointer shrink-0"
                    aria-label="Tutup Pusat Bantuan"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Search, Shuffle & Category Filter Bar — Tetap Utuh di Atas Daftar */}
              <div className="px-4 sm:px-6 py-3 border-b border-slate-800 space-y-2.5 bg-slate-900/95 shrink-0">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={faqSearch}
                      onChange={(e) => setFaqSearch(e.target.value)}
                      placeholder="Cari dari 350 bantuan FAQ (contoh: PIN, buat akun, tarik tunai, emas, pinjaman, banned)..."
                      className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
                    />
                    {faqSearch && (
                      <button
                        type="button"
                        onClick={() => setFaqSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Bersihkan pencarian"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleReshuffleFaqs}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Acak ulang urutan 350 bantuan FAQ"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Acak Ulang Urutan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openContactFromMenu()}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <WhatsAppGlyph className="w-4 h-4" />
                      <span>Contact Us</span>
                    </button>
                  </div>
                </div>

                {/* Filter Kategori (Tetap Acak di Tab Semua Maupun di Dalam Kategori) */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors cursor-pointer ${
                      selectedCategory === 'all'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua Acak{' '}
                    <span className="font-mono tabular-nums opacity-85">
                      ({activeFaqs.length})
                    </span>
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
                      <span className="font-mono tabular-nums opacity-85">
                        ({categoryCounts[cat.id] || 0})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Daftar Akordeon 350 FAQ Acak — Area Gulir Mulus */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-2.5">
                {filteredFaqs.length === 0 ? (
                  <div className="p-6 sm:p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                    <p className="text-sm font-semibold text-white break-words">
                      Tidak ditemukan panduan FAQ yang cocok dengan kata kunci &quot;{faqSearch}&quot;.
                    </p>
                    <p className="text-xs text-slate-400">
                      Silakan coba kata kunci lain atau hubungi Tim Admin secara langsung melalui Contact Us (10 Kategori Topik &amp; 70 Sub-Pilihan).
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFaqSearch('');
                          setSelectedCategory('all');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                      >
                        Tampilkan Semua {activeFaqs.length} FAQ
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
                  <>
                    {displayedFaqs.map((item, idx) => {
                      const isOpen = expandedFaqId === item.id;
                      const catMeta =
                        SUPPORT_FAQ_CATEGORIES.find((c) => c.id === item.category) ||
                        SUPPORT_FAQ_CATEGORIES[0];
                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border transition-colors ${
                            isOpen
                              ? 'bg-slate-950 border-cyan-500/60'
                              : 'bg-slate-950/75 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setExpandedFaqId(isOpen ? null : item.id)}
                            className="w-full px-3.5 sm:px-4 py-3.5 text-left flex items-start justify-between gap-3 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400">
                                <span className="font-mono tabular-nums text-cyan-400 font-bold">
                                  #{String(idx + 1).padStart(3, '0')}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span
                                  className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${catMeta.accentClass}`}
                                >
                                  {catMeta.shortLabel}
                                </span>
                                {item.steps && item.steps.length > 0 && (
                                  <>
                                    <span className="text-slate-600">•</span>
                                    <span className="font-mono tabular-nums text-emerald-300 font-medium">
                                      {item.steps.length} Langkah Petunjuk
                                    </span>
                                  </>
                                )}
                              </div>
                              <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug break-words whitespace-normal">
                                {item.question}
                              </h3>
                            </div>
                            <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 shrink-0 mt-0.5">
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="px-3.5 sm:px-4 pb-4 pt-2 border-t border-slate-800/80 space-y-3.5">
                              {/* Penjelasan Lengkap */}
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                                  Penjelasan Lengkap
                                </div>
                                <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed whitespace-pre-line break-words">
                                  {item.answer}
                                </p>
                              </div>

                              {/* Petunjuk Langkah Bernomor */}
                              {item.steps && item.steps.length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                                    Petunjuk Langkah demi Langkah ({item.steps.length} Tahap)
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
                                        <span className="leading-relaxed break-words">{step}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>
                              )}

                              {/* Tips Praktis / Keamanan */}
                              {item.tip && (
                                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                                  <div className="break-words">
                                    <span className="font-bold text-amber-300">
                                      Tips Praktis &amp; Keamanan:{' '}
                                    </span>
                                    <span>{item.tip}</span>
                                  </div>
                                </div>
                              )}

                              {/* Pintasan Contact Us terkait kategori ini */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/70">
                                <span className="text-[11px] text-slate-400">
                                  Butuh bantuan langsung dari Admin untuk topik ini?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openContactFromMenu(item.category)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Tanya Topik Ini di Contact Us</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Tombol Muat Lagi agar tetap sangat ringan di HP */}
                    {visibleCount < filteredFaqs.length && (
                      <div className="pt-2 pb-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleCount((prev) =>
                              Math.min(prev + INITIAL_FAQ_BATCH_SIZE, filteredFaqs.length)
                            )
                          }
                          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-bold text-xs cursor-pointer"
                        >
                          Muat Lagi (+
                          {Math.min(INITIAL_FAQ_BATCH_SIZE, filteredFaqs.length - visibleCount)}{' '}
                          Panduan) • Tersisa {filteredFaqs.length - visibleCount} FAQ
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisibleCount(filteredFaqs.length)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                        >
                          Tampilkan Semua ({filteredFaqs.length} FAQ)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Menampilkan{' '}
                    <strong className="text-white font-mono tabular-nums">
                      {displayedFaqs.length}
                    </strong>{' '}
                    dari{' '}
                    <strong className="text-white font-mono tabular-nums">
                      {filteredFaqs.length}
                    </strong>{' '}
                    panduan terfilter (Total{' '}
                    <strong className="text-cyan-300 font-mono tabular-nums">
                      {activeFaqs.length}
                    </strong>{' '}
                    FAQ Acak).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const contactModalNode =
    activeModal === 'contact' && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-us-modal-title"
          >
            <div className="w-full max-w-5xl h-[95dvh] sm:h-auto sm:max-h-[92dvh] rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl flex flex-col overflow-hidden my-auto">
              {/* Header Atas — Utuh Multi-Baris Tanpa Potongan Teks di HP maupun Laptop */}
              <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/90 shrink-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-emerald-400 text-[11px] sm:text-xs font-semibold">
                      <Headphones className="w-4 h-4 shrink-0" />
                      <span className="break-words">
                        {supportContactConfig.serviceName || 'Contact Us Resmi Bank Nusantara'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="break-words">{supportContactConfig.operatingHours}</span>
                      </span>
                    </div>
                    <h2
                      id="contact-us-modal-title"
                      className="text-sm sm:text-lg md:text-xl font-bold text-white leading-snug break-words whitespace-normal"
                    >
                      Hubungi Layanan Nasabah (10 Kategori Topik &amp; Preset Sub-Pilihan WhatsApp / Email)
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed break-words whitespace-normal">
                      Pilih saluran komunikasi, klik 1 dari 10 kategori topik beserta sub-pilihan kendalanya. Teks penjelasan otomatis berubah sesuai sub-pilihan dan bebas Anda atur sebelum dikirim.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        openFaqFromMenu(mapContactCatToFaqCat(activeCategoryObj.id))
                      }
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Buka 350 FAQ</span>
                      <span className="sm:hidden">FAQ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal('none')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 cursor-pointer"
                      aria-label="Tutup Contact Us"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body Gulir Mulus di HP & Laptop */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
                {/* Langkah 1: Pilih Saluran Komunikasi (WhatsApp / Email) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={!supportContactConfig.whatsappEnabled}
                    onClick={() => setSelectedChannel('whatsapp')}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedChannel === 'whatsapp'
                        ? 'bg-emerald-950/40 border-[#25D366]'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-[#25D366] text-slate-950 flex items-center justify-center shrink-0">
                          <WhatsAppGlyph className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white break-words">
                            WhatsApp Resmi Admin
                          </div>
                          <div className="text-xs font-mono tabular-nums text-emerald-300 break-all">
                            {formatWhatsappDisplay(supportContactConfig.whatsappNumber)}
                          </div>
                        </div>
                      </div>
                      {selectedChannel === 'whatsapp' && (
                        <CheckCircle2 className="w-4 h-4 text-[#25D366] shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-snug break-words">
                      {supportContactConfig.whatsappEnabled
                        ? `Respon cepat (${supportContactConfig.responseEstimate || '1–5 menit'}) dengan preset 10 kategori topik.`
                        : 'Saluran WhatsApp sedang dinonaktifkan sementara oleh Admin.'}
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!supportContactConfig.emailEnabled}
                    onClick={() => setSelectedChannel('email')}
                    className={`p-3.5 sm:p-4 rounded-xl border text-left transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedChannel === 'email'
                        ? 'bg-sky-950/40 border-sky-400'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-bold text-white break-words">
                            Email Layanan Resmi
                          </div>
                          <div className="text-xs font-mono text-sky-300 break-all">
                            {supportContactConfig.emailAddress || 'Belum diatur Admin'}
                          </div>
                        </div>
                      </div>
                      {selectedChannel === 'email' && (
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-2 leading-snug break-words">
                      {supportContactConfig.emailEnabled
                        ? 'Mendukung penuh 10 kategori topik, sub-pilihan, dan penjelasan yang dapat diatur.'
                        : 'Saluran Email sedang dinonaktifkan sementara oleh Admin.'}
                    </p>
                  </button>
                </div>

                {/* Langkah 2: Pilih 1 dari 10 Kategori Topik */}
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>1. Pilih Kategori Topik ({resolvedCategories.length} Kategori)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Setiap kategori memiliki daftar sub-pilihan spesifik di bawahnya
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {resolvedCategories.map((cat, idx) => {
                      const active = activeCategoryObj.id === cat.id;
                      const subCount = (cat.subOptions || []).filter(
                        (s) => s.isActive !== false
                      ).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleSelectCategory(cat.id)}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                            active
                              ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono tabular-nums text-[10px] font-bold text-cyan-400">
                              KATEGORI #{idx + 1}
                            </span>
                            <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              {subCount} Sub
                            </span>
                          </div>
                          <div className="text-xs font-bold leading-snug break-words">
                            {cat.shortLabel}
                          </div>
                          <div className="text-[10.5px] text-slate-400 leading-snug line-clamp-2 break-words">
                            {cat.description}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Langkah 3: Pilih Sub-Pilihan di Dalam Kategori Terpilih (Bisa Pilih 1 atau Centang Beberapa) */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>
                          2. Pilih Sub-Pilihan untuk &quot;{activeCategoryObj.shortLabel}&quot;
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono tabular-nums text-[11px]">
                          {activeCategorySubOptions.length} Sub-Pilihan
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Klik sub-pilihan untuk mengisi penjelasan otomatis, atau aktifkan mode centang untuk menggabungkan beberapa sub-pilihan sekaligus.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMultiSelectSubMode((prev) => !prev)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                        multiSelectSubMode
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {multiSelectSubMode ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>
                        {multiSelectSubMode
                          ? `Mode Gabung Beberapa Sub-Pilihan (${selectedSubOptionObjects.length} Dipilih)`
                          : 'Centang Beberapa Sub-Pilihan'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeCategorySubOptions.map((sub, sIdx) => {
                      const isSelected = selectedSubOptionIds.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleClickSubOption(sub)}
                          className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-start gap-2.5 ${
                            isSelected
                              ? 'bg-emerald-950/35 border-emerald-400/80 text-white'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] font-mono text-slate-400">
                                {sIdx + 1}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="text-xs font-bold leading-snug break-words">
                              {sub.label}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed break-words">
                              {sub.explanation}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Langkah 4: Kotak Penjelasan Preset yang Bisa Diatur / Diedit Langsung */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        3. Penjelasan &amp; Kronologi Kendala (Otomatis dari Preset &amp; Bebas Diatur)
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      {isExplanationManuallyEdited && (
                        <span className="text-[11px] text-amber-300 font-semibold">
                          • Disesuaikan Manual
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleResetExplanationToPreset}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-cyan-300 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset ke Penjelasan Preset</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Teks penjelasan di bawah ini otomatis menyesuaikan sub-pilihan yang Anda klik di atas. Anda bebas mengubah atau menambahkan rincian kejadian langsung pada kotak ini sebelum dikirim ke WhatsApp/Email:
                  </p>
                  <textarea
                    rows={4}
                    value={editableExplanation}
                    onChange={(e) => {
                      setEditableExplanation(e.target.value);
                      setIsExplanationManuallyEdited(true);
                    }}
                    placeholder="Tuliskan atau atur penjelasan kendala Anda di sini..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 focus:border-cyan-400 px-3.5 py-2.5 text-xs sm:text-[13px] text-white placeholder:text-slate-500 outline-none leading-relaxed"
                  />
                </div>

                {/* Ringkasan Data Akun yang Otomatis Disisipkan */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                      <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Data Akun Nasabah yang Otomatis Terisi ke Pesan Tiket</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openFaqFromMenu(mapContactCatToFaqCat(activeCategoryObj.id))
                      }
                      className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      Lihat Panduan FAQ Topik Ini →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1.5 text-[11px]">
                    <div className="break-words">
                      <span className="text-slate-500">Nama: </span>
                      <span className="text-slate-200 font-semibold">{templateVars.nama}</span>
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">No. Rekening: </span>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {templateVars.no_rek}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">ID 16 Digit: </span>
                      <span className="text-slate-200 font-mono tabular-nums">
                        {templateVars.user_id}
                      </span>
                    </div>
                    <div className="break-words">
                      <span className="text-slate-500">Tier &amp; Status: </span>
                      <span className="text-slate-200 font-semibold">
                        {templateVars.tier} · {templateVars.status_kartu}
                      </span>
                    </div>
                    <div className="break-all">
                      <span className="text-slate-500">Email: </span>
                      <span className="text-slate-200 font-mono">{templateVars.email}</span>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3 break-words">
                      <span className="text-slate-500">Domisili: </span>
                      <span className="text-slate-300">{templateVars.domisili}</span>
                    </div>
                  </div>
                </div>

                {/* Catatan Tambahan Opsional */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white block">
                    4. Catatan Tambahan / Nomor Referensi Transaksi (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={extraNote}
                    onChange={(e) => setExtraNote(e.target.value)}
                    placeholder="Contoh: Nomor referensi transaksi TRX-99281, mohon dibantu..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none"
                  />
                </div>

                {/* Pratinjau Pesan Otomatis Lengkap */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">
                      5. Pratinjau Utuh Pesan Tiket Otomatis (
                      {selectedChannel === 'whatsapp' ? 'WhatsApp' : 'Email'})
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
                    <div className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs break-words">
                      <span className="text-slate-400 font-semibold">Subjek Email: </span>
                      <span className="text-sky-300 font-medium">{previewEmailSubject}</span>
                    </div>
                  )}

                  <pre className="w-full max-h-60 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-[11.5px] leading-relaxed text-slate-200 font-mono whitespace-pre-wrap break-words">
                    {selectedChannel === 'whatsapp' ? previewWhatsappMessage : previewEmailBody}
                  </pre>
                </div>
              </div>

              {/* Footer Action Buttons (Safe Anchor Links — NO window.open) */}
              <div className="px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
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
                        <span className="text-emerald-300">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Isi Tiket</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {selectedChannel === 'whatsapp' ? (
                    whatsappHref && supportContactConfig.whatsappEnabled ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1fb858] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                      >
                        <WhatsAppGlyph className="w-4 h-4" />
                        <span>Kirim via WhatsApp Sekarang</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-rose-400 font-semibold">
                        WhatsApp belum diaktifkan Admin
                      </span>
                    )
                  ) : emailHref && supportContactConfig.emailEnabled ? (
                    <a
                      href={emailHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Kirim via Email Sekarang</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-rose-400 font-semibold">
                      Email belum diaktifkan Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* Trigger Container (duduk langsung di kanan tombol Surat & Hadiah Admin) */}
      <div className="relative flex flex-col items-end">
        {/* Popup 2 Pilihan Cepat */}
        {quickPopupOpen && (
          <div className="absolute bottom-14 right-0 w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-3.5 space-y-2.5 z-50">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white break-words leading-snug">
                  {supportContactConfig.serviceName || 'Bantuan Bank Nusantara'}
                </h4>
                <p className="text-[11px] text-slate-400 break-words leading-snug mt-0.5">
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
                onClick={() => openFaqFromMenu()}
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
                      {activeFaqs.length} Panduan Acak
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">
                    {activeFaqs.length} bantuan acak lengkap dengan penjelasan &amp; langkah bernomor untuk seluruh fitur.
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
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug break-words">
                    {resolvedCategories.length} kategori topik &amp; sub-pilihan preset dengan penjelasan yang bisa diatur.
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

      {/* Portal Modals (di atas Navbar, z-[9999]) */}
      {faqModalNode}
      {contactModalNode}
    </>
  );
};
