/**
 * Tab Khusus "Pusat Bantuan" di Panel Admin
 * 1. Indikator Visual Penyimpanan Permanen: "Tersimpan di Cloud & Perangkat" beserta waktu simpan terakhir.
 * 2. Sub-Tab 1: Pengaturan Contact Us & Template Tiket Global (WA & Email) + Tombol 1-Klik Sisip Variabel + Reset Template + Live Preview.
 * 3. Sub-Tab 2: Pengelolaan Penuh 10 Kategori Topik & 70+ Sub-Pilihan Preset WhatsApp/Email:
 *    - Tambah/Edit/Hapus Kategori Topik
 *    - Tambah/Edit/Hapus Sub-Pilihan di tiap kategori
 *    - Atur/Edit Teks Penjelasan Preset tiap Sub-Pilihan + Sisip Variabel 1-Klik
 *    - Reset per Sub-Pilihan & Reset Semua 10 Kategori ke bawaan awal dengan konfirmasi.
 * 4. Sub-Tab 3: Pengelolaan Penuh 350 Bantuan FAQ Acak:
 *    - Tambah (+), Edit, Hapus (-), Filter 10 Kategori, Pencarian Cepat, Pemuatan Bertahap (ringan di HP/Laptop),
 *    - Tombol Acak Ulang Urutan 350 FAQ, dan Tombol Reset ke 350 FAQ Acak Awal dengan konfirmasi.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  X,
  Eye,
  BookOpen,
  Sparkles,
  Layers,
  Shuffle,
  HardDrive,
  CloudCheck,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  SupportContactConfig,
  SupportFaqCategory,
  SupportFaqItem,
  SupportContactCategoryPreset,
  SupportContactSubOptionPreset,
} from '../types/bank';
import {
  SUPPORT_FAQ_CATEGORIES,
  SUPPORT_TEMPLATE_VARIABLES,
  DEFAULT_SUPPORT_CONTACT_CONFIG,
  DEFAULT_SUPPORT_PRESET_CATEGORIES,
  cloneDefaultPresetCategories,
  getResolvedPresetCategories,
  formatWhatsappDisplay,
  interpolateSupportTemplate,
} from '../data/supportFaqCatalog';

const ADMIN_FAQ_PAGE_SIZE = 30;

export const AdminHelpCenterPanel: React.FC = () => {
  const {
    supportFaqs,
    supportContactConfig,
    lastAdminSavedAtIso,
    adminUpdateSupportContactConfig,
    adminAddSupportFaq,
    adminUpdateSupportFaq,
    adminDeleteSupportFaq,
    adminResetSupportFaqs,
    adminShuffleSupportFaqs,
  } = useBank();

  const [subTab, setSubTab] = useState<'presets' | 'contact' | 'faqs'>('presets');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Contact Us Draft State (synced when hydrated from Cloud unless user is actively editing)
  const [contactDraft, setContactDraft] = useState<SupportContactConfig>(() => ({
    ...supportContactConfig,
    presetCategories: getResolvedPresetCategories(supportContactConfig.presetCategories),
  }));
  const isContactDirtyRef = useRef(false);
  const waTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const subExplanationTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTemplateField, setActiveTemplateField] = useState<'whatsapp' | 'email'>('whatsapp');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isContactDirtyRef.current) {
      setContactDraft({
        ...supportContactConfig,
        presetCategories: getResolvedPresetCategories(supportContactConfig.presetCategories),
      });
    }
  }, [supportContactConfig]);

  // ============================================================================
  // STATE UNTUK SUB-TAB 2: 10 KATEGORI & 70+ SUB-PILIHAN PRESET WA/EMAIL
  // ============================================================================
  const presetCategories: SupportContactCategoryPreset[] = useMemo(
    () => getResolvedPresetCategories(supportContactConfig.presetCategories),
    [supportContactConfig.presetCategories]
  );

  const [selectedPresetCatId, setSelectedPresetCatId] = useState<string>(
    () => presetCategories[0]?.id || 'akun'
  );
  const [editingCategoryMode, setEditingCategoryMode] = useState<'none' | 'add' | 'edit'>('none');
  const [catLabelInput, setCatLabelInput] = useState('');
  const [catShortLabelInput, setCatShortLabelInput] = useState('');
  const [catDescInput, setCatDescInput] = useState('');

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [showAddSubForm, setShowAddSubForm] = useState<boolean>(false);
  const [subLabelInput, setSubLabelInput] = useState('');
  const [subShortLabelInput, setSubShortLabelInput] = useState('');
  const [subExplanationInput, setSubExplanationInput] = useState('');
  const [confirmResetAllPresets, setConfirmResetAllPresets] = useState(false);

  const activePresetCat: SupportContactCategoryPreset = useMemo(() => {
    return (
      presetCategories.find((c) => c.id === selectedPresetCatId) ||
      presetCategories[0] || {
        id: 'akun',
        label: '1. Pengelolaan Akun, Pendaftaran & Profil',
        shortLabel: 'Akun & Profil',
        description: 'Bantuan akun dan profil nasabah.',
        subOptions: [],
      }
    );
  }, [presetCategories, selectedPresetCatId]);

  const totalSubOptionsCount = useMemo(
    () => presetCategories.reduce((acc, c) => acc + (c.subOptions?.length || 0), 0),
    [presetCategories]
  );

  // ============================================================================
  // STATE UNTUK SUB-TAB 3: KELOLA 350 FAQ ACAK
  // ============================================================================
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCatFilter, setFaqCatFilter] = useState<'all' | SupportFaqCategory>('all');
  const [faqVisibleCount, setFaqVisibleCount] = useState<number>(ADMIN_FAQ_PAGE_SIZE);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [confirmResetFaqs, setConfirmResetFaqs] = useState(false);

  // Form fields for Add / Edit FAQ
  const [fCategory, setFCategory] = useState<SupportFaqCategory>('akun');
  const [fQuestion, setFQuestion] = useState('');
  const [fAnswer, setFAnswer] = useState('');
  const [fStepsText, setFStepsText] = useState('');
  const [fTip, setFTip] = useState('');
  const [fKeywordsText, setFKeywordsText] = useState('');

  const flashFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 5500);
  };

  const formattedLastSaved = useMemo(() => {
    const rawIso = lastAdminSavedAtIso || supportContactConfig.updatedAt;
    if (!rawIso) return 'Tersinkron Otomatis';
    try {
      return new Date(rawIso).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Baru saja';
    }
  }, [lastAdminSavedAtIso, supportContactConfig.updatedAt]);

  // ============================================================================
  // HANDLERS SUB-TAB 1: CONTACT US & TEMPLATE GLOBAL
  // ============================================================================
  const updateContactField = <K extends keyof SupportContactConfig>(
    key: K,
    value: SupportContactConfig[K]
  ) => {
    isContactDirtyRef.current = true;
    setContactDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleInsertVariable = (token: string, target: 'whatsapp' | 'email') => {
    isContactDirtyRef.current = true;
    const refEl = target === 'whatsapp' ? waTextareaRef.current : emailTextareaRef.current;
    const fieldKey = target === 'whatsapp' ? 'whatsappAutoMessage' : 'emailAutoBody';

    setContactDraft((prev) => {
      const currentVal = prev[fieldKey] ?? '';
      if (refEl && typeof refEl.selectionStart === 'number') {
        const start = refEl.selectionStart;
        const end = refEl.selectionEnd ?? start;
        const nextVal = `${currentVal.slice(0, start)}${token}${currentVal.slice(end)}`;
        window.requestAnimationFrame(() => {
          refEl.focus();
          const pos = start + token.length;
          refEl.setSelectionRange(pos, pos);
        });
        return { ...prev, [fieldKey]: nextVal };
      }
      return {
        ...prev,
        [fieldKey]: `${currentVal}${currentVal.endsWith(' ') || !currentVal ? '' : ' '}${token}`,
      };
    });
  };

  const handleSaveContactConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminUpdateSupportContactConfig({
      ...contactDraft,
      presetCategories,
    });
    isContactDirtyRef.current = false;
    flashFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleResetContactTemplates = () => {
    isContactDirtyRef.current = true;
    setContactDraft((prev) => ({
      ...prev,
      whatsappAutoMessage: DEFAULT_SUPPORT_CONTACT_CONFIG.whatsappAutoMessage,
      emailAutoSubject: DEFAULT_SUPPORT_CONTACT_CONFIG.emailAutoSubject,
      emailAutoBody: DEFAULT_SUPPORT_CONTACT_CONFIG.emailAutoBody,
    }));
    flashFeedback(
      'success',
      'Template pesan WhatsApp & Email dikembalikan ke format tiket resmi bawaan. Klik "Simpan Pengaturan Permanen" untuk menerapkan.'
    );
  };

  // ============================================================================
  // HANDLERS SUB-TAB 2: 10 KATEGORI & SUB-PILIHAN PRESET WA/EMAIL
  // ============================================================================
  const savePresetCategoriesImmediately = (
    nextCategories: SupportContactCategoryPreset[],
    customMessage?: string
  ) => {
    const res = adminUpdateSupportContactConfig({
      ...supportContactConfig,
      presetCategories: nextCategories,
    });
    setContactDraft((prev) => ({
      ...prev,
      presetCategories: nextCategories,
    }));
    flashFeedback(res.success ? 'success' : 'error', customMessage || res.message);
  };

  const startAddCategory = () => {
    setEditingCategoryMode('add');
    setCatLabelInput(`${presetCategories.length + 1}. Kategori Topik Baru`);
    setCatShortLabelInput('Topik Baru');
    setCatDescInput('Deskripsi singkat kategori topik kendala nasabah.');
  };

  const startEditActiveCategory = () => {
    setEditingCategoryMode('edit');
    setCatLabelInput(activePresetCat.label);
    setCatShortLabelInput(activePresetCat.shortLabel);
    setCatDescInput(activePresetCat.description);
  };

  const handleSaveCategoryForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = catLabelInput.trim();
    const cleanShort = catShortLabelInput.trim() || cleanLabel;
    const cleanDesc = catDescInput.trim() || cleanLabel;
    if (!cleanLabel) {
      flashFeedback('error', 'Nama kategori topik tidak boleh kosong.');
      return;
    }

    if (editingCategoryMode === 'add') {
      const newCatId = `cat-custom-${Date.now()}`;
      const newCat: SupportContactCategoryPreset = {
        id: newCatId,
        label: cleanLabel,
        shortLabel: cleanShort,
        description: cleanDesc,
        accentClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
        isDefault: false,
        isActive: true,
        updatedAt: new Date().toISOString(),
        subOptions: [
          {
            id: `sub-custom-${Date.now()}`,
            categoryId: newCatId,
            label: `Bantuan Utama ${cleanShort}`,
            shortLabel: `Bantuan ${cleanShort}`,
            explanation: `Saya ingin mengajukan permohonan bantuan terkait ${cleanLabel} pada rekening Bank Nusantara saya. Mohon bantuan pengecekan dari Tim Admin.`,
            isDefault: false,
            isActive: true,
          },
        ],
      };
      const nextCats = [...presetCategories, newCat];
      setSelectedPresetCatId(newCatId);
      setEditingCategoryMode('none');
      savePresetCategoriesImmediately(
        nextCats,
        `Kategori baru "${cleanShort}" berhasil ditambahkan dan disimpan permanen!`
      );
    } else if (editingCategoryMode === 'edit') {
      const nextCats = presetCategories.map((c) =>
        c.id === activePresetCat.id
          ? {
              ...c,
              label: cleanLabel,
              shortLabel: cleanShort,
              description: cleanDesc,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      setEditingCategoryMode('none');
      savePresetCategoriesImmediately(
        nextCats,
        `Kategori "${cleanShort}" berhasil diperbarui dan disimpan permanen!`
      );
    }
  };

  const handleDeleteCategory = (catId: string) => {
    if (presetCategories.length <= 1) {
      flashFeedback('error', 'Minimal harus terdapat 1 kategori topik aktif.');
      return;
    }
    const target = presetCategories.find((c) => c.id === catId);
    const nextCats = presetCategories.filter((c) => c.id !== catId);
    if (selectedPresetCatId === catId && nextCats.length > 0) {
      setSelectedPresetCatId(nextCats[0].id);
    }
    savePresetCategoriesImmediately(
      nextCats,
      `Kategori "${target?.shortLabel || catId}" berhasil dihapus secara permanen.`
    );
  };

  const startAddSubOption = () => {
    setEditingSubId(null);
    setShowAddSubForm(true);
    setSubLabelInput('');
    setSubShortLabelInput('');
    setSubExplanationInput(
      `Saya mengalami kendala terkait layanan ${activePresetCat.shortLabel} pada rekening Bank Nusantara saya dan memohon bantuan pengecekan dari Tim Admin.`
    );
  };

  const startEditSubOption = (sub: SupportContactSubOptionPreset) => {
    setEditingSubId(sub.id);
    setShowAddSubForm(true);
    setSubLabelInput(sub.label);
    setSubShortLabelInput(sub.shortLabel);
    setSubExplanationInput(sub.explanation);
  };

  const cancelSubOptionForm = () => {
    setEditingSubId(null);
    setShowAddSubForm(false);
    setSubLabelInput('');
    setSubShortLabelInput('');
    setSubExplanationInput('');
  };

  const handleInsertVariableIntoSubExplanation = (token: string) => {
    const refEl = subExplanationTextareaRef.current;
    if (refEl && typeof refEl.selectionStart === 'number') {
      const start = refEl.selectionStart;
      const end = refEl.selectionEnd ?? start;
      const nextVal = `${subExplanationInput.slice(0, start)}${token}${subExplanationInput.slice(end)}`;
      setSubExplanationInput(nextVal);
      window.requestAnimationFrame(() => {
        refEl.focus();
        const pos = start + token.length;
        refEl.setSelectionRange(pos, pos);
      });
      return;
    }
    setSubExplanationInput(
      (prev) => `${prev}${prev.endsWith(' ') || !prev ? '' : ' '}${token}`
    );
  };

  const handleSaveSubOptionForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = subLabelInput.trim();
    const cleanShort = subShortLabelInput.trim() || cleanLabel.slice(0, 32);
    const cleanExp = subExplanationInput.trim();
    if (!cleanLabel || !cleanExp) {
      flashFeedback('error', 'Judul sub-pilihan dan teks penjelasan preset wajib diisi.');
      return;
    }

    const nowIso = new Date().toISOString();
    let nextCats: SupportContactCategoryPreset[];

    if (editingSubId) {
      nextCats = presetCategories.map((cat) =>
        cat.id === activePresetCat.id
          ? {
              ...cat,
              updatedAt: nowIso,
              subOptions: (cat.subOptions || []).map((s) =>
                s.id === editingSubId
                  ? {
                      ...s,
                      label: cleanLabel,
                      shortLabel: cleanShort,
                      explanation: cleanExp,
                      updatedAt: nowIso,
                    }
                  : s
              ),
            }
          : cat
      );
      cancelSubOptionForm();
      savePresetCategoriesImmediately(
        nextCats,
        `Penjelasan sub-pilihan "${cleanShort}" berhasil disimpan permanen ke Cloud & Perangkat!`
      );
    } else {
      const newSub: SupportContactSubOptionPreset = {
        id: `sub-${activePresetCat.id}-${Date.now()}`,
        categoryId: activePresetCat.id,
        label: cleanLabel,
        shortLabel: cleanShort,
        explanation: cleanExp,
        isDefault: false,
        isActive: true,
        updatedAt: nowIso,
      };
      nextCats = presetCategories.map((cat) =>
        cat.id === activePresetCat.id
          ? {
              ...cat,
              updatedAt: nowIso,
              subOptions: [...(cat.subOptions || []), newSub],
            }
          : cat
      );
      cancelSubOptionForm();
      savePresetCategoriesImmediately(
        nextCats,
        `Sub-pilihan baru "${cleanShort}" berhasil ditambahkan ke kategori "${activePresetCat.shortLabel}" dan disimpan permanen!`
      );
    }
  };

  const handleDeleteSubOption = (subId: string) => {
    const targetSub = (activePresetCat.subOptions || []).find((s) => s.id === subId);
    const nextCats = presetCategories.map((cat) =>
      cat.id === activePresetCat.id
        ? {
            ...cat,
            updatedAt: new Date().toISOString(),
            subOptions: (cat.subOptions || []).filter((s) => s.id !== subId),
          }
        : cat
    );
    if (editingSubId === subId) {
      cancelSubOptionForm();
    }
    savePresetCategoriesImmediately(
      nextCats,
      `Sub-pilihan "${targetSub?.shortLabel || subId}" berhasil dihapus secara permanen.`
    );
  };

  const handleResetSingleSubOption = (subId: string) => {
    const defaultCat = DEFAULT_SUPPORT_PRESET_CATEGORIES.find(
      (c) => c.id === activePresetCat.id
    );
    const defaultSub = defaultCat?.subOptions.find((s) => s.id === subId);
    if (!defaultSub) {
      flashFeedback('error', 'Sub-pilihan ini adalah sub-pilihan custom buatan Admin.');
      return;
    }
    const nextCats = presetCategories.map((cat) =>
      cat.id === activePresetCat.id
        ? {
            ...cat,
            subOptions: (cat.subOptions || []).map((s) =>
              s.id === subId ? { ...defaultSub } : s
            ),
          }
        : cat
    );
    if (editingSubId === subId) {
      setSubLabelInput(defaultSub.label);
      setSubShortLabelInput(defaultSub.shortLabel);
      setSubExplanationInput(defaultSub.explanation);
    }
    savePresetCategoriesImmediately(
      nextCats,
      `Sub-pilihan "${defaultSub.shortLabel}" berhasil dikembalikan ke penjelasan preset bawaan awal!`
    );
  };

  const handleResetAll10Categories = () => {
    const fresh10 = cloneDefaultPresetCategories();
    setConfirmResetAllPresets(false);
    cancelSubOptionForm();
    setSelectedPresetCatId(fresh10[0].id);
    savePresetCategoriesImmediately(
      fresh10,
      'Seluruh 10 Kategori Topik & 70 Sub-Pilihan Preset WhatsApp/Email berhasil direset ke pengaturan awal dan disimpan permanen!'
    );
  };

  const sampleVars = useMemo(
    () => ({
      nama: 'Budi Santoso',
      no_rek: '8829104421',
      user_id: '4029-8812-3301-9942',
      tier: 'GOLD',
      email: 'budi.santoso@gmail.com',
      domisili: 'RT 003/RW 005, Kel. Menteng, Kec. Menteng, Jakarta Pusat, DKI Jakarta 10310',
      status_kartu: 'AKTIF',
      topik: activePresetCat.label,
      sub_topik:
        activePresetCat.subOptions?.[0]?.label ||
        'Permohonan Persetujuan (Approval) Kartu Baru yang Masih Pending',
      penjelasan:
        activePresetCat.subOptions?.[0]?.explanation ||
        'Kartu Bank Nusantara saya saat ini masih berstatus Menunggu Persetujuan Admin.',
      waktu: '21 Nov 2026, 09:30 WIB',
    }),
    [activePresetCat]
  );

  // ============================================================================
  // HANDLERS SUB-TAB 3: KELOLA 350 FAQ ACAK
  // ============================================================================
  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    return supportFaqs.filter((item) => {
      if (faqCatFilter !== 'all' && item.category !== faqCatFilter) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        (item.steps || []).some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [supportFaqs, faqCatFilter, faqSearch]);

  useEffect(() => {
    setFaqVisibleCount(ADMIN_FAQ_PAGE_SIZE);
  }, [faqSearch, faqCatFilter]);

  const displayedAdminFaqs = useMemo(
    () => filteredFaqs.slice(0, faqVisibleCount),
    [filteredFaqs, faqVisibleCount]
  );

  const resetFaqForm = () => {
    setFCategory('akun');
    setFQuestion('');
    setFAnswer('');
    setFStepsText('');
    setFTip('');
    setFKeywordsText('');
    setEditingFaqId(null);
    setShowAddForm(false);
  };

  const startEditFaq = (item: SupportFaqItem) => {
    setEditingFaqId(item.id);
    setShowAddForm(true);
    setFCategory(item.category);
    setFQuestion(item.question);
    setFAnswer(item.answer);
    setFStepsText((item.steps || []).join('\n'));
    setFTip(item.tip || '');
    setFKeywordsText((item.keywords || []).join(', '));
  };

  const handleSaveFaqSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stepsArray = fStepsText
      .split('\n')
      .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
      .filter(Boolean);
    const keywordsArray = fKeywordsText
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingFaqId) {
      const res = adminUpdateSupportFaq(editingFaqId, {
        category: fCategory,
        question: fQuestion,
        answer: fAnswer,
        steps: stepsArray,
        tip: fTip,
        keywords: keywordsArray,
      });
      flashFeedback(res.success ? 'success' : 'error', res.message);
      if (res.success) resetFaqForm();
    } else {
      const res = adminAddSupportFaq({
        category: fCategory,
        question: fQuestion,
        answer: fAnswer,
        steps: stepsArray,
        tip: fTip,
        keywords: keywordsArray,
      });
      flashFeedback(res.success ? 'success' : 'error', res.message);
      if (res.success) resetFaqForm();
    }
  };

  const handleDeleteFaq = (item: SupportFaqItem) => {
    const res = adminDeleteSupportFaq(item.id);
    flashFeedback(res.success ? 'success' : 'error', res.message);
    if (editingFaqId === item.id) resetFaqForm();
  };

  const handleReset350Faqs = () => {
    const res = adminResetSupportFaqs();
    setConfirmResetFaqs(false);
    resetFaqForm();
    flashFeedback(res.success ? 'success' : 'error', res.message);
  };

  const handleShuffleFaqsInAdmin = () => {
    const res = adminShuffleSupportFaqs();
    flashFeedback(res.success ? 'success' : 'error', res.message);
  };

  return (
    <div className="space-y-5">
      {/* Header + Indikator Penyimpanan Permanen Cloud & IndexedDB */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-emerald-400 text-xs font-semibold">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Studio Pusat Bantuan &amp; Preset Contact Us</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono tabular-nums text-cyan-300">
                {supportFaqs.length} FAQ Acak
              </span>
              <span className="text-slate-600">•</span>
              <span className="font-mono tabular-nums text-emerald-300">
                {presetCategories.length} Kategori ({totalSubOptionsCount} Sub-Pilihan)
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white break-words">
              Kelola 10 Kategori &amp; Sub-Pilihan Preset WhatsApp/Email, Kontak Resmi, serta 350 FAQ Acak
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed break-words">
              Seluruh perubahan langsung disimpan secara permanen ke Cloud Firestore dan IndexedDB perangkat lokal (dilengkapi kunci anti-timpa saat halaman dimuat ulang).
            </p>
          </div>

          {/* Indikator Visual Status Penyimpanan Permanen */}
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <div className="font-bold text-emerald-300 flex items-center gap-1">
                <span>Tersimpan di Cloud &amp; Perangkat</span>
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-300">
                Simpan Terakhir: {formattedLastSaved}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tab Switcher (3 Sub-Tabs) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setSubTab('presets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'presets'
                ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>
              10 Kategori &amp; Sub-Pilihan Preset WA ({presetCategories.length} Kategori /{' '}
              {totalSubOptionsCount} Sub)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('contact')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'contact'
                ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Nomor WA, Email &amp; Format Tiket Global</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('faqs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'faqs'
                ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kelola 350 FAQ Acak ({supportFaqs.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="break-words">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 1 (DEFAULT): STUDIO 10 KATEGORI & 70+ SUB-PILIHAN PRESET WA
         ==================================================================== */}
      {subTab === 'presets' && (
        <div className="space-y-4">
          {/* Toolbar Kategori Preset */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  Daftar 10 Kategori Topik &amp; Sub-Pilihan Preset Pesan Otomatis WhatsApp / Email
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih salah satu kategori topik di bawah untuk melihat, mengedit, menambah, atau mengatur teks penjelasan dari setiap sub-pilihannya.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={startAddCategory}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Kategori (+)</span>
                </button>

                {!confirmResetAllPresets ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetAllPresets(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Semua 10 Kategori Awal</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-amber-950/70 border border-amber-500/60">
                    <span className="text-[11px] text-amber-200 px-2 font-semibold">
                      Reset ke 10 kategori &amp; 70 sub-pilihan awal?
                    </span>
                    <button
                      type="button"
                      onClick={handleResetAll10Categories}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                    >
                      Ya, Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetAllPresets(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Grid 10 Kartu Kategori */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {presetCategories.map((cat, idx) => {
                const isSelected = activePresetCat.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetCatId(cat.id);
                      cancelSubOptionForm();
                      setEditingCategoryMode('none');
                    }}
                    className={`p-3 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono tabular-nums font-bold text-emerald-400">
                        KATEGORI #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        {cat.subOptions?.length || 0} Sub
                      </span>
                    </div>
                    <div className="text-xs font-bold leading-snug break-words">
                      {cat.shortLabel}
                    </div>
                    <div className="text-[10.5px] text-slate-400 line-clamp-2 leading-snug break-words">
                      {cat.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Form Tambah / Edit Kategori Topik */}
            {editingCategoryMode !== 'none' && (
              <form
                onSubmit={handleSaveCategoryForm}
                className="p-4 rounded-xl bg-slate-950 border border-cyan-500/50 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-cyan-300">
                    {editingCategoryMode === 'add'
                      ? 'Tambah Kategori Topik Baru'
                      : `Edit Kategori: ${activePresetCat.shortLabel}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingCategoryMode('none')}
                    className="p-1 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Nama Singkat Kartu Kategori
                    </label>
                    <input
                      type="text"
                      value={catShortLabelInput}
                      onChange={(e) => setCatShortLabelInput(e.target.value)}
                      placeholder="Contoh: Akun & Profil"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-slate-300 font-semibold block">
                      Judul Lengkap Kategori (Tampil di Tiket WA/Email)
                    </label>
                    <input
                      type="text"
                      value={catLabelInput}
                      onChange={(e) => setCatLabelInput(e.target.value)}
                      placeholder="Contoh: 1. Pengelolaan Akun, Pendaftaran & Profil"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Deskripsi Kategori</label>
                  <input
                    type="text"
                    value={catDescInput}
                    onChange={(e) => setCatDescInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCategoryMode('none')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Kategori Permanen</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Panel Sub-Pilihan di Dalam Kategori Aktif */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    Sub-Pilihan &amp; Penjelasan Preset: {activePresetCat.label}
                  </h4>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono tabular-nums text-xs font-semibold">
                    {activePresetCat.subOptions?.length || 0} Sub-Pilihan
                  </span>
                </div>
                <p className="text-xs text-slate-400">{activePresetCat.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={startEditActiveCategory}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Nama Kategori</span>
                </button>
                {!activePresetCat.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(activePresetCat.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Kategori</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={startAddSubOption}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Sub-Pilihan (+)</span>
                </button>
              </div>
            </div>

            {/* Form Tambah / Edit Sub-Pilihan & Teks Penjelasan Preset */}
            {showAddSubForm && (
              <form
                onSubmit={handleSaveSubOptionForm}
                className="p-4 rounded-xl bg-slate-950 border border-emerald-500/50 space-y-3.5 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-sm font-bold text-emerald-300">
                    {editingSubId
                      ? 'Edit Sub-Pilihan & Teks Penjelasan Preset WhatsApp/Email'
                      : `Tambah Sub-Pilihan Baru di Kategori "${activePresetCat.shortLabel}"`}
                  </span>
                  <button
                    type="button"
                    onClick={cancelSubOptionForm}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300 block">
                      Label Singkat Sub-Pilihan
                    </label>
                    <input
                      type="text"
                      value={subShortLabelInput}
                      onChange={(e) => setSubShortLabelInput(e.target.value)}
                      placeholder="Contoh: Aktivasi Kartu Pending"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-semibold text-slate-300 block">
                      Judul Lengkap Sub-Pilihan Kendala (Wajib)
                    </label>
                    <input
                      type="text"
                      required
                      value={subLabelInput}
                      onChange={(e) => setSubLabelInput(e.target.value)}
                      placeholder="Contoh: Permohonan Persetujuan (Approval) Kartu Baru yang Masih Pending"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white outline-none"
                    />
                  </div>
                </div>

                {/* Tombol 1-Klik Sisip Variabel ke Dalam Penjelasan Sub-Pilihan */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Klik Variabel di Bawah untuk Menyisipkan Otomatis ke Dalam Teks Penjelasan Sub-Pilihan:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {SUPPORT_TEMPLATE_VARIABLES.filter((v) => v.token !== '{penjelasan}').map(
                      (v) => (
                        <button
                          key={v.token}
                          type="button"
                          onClick={() => handleInsertVariableIntoSubExplanation(v.token)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-[11px] text-slate-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          <code className="font-mono text-cyan-300 font-bold">{v.token}</code>
                          <span className="text-slate-400">({v.label})</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Teks Penjelasan &amp; Kronologi Preset (Otomatis Muncul Saat Sub-Pilihan Ini Diklik Nasabah)
                  </label>
                  <textarea
                    ref={subExplanationTextareaRef}
                    rows={4}
                    required
                    value={subExplanationInput}
                    onChange={(e) => setSubExplanationInput(e.target.value)}
                    placeholder="Tuliskan penjelasan & kronologi preset yang akan otomatis terisi ke pesan WhatsApp/Email..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-400 text-white leading-relaxed outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={cancelSubOptionForm}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Sub-Pilihan &amp; Penjelasan Permanen</span>
                  </button>
                </div>
              </form>
            )}

            {/* Daftar Sub-Pilihan di Kategori Ini */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(activePresetCat.subOptions || []).map((sub, sIdx) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 font-mono tabular-nums text-[11px] font-bold text-emerald-300">
                          Sub #{sIdx + 1}
                        </span>
                        <span className="text-xs font-bold text-cyan-300 break-words">
                          {sub.shortLabel}
                        </span>
                      </div>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-white leading-snug break-words">
                      {sub.label}
                    </h5>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/90 text-xs text-slate-300 leading-relaxed whitespace-pre-line break-words">
                      {sub.explanation}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => startEditSubOption(sub)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Atur / Edit Penjelasan</span>
                    </button>
                    {sub.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleResetSingleSubOption(sub.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Kembalikan penjelasan sub-pilihan ini ke bawaan awal"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteSubOption(sub.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: CONTACT US (WA, EMAIL & TEMPLATE TIKET GLOBAL)
         ==================================================================== */}
      {subTab === 'contact' && (
        <form onSubmit={handleSaveContactConfig} className="space-y-5">
          {/* Identitas & Kontak */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  1. Pengaturan Nomor WhatsApp, Alamat Email &amp; Jam Layanan
                </h4>
                <p className="text-xs text-slate-400">
                  Atur nomor tujuan WhatsApp dan alamat Email resmi ketika nasabah menekan tombol kirim di Contact Us.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                WA Aktif: {formatWhatsappDisplay(contactDraft.whatsappNumber)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Nomor WhatsApp Admin Resmi (Gunakan format 628... atau 08...)
                </label>
                <input
                  type="text"
                  value={contactDraft.whatsappNumber}
                  onChange={(e) => updateContactField('whatsappNumber', e.target.value)}
                  placeholder="6281234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white font-mono tabular-nums outline-none"
                />
                <label className="inline-flex items-center gap-2 pt-1 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={contactDraft.whatsappEnabled}
                    onChange={(e) => updateContactField('whatsappEnabled', e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Aktifkan saluran WhatsApp di Contact Us</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Alamat Email Layanan Nasabah Resmi
                </label>
                <input
                  type="email"
                  value={contactDraft.emailAddress}
                  onChange={(e) => updateContactField('emailAddress', e.target.value)}
                  placeholder="cs@banknusantara.id"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-white font-mono outline-none"
                />
                <label className="inline-flex items-center gap-2 pt-1 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={contactDraft.emailEnabled}
                    onChange={(e) => updateContactField('emailEnabled', e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Aktifkan saluran Email di Contact Us</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Nama Unit Layanan</label>
                <input
                  type="text"
                  value={contactDraft.serviceName}
                  onChange={(e) => updateContactField('serviceName', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Jam Operasional</label>
                  <input
                    type="text"
                    value={contactDraft.operatingHours}
                    onChange={(e) => updateContactField('operatingHours', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Estimasi Respon</label>
                  <input
                    type="text"
                    value={contactDraft.responseEstimate}
                    onChange={(e) => updateContactField('responseEstimate', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Template Pesan Otomatis Panjang & Lengkap */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  2. Editor Format Kerangka Tiket Otomatis (WhatsApp &amp; Email)
                </h4>
                <p className="text-xs text-slate-400">
                  Gunakan variabel <code className="text-cyan-300">{'{topik}'}</code>,{' '}
                  <code className="text-cyan-300">{'{sub_topik}'}</code>, dan{' '}
                  <code className="text-cyan-300">{'{penjelasan}'}</code> agar pilihan kategori dan penjelasan sub-pilihan otomatis menyatu ke dalam tiket.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((p) => !p)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? 'Sembunyikan Pratinjau' : 'Lihat Pratinjau'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetContactTemplates}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-semibold text-amber-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Template Bawaan</span>
                </button>
              </div>
            </div>

            {/* Baris Tombol 1-Klik Sisip Variabel Otomatis */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Klik Variabel untuk Menyisipkan ke Template{' '}
                    {activeTemplateField === 'whatsapp' ? 'WhatsApp' : 'Isi Email'}:
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400">Target Sisip:</span>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateField('whatsapp')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      activeTemplateField === 'whatsapp'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Kotak WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateField('email')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      activeTemplateField === 'email'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    Kotak Email
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {SUPPORT_TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => handleInsertVariable(v.token, activeTemplateField)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-xs text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title={`Contoh: ${v.sample}`}
                  >
                    <code className="font-mono text-cyan-300 font-bold">{v.token}</code>
                    <span className="text-[11px] text-slate-400">({v.label})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* WhatsApp Template Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span>Template Pesan Otomatis WhatsApp</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {contactDraft.whatsappAutoMessage.length} karakter
                  </span>
                </div>
                <textarea
                  ref={waTextareaRef}
                  rows={14}
                  value={contactDraft.whatsappAutoMessage}
                  onFocus={() => setActiveTemplateField('whatsapp')}
                  onChange={(e) => updateContactField('whatsappAutoMessage', e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 p-3.5 text-xs font-mono text-slate-100 leading-relaxed outline-none"
                />
              </div>

              {/* Email Subject & Body Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-sky-300 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>Subjek &amp; Template Isi Email Resmi</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {contactDraft.emailAutoBody.length} karakter
                  </span>
                </div>
                <input
                  type="text"
                  value={contactDraft.emailAutoSubject}
                  onChange={(e) => updateContactField('emailAutoSubject', e.target.value)}
                  placeholder="Subjek Email Otomatis"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 text-xs font-mono text-white outline-none"
                />
                <textarea
                  ref={emailTextareaRef}
                  rows={12}
                  value={contactDraft.emailAutoBody}
                  onFocus={() => setActiveTemplateField('email')}
                  onChange={(e) => updateContactField('emailAutoBody', e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 p-3.5 text-xs font-mono text-slate-100 leading-relaxed outline-none"
                />
              </div>
            </div>

            {/* Optional Live Preview */}
            {showPreview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-emerald-300 block">
                    Pratinjau Hasil Pesan WhatsApp (Contoh Nasabah)
                  </span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-[11px] font-mono text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {interpolateSupportTemplate(contactDraft.whatsappAutoMessage, sampleVars)}
                  </pre>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-sky-300 block">
                    Pratinjau Hasil Email (Contoh Nasabah)
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-sky-500/30 text-[11px] text-sky-200 font-semibold">
                    Subjek: {interpolateSupportTemplate(contactDraft.emailAutoSubject, sampleVars)}
                  </div>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-sky-500/30 text-[11px] font-mono text-slate-200 whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {interpolateSupportTemplate(contactDraft.emailAutoBody, sampleVars)}
                  </pre>
                </div>
              </div>
            )}

            {/* Submit Bar */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan Contact Us &amp; Template Permanen</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ====================================================================
          SUB-TAB 3: KELOLA 350 FAQ ACAK (+ TAMBAH / EDIT / - HAPUS / ACAK / RESET)
         ==================================================================== */}
      {subTab === 'faqs' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  placeholder="Cari dari 350 pertanyaan atau isi panduan FAQ..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShuffleFaqsInAdmin}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  title="Acak ulang urutan seluruh 350 FAQ dan simpan permanen"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Acak Urutan ({supportFaqs.length} FAQ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetFaqForm();
                    setShowAddForm(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah FAQ (+)</span>
                </button>

                {!confirmResetFaqs ? (
                  <button
                    type="button"
                    onClick={() => setConfirmResetFaqs(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset 350 FAQ Awal</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-amber-950/60 border border-amber-500/60">
                    <span className="text-[11px] text-amber-200 px-2 font-semibold">
                      Yakin reset ke 350 FAQ Acak awal?
                    </span>
                    <button
                      type="button"
                      onClick={handleReset350Faqs}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer"
                    >
                      Ya, Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResetFaqs(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Category Filter (10 Kategori Fitur) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFaqCatFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                  faqCatFilter === 'all'
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Semua Acak ({supportFaqs.length})
              </button>
              {SUPPORT_FAQ_CATEGORIES.map((cat) => {
                const count = supportFaqs.filter((f) => f.category === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFaqCatFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      faqCatFilter === cat.id
                        ? cat.accentClass
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.shortLabel} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add / Edit FAQ Form */}
          {showAddForm && (
            <form
              onSubmit={handleSaveFaqSubmit}
              className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/50 space-y-3.5 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-sm font-bold text-cyan-300">
                  {editingFaqId ? 'Edit Item Bantuan FAQ' : 'Tambah Item Bantuan FAQ Baru (+)'}
                </h4>
                <button
                  type="button"
                  onClick={resetFaqForm}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">Kategori FAQ</label>
                  <select
                    value={fCategory}
                    onChange={(e) => setFCategory(e.target.value as SupportFaqCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  >
                    {SUPPORT_FAQ_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Judul Pertanyaan FAQ (Wajib)
                  </label>
                  <input
                    type="text"
                    required
                    value={fQuestion}
                    onChange={(e) => setFQuestion(e.target.value)}
                    placeholder="Contoh: Bagaimana cara membuat akun baru tanpa sambungan Google?"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  Penjelasan Lengkap Jawaban (Wajib)
                </label>
                <textarea
                  rows={3}
                  required
                  value={fAnswer}
                  onChange={(e) => setFAnswer(e.target.value)}
                  placeholder="Tuliskan penjelasan lengkap dan jelas untuk nasabah..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  Petunjuk Langkah demi Langkah (Pisahkan per baris, otomatis diberi nomor 1, 2, 3...)
                </label>
                <textarea
                  rows={5}
                  value={fStepsText}
                  onChange={(e) => setFStepsText(e.target.value)}
                  placeholder={'Langkah pertama...\nLangkah kedua...\nLangkah ketiga...\nLangkah keempat...'}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Tips Praktis / Catatan Keamanan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={fTip}
                    onChange={(e) => setFTip(e.target.value)}
                    placeholder="Contoh: Jangan pernah membagikan PIN 6 Digit kepada siapa pun."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Kata Kunci Pencarian (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={fKeywordsText}
                    onChange={(e) => setFKeywordsText(e.target.value)}
                    placeholder="pin, kartu, tarik tunai, atm"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetFaqForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingFaqId ? 'Simpan Perubahan FAQ Permanen' : 'Tambahkan FAQ Permanen'}</span>
                </button>
              </div>
            </form>
          )}

          {/* FAQ List (Progressive Batching agar ringan di HP & Laptop) */}
          <div className="space-y-2.5">
            {displayedAdminFaqs.map((item, idx) => {
              const catMeta =
                SUPPORT_FAQ_CATEGORIES.find((c) => c.id === item.category) ||
                SUPPORT_FAQ_CATEGORIES[0];
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-mono tabular-nums font-bold text-cyan-400">
                        #{String(idx + 1).padStart(3, '0')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md border font-semibold ${catMeta.accentClass}`}
                      >
                        {catMeta.shortLabel}
                      </span>
                      <span className="text-slate-400 font-mono tabular-nums">
                        {(item.steps || []).length} Langkah Petunjuk
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white break-words">{item.question}</h5>
                    <p className="text-xs text-slate-300 leading-relaxed break-words">
                      {item.answer}
                    </p>
                    {item.steps && item.steps.length > 0 && (
                      <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-0.5 pt-1">
                        {item.steps.map((st, sIdx) => (
                          <li key={sIdx} className="break-words">
                            {st}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditFaq(item)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(item)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus (-)</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {faqVisibleCount < filteredFaqs.length && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFaqVisibleCount((prev) =>
                      Math.min(prev + ADMIN_FAQ_PAGE_SIZE, filteredFaqs.length)
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-200 font-bold text-xs cursor-pointer"
                >
                  Muat Lagi (+{Math.min(ADMIN_FAQ_PAGE_SIZE, filteredFaqs.length - faqVisibleCount)}{' '}
                  FAQ) • Tersisa {filteredFaqs.length - faqVisibleCount}
                </button>
                <button
                  type="button"
                  onClick={() => setFaqVisibleCount(filteredFaqs.length)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Tampilkan Semua ({filteredFaqs.length} FAQ)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
