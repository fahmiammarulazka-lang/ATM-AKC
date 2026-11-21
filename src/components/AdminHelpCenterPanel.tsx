/**
 * Tab Khusus "Pusat Bantuan" di Panel Admin
 * 1. Pengaturan Contact Us (Nomor WhatsApp, Email, Jam Layanan, Subjek Email,
 *    Template Pesan WhatsApp Panjang, Template Isi Email Panjang)
 *    + Tombol 1-Klik Sisip Variabel + Reset ke Template Bawaan + Live Preview + Simpan ke Cloud
 * 2. Pengelolaan Penuh Daftar FAQ: Tambah (+), Edit, Hapus (-), Filter 5 Kategori,
 *    Pencarian, dan Reset ke 50 FAQ Komprehensif Awal.
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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { SupportContactConfig, SupportFaqCategory, SupportFaqItem } from '../types/bank';
import {
  SUPPORT_FAQ_CATEGORIES,
  SUPPORT_TEMPLATE_VARIABLES,
  DEFAULT_SUPPORT_CONTACT_CONFIG,
  formatWhatsappDisplay,
  interpolateSupportTemplate,
} from '../data/supportFaqCatalog';

export const AdminHelpCenterPanel: React.FC = () => {
  const {
    supportFaqs,
    supportContactConfig,
    adminUpdateSupportContactConfig,
    adminAddSupportFaq,
    adminUpdateSupportFaq,
    adminDeleteSupportFaq,
    adminResetSupportFaqs,
  } = useBank();

  const [subTab, setSubTab] = useState<'contact' | 'faqs'>('contact');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Contact Us Draft State (synced when hydrated from Cloud unless user is actively editing)
  const [contactDraft, setContactDraft] = useState<SupportContactConfig>(() => ({
    ...supportContactConfig,
  }));
  const isContactDirtyRef = useRef(false);
  const waTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const emailTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [activeTemplateField, setActiveTemplateField] = useState<'whatsapp' | 'email'>('whatsapp');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!isContactDirtyRef.current) {
      setContactDraft({ ...supportContactConfig });
    }
  }, [supportContactConfig]);

  // FAQ Management State
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCatFilter, setFaqCatFilter] = useState<'all' | SupportFaqCategory>('all');
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
    }, 5000);
  };

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
      return { ...prev, [fieldKey]: `${currentVal}${currentVal.endsWith(' ') || !currentVal ? '' : ' '}${token}` };
    });
  };

  const handleSaveContactConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminUpdateSupportContactConfig(contactDraft);
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
      'Template pesan WhatsApp & Email dikembalikan ke format tiket resmi bawaan. Klik "Simpan Pengaturan ke Cloud" untuk menerapkan.'
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
      topik: 'Penggunaan Kartu ATM, PIN & Aktivasi',
      waktu: '20 Nov 2026, 17:30 WIB',
    }),
    []
  );

  // Filtered FAQs
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

  const handleReset50Faqs = () => {
    const res = adminResetSupportFaqs();
    setConfirmResetFaqs(false);
    resetFaqForm();
    flashFeedback(res.success ? 'success' : 'error', res.message);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <HelpCircle className="w-4 h-4" />
            <span>Panel Pengaturan Pusat Bantuan &amp; Contact Us</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono tabular-nums text-slate-300">
              {supportFaqs.length} FAQ Aktif
            </span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">
            Kelola WhatsApp, Email, Template Tiket Otomatis &amp; Daftar FAQ
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Perubahan langsung tersinkron ke Cloud Firestore dan tampil real-time di tombol logo WhatsApp pojok kanan bawah Dashboard nasabah.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('contact')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              subTab === 'contact'
                ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Contact Us &amp; Template</span>
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
            <span>Kelola FAQ ({supportFaqs.length})</span>
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
            <span>{feedback.text}</span>
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
          SUB-TAB 1: CONTACT US (WA, EMAIL & TEMPLATE TIKET PANJANG)
         ==================================================================== */}
      {subTab === 'contact' && (
        <form onSubmit={handleSaveContactConfig} className="space-y-5">
          {/* Identitas & Kontak */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  1. Pengaturan Nomor WhatsApp &amp; Alamat Email Resmi
                </h4>
                <p className="text-xs text-slate-400">
                  Nasabah akan diarahkan langsung ke nomor WhatsApp dan alamat Email ini saat menekan tombol Contact Us.
                </p>
              </div>
              <div className="text-xs font-mono text-emerald-300">
                WA Aktif: {formatWhatsappDisplay(contactDraft.whatsappNumber)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Nama Layanan Bantuan</label>
                <input
                  type="text"
                  value={contactDraft.serviceName}
                  onChange={(e) => updateContactField('serviceName', e.target.value)}
                  placeholder="Layanan Nasabah Resmi Bank Nusantara"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 px-3 py-2.5 text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Jam Layanan</label>
                  <input
                    type="text"
                    value={contactDraft.operatingHours}
                    onChange={(e) => updateContactField('operatingHours', e.target.value)}
                    placeholder="24 Jam Nonstop"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 px-3 py-2.5 text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300 block">Estimasi Respon</label>
                  <input
                    type="text"
                    value={contactDraft.responseEstimate}
                    onChange={(e) => updateContactField('responseEstimate', e.target.value)}
                    placeholder="Rata-rata balas 1–5 menit"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 px-3 py-2.5 text-white outline-none"
                  />
                </div>
              </div>

              {/* Nomor WA */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    <span>Nomor Telepon WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={contactDraft.whatsappEnabled}
                      onChange={(e) => updateContactField('whatsappEnabled', e.target.checked)}
                      className="accent-emerald-500 w-3.5 h-3.5"
                    />
                    <span>Aktifkan WA</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={contactDraft.whatsappNumber}
                  onChange={(e) => updateContactField('whatsappNumber', e.target.value)}
                  placeholder="Contoh: 6281234567890 atau 081234567890"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-emerald-500 px-3 py-2 text-white font-mono tabular-nums outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Format 08... atau 628... otomatis dikonversi menjadi tautan resmi <span className="font-mono text-emerald-300">wa.me</span>.
                </p>
              </div>

              {/* Alamat Email */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-sky-300 flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    <span>Alamat Email Bantuan</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={contactDraft.emailEnabled}
                      onChange={(e) => updateContactField('emailEnabled', e.target.checked)}
                      className="accent-sky-500 w-3.5 h-3.5"
                    />
                    <span>Aktifkan Email</span>
                  </label>
                </div>
                <input
                  type="email"
                  value={contactDraft.emailAddress}
                  onChange={(e) => updateContactField('emailAddress', e.target.value)}
                  placeholder="cs@banknusantara.id"
                  className="w-full rounded-lg bg-slate-900 border border-slate-700 focus:border-sky-500 px-3 py-2 text-white font-mono outline-none"
                />
                <p className="text-[11px] text-slate-400">
                  Digunakan untuk tombol kirim <span className="font-mono text-sky-300">mailto:</span> beserta subjek &amp; isi tiket otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Template Pesan Otomatis Panjang + 1-Klik Sisip Variabel */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">
                  2. Editor Template Pesan Otomatis Panjang (WhatsApp &amp; Email)
                </h4>
                <p className="text-xs text-slate-400">
                  Admin bebas mengedit seluruh teks template. Klik tombol variabel di bawah untuk menyisipkan data akun nasabah otomatis ke posisi kursor.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((p) => !p)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showPreview ? 'Tutup Pratinjau' : 'Lihat Pratinjau Hasil'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetContactTemplates}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Template Bawaan</span>
                </button>
              </div>
            </div>

            {/* 1-Klik Sisip Variabel Bar */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tombol 1-Klik Sisip Variabel Otomatis ke Kotak:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTemplateField('whatsapp')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      activeTemplateField === 'whatsapp'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Target: Template WA
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTemplateField('email')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      activeTemplateField === 'email'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Target: Template Email
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUPPORT_TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => handleInsertVariable(v.token, activeTemplateField)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-[11px] font-mono text-slate-200 cursor-pointer transition-colors"
                    title={`Sisipkan ${v.label} (Contoh: ${v.sample})`}
                  >
                    <span className="text-cyan-300 font-bold">{v.token}</span>{' '}
                    <span className="text-slate-400 font-sans">({v.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Template WhatsApp */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-emerald-300 block">
                Template Pesan Otomatis WhatsApp (Bebas Diedit Penuh)
              </label>
              <textarea
                ref={waTextareaRef}
                rows={11}
                value={contactDraft.whatsappAutoMessage}
                onFocus={() => setActiveTemplateField('whatsapp')}
                onChange={(e) => updateContactField('whatsappAutoMessage', e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 p-3 text-white font-mono text-[11.5px] leading-relaxed outline-none"
              />
            </div>

            {/* Subjek & Template Email */}
            <div className="space-y-3 text-xs pt-2 border-t border-slate-800">
              <div className="space-y-1.5">
                <label className="font-bold text-sky-300 block">
                  Template Subjek Email Otomatis
                </label>
                <input
                  type="text"
                  value={contactDraft.emailAutoSubject}
                  onChange={(e) => updateContactField('emailAutoSubject', e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 px-3 py-2.5 text-white font-mono text-xs outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-sky-300 block">
                  Template Isi Email Otomatis (Bebas Diedit Penuh)
                </label>
                <textarea
                  ref={emailTextareaRef}
                  rows={12}
                  value={contactDraft.emailAutoBody}
                  onFocus={() => setActiveTemplateField('email')}
                  onChange={(e) => updateContactField('emailAutoBody', e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-sky-500 p-3 text-white font-mono text-[11.5px] leading-relaxed outline-none"
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
                <span>Simpan Pengaturan Contact Us &amp; Template ke Cloud</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ====================================================================
          SUB-TAB 2: KELOLA FAQ (+ TAMBAH / EDIT / - HAPUS / RESET 50 FAQ)
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
                  placeholder="Cari pertanyaan atau isi panduan FAQ..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 text-xs text-white outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
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
                    <span>Reset 50 FAQ Awal</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-amber-950/60 border border-amber-500/60">
                    <span className="text-[11px] text-amber-200 px-2 font-semibold">
                      Yakin reset ke 50 FAQ awal?
                    </span>
                    <button
                      type="button"
                      onClick={handleReset50Faqs}
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

            {/* Category Filter */}
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
                Semua ({supportFaqs.length})
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
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none"
                  >
                    {SUPPORT_FAQ_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
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
                    placeholder="Contoh: Bagaimana cara mengubah PIN Kartu ATM saya?"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none"
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
                  placeholder="Tuliskan penjelasan lengkap, jelas, dan akurat untuk nasabah..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300 block">
                  Petunjuk Langkah Bernomor (1 baris = 1 langkah)
                </label>
                <textarea
                  rows={4}
                  value={fStepsText}
                  onChange={(e) => setFStepsText(e.target.value)}
                  placeholder={'Buka menu Pengaturan Akun di Dashboard.\nPilih tombol Ubah PIN Kartu.\nMasukkan PIN lama dan PIN baru 6 digit lalu simpan.'}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white font-mono text-[11.5px] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 block">
                    Tips Praktis / Keamanan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={fTip}
                    onChange={(e) => setFTip(e.target.value)}
                    placeholder="Contoh: Hindari memakai tanggal lahir sebagai PIN."
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none"
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
                    placeholder="pin, ganti pin, lupa pin, kartu"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetFaqForm}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingFaqId ? 'Simpan Perubahan FAQ' : 'Tambahkan FAQ ke Cloud'}</span>
                </button>
              </div>
            </form>
          )}

          {/* FAQ List */}
          <div className="space-y-2">
            {filteredFaqs.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
                Belum ada item FAQ pada filter ini.
              </div>
            ) : (
              filteredFaqs.map((item, idx) => {
                const catMeta =
                  SUPPORT_FAQ_CATEGORIES.find((c) => c.id === item.category) ||
                  SUPPORT_FAQ_CATEGORIES[0];
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-mono tabular-nums text-cyan-400 font-bold">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="font-semibold text-slate-300">{catMeta.shortLabel}</span>
                        <span className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums">
                          {item.steps?.length || 0} langkah
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">{item.question}</h5>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.answer}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditFaq(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/70 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Hapus FAQ (-)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
