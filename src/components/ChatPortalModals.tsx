import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  UserPlus,
  Users,
  Check,
  CheckCheck,
  ShieldCheck,
  Crown,
  Info,
  Trash2,
  LogOut,
  Edit3,
  Eye,
  Clock,
  Send,
  Forward,
  BarChart2,
  Plus,
  VolumeX,
  Volume2,
  Megaphone,
  Lock,
  Unlock,
  Ban,
  ShieldAlert,
  Download,
  Copy,
  Pin,
  PinOff,
  AlertTriangle,
  History,
  Sparkles,
  Briefcase,
  Home,
  Star,
  Heart,
  Zap,
  Search,
} from 'lucide-react';
import {
  BankAccount,
  ChatForwardInfo,
  ChatMessage,
  ChatModerationLog,
  ChatPollData,
  GlobalChatConfig,
  GlobalChatMessage,
  PrivateChatContact,
  PrivateChatGroup,
} from '../types/bank';

export const CHAT_GROUP_ICON_OPTIONS = [
  { key: 'users', label: 'Komunitas', Icon: Users },
  { key: 'briefcase', label: 'Bisnis', Icon: Briefcase },
  { key: 'home', label: 'Keluarga', Icon: Home },
  { key: 'star', label: 'VIP', Icon: Star },
  { key: 'heart', label: 'Sahabat', Icon: Heart },
  { key: 'zap', label: 'Cepat', Icon: Zap },
];

export const CHAT_GROUP_COLOR_OPTIONS: Array<{
  key: string;
  label: string;
  bgClass: string;
  ringClass: string;
}> = [
  { key: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-600 text-white', ringClass: 'ring-indigo-400' },
  { key: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-600 text-white', ringClass: 'ring-emerald-400' },
  { key: 'sky', label: 'Biru', bgClass: 'bg-sky-600 text-white', ringClass: 'ring-sky-400' },
  { key: 'amber', label: 'Emas', bgClass: 'bg-amber-500 text-slate-950', ringClass: 'ring-amber-300' },
  { key: 'rose', label: 'Rose', bgClass: 'bg-rose-600 text-white', ringClass: 'ring-rose-400' },
  { key: 'violet', label: 'Violet', bgClass: 'bg-violet-600 text-white', ringClass: 'ring-violet-400' },
];

export function renderChatGroupIcon(iconKey: string, className = 'w-5 h-5') {
  const found = CHAT_GROUP_ICON_OPTIONS.find((item) => item.key === iconKey) || CHAT_GROUP_ICON_OPTIONS[0];
  const IconComp = found.Icon;
  return <IconComp className={className} />;
}

export function getChatGroupColorClass(colorKey: string): string {
  return CHAT_GROUP_COLOR_OPTIONS.find((c) => c.key === colorKey)?.bgClass || 'bg-indigo-600 text-white';
}

export function formatChatTimeShort(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function formatChatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==================== SHARED PORTAL SHELL (ANTI-CLIPPING MOBILE & DESKTOP) ====================
interface PortalModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidthClass?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const PortalModalShell: React.FC<PortalModalShellProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  maxWidthClass = 'max-w-lg',
  footer,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full ${maxWidthClass} max-h-[92dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="shrink-0">{icon}</div>}
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ==================== MODAL 1: TAMBAH / SIMPAN NASABAH (3 KOLOM + PREFILL) ====================
interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  currentAccountId?: string;
  initialPrefill?: {
    customName?: string;
    userId?: string;
    accountNumber?: string;
    isQuickSave?: boolean;
  } | null;
  onSubmit: (input: {
    customName?: string;
    userId?: string;
    accountNumber?: string;
    isQuickSave?: boolean;
  }) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  open,
  onClose,
  accounts,
  currentAccountId,
  initialPrefill,
  onSubmit,
}) => {
  const [customName, setCustomName] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [accNoInput, setAccNoInput] = useState('');

  useEffect(() => {
    if (open) {
      setCustomName(initialPrefill?.customName || '');
      setUserIdInput(initialPrefill?.userId || '');
      setAccNoInput(initialPrefill?.accountNumber || '');
    }
  }, [open, initialPrefill]);

  const previewAccount = useMemo(() => {
    const cleanUid = userIdInput.replace(/\D/g, '').trim();
    const cleanAcc = accNoInput.replace(/\D/g, '').trim();
    if (!cleanUid && !cleanAcc) return null;
    const byUid = cleanUid
      ? accounts.find((a) => String(a.userId16 || '').replace(/\D/g, '') === cleanUid)
      : undefined;
    const byAcc = cleanAcc
      ? accounts.find((a) => String(a.accountNumber || '').replace(/\D/g, '') === cleanAcc)
      : undefined;
    if (cleanUid && cleanAcc && byUid && byAcc && byUid.id !== byAcc.id) {
      return { conflict: true as const, account: null };
    }
    const found = byUid || byAcc || null;
    return { conflict: false as const, account: found };
  }, [accounts, userIdInput, accNoInput]);

  const isSelf = previewAccount?.account?.id === currentAccountId;
  const canConfirm = Boolean(previewAccount && !previewAccount.conflict && previewAccount.account && !isSelf);

  const handleConfirm = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canConfirm) return;
    onSubmit({
      customName: customName.trim() || undefined,
      userId: userIdInput.trim() || undefined,
      accountNumber: accNoInput.trim() || undefined,
      isQuickSave: Boolean(initialPrefill?.isQuickSave),
    });
  };

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title={initialPrefill?.isQuickSave ? 'Simpan Nasabah ke Kontak' : 'Tambah Nasabah Chat Privat'}
      subtitle={
        initialPrefill?.isQuickSave
          ? 'User ID & No. Rekening sudah terisi otomatis — beri nama panggilan opsional'
          : 'Isi salah satu: User ID (16 digit) atau No. Rekening nasabah tujuan'
      }
      icon={
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
          <UserPlus className="w-5 h-5" />
        </div>
      }
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() => handleConfirm()}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2 shadow-sm"
          >
            <Check className="w-4 h-4" />
            {initialPrefill?.isQuickSave ? 'Konfirmasi Simpan Nasabah' : 'Konfirmasi Tambah Nasabah'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            1. Nama Panggilan / Kontak <span className="font-normal normal-case text-slate-400">(Opsional)</span>
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            maxLength={60}
            placeholder="Contoh: Kak Budi / Admin Resmi"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              2. User ID (16 Digit)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value.replace(/[^\d\s-]/g, ''))}
              placeholder="Masukkan User ID"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              3. No. Rekening
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={accNoInput}
              onChange={(e) => setAccNoInput(e.target.value.replace(/[^\d\s-]/g, ''))}
              placeholder="Contoh: 1001234567"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/70 rounded-xl px-3.5 py-2.5">
          Cukup isi <strong>salah satu</strong> antara User ID atau No. Rekening. Nasabah yang sudah disimpan otomatis muncul sebagai pilihan anggota saat membuat <strong>Grup Privat</strong>.
        </p>

        {/* Live preview card */}
        {previewAccount && (
          <div
            className={`rounded-2xl p-3.5 border ${
              previewAccount.conflict || !previewAccount.account || isSelf
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {previewAccount.conflict ? (
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                User ID dan No. Rekening merujuk ke dua akun berbeda. Cukup isi salah satu saja.
              </p>
            ) : !previewAccount.account ? (
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Nasabah tidak ditemukan di database Bank Nusantara. Periksa kembali angka yang dimasukkan.
              </p>
            ) : isSelf ? (
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Anda tidak dapat menambahkan rekening milik Anda sendiri.
              </p>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {customName.trim() || previewAccount.account.fullName}
                    </span>
                    {previewAccount.account.cardTier === 'admin' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/50">
                        <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Terdaftar: <strong>{previewAccount.account.fullName}</strong> • Rek {previewAccount.account.accountNumber}
                  </p>
                  {previewAccount.account.userId16 && (
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      ID: {previewAccount.account.userId16}
                    </p>
                  )}
                </div>
                <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </PortalModalShell>
  );
};

// ==================== MODAL 2: BUAT GRUP PRIVAT (STRICT: HANYA DARI NASABAH TERSIMPAN) ====================
interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  savedContacts: PrivateChatContact[];
  accounts: BankAccount[];
  onOpenAddContactFirst: () => void;
  onCreate: (input: {
    name: string;
    description?: string;
    rules?: string;
    iconKey: string;
    accentColor: string;
    memberAccountIds: string[];
  }) => Promise<void>;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  open,
  onClose,
  savedContacts,
  accounts,
  onOpenAddContactFirst,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [iconKey, setIconKey] = useState('users');
  const [accentColor, setAccentColor] = useState('indigo');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setRules('');
      setIconKey('users');
      setAccentColor('indigo');
      setSelectedIds([]);
      setSubmitting(false);
    }
  }, [open]);

  const toggleMember = (accId: string) => {
    setSelectedIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  const canCreate = name.trim().length > 0 && selectedIds.length >= 1 && !submitting;

  const handleSubmit = async () => {
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        rules: rules.trim() || undefined,
        iconKey,
        accentColor,
        memberAccountIds: selectedIds,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title="Buat Grup Privat Baru"
      subtitle="Anggota hanya dipilih dari daftar Nasabah yang sudah Anda tambahkan"
      icon={
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${getChatGroupColorClass(accentColor)}`}>
          {renderChatGroupIcon(iconKey, 'w-5 h-5')}
        </div>
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Dipilih: <strong className="text-slate-900 dark:text-white">{selectedIds.length}</strong> anggota (+ Anda)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!canCreate}
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
            >
              <Users className="w-4 h-4" />
              {submitting ? 'Membuat...' : 'Buat Grup'}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Nama Grup Privat <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Contoh: Grup Bisnis Keluarga / Arisan Nusantara"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Deskripsi Grup <span className="font-normal normal-case text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="Tujuan atau catatan singkat grup"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Aturan Grup <span className="font-normal normal-case text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              maxLength={250}
              placeholder="Misal: Dilarang spam, gunakan bahasa sopan"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Ikon Grup
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CHAT_GROUP_ICON_OPTIONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconKey(key)}
                  className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl border text-[11px] font-semibold transition-all ${
                    iconKey === key
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Warna Aksen
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {CHAT_GROUP_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setAccentColor(c.key)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all ${c.bgClass} ${
                    accentColor === c.key ? `ring-2 ring-offset-2 dark:ring-offset-slate-900 ${c.ringClass}` : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {accentColor === c.key && <Check className="w-3.5 h-3.5" />}
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* STRICT PRIVACY MEMBER PICKER: ONLY FROM SAVED CONTACTS */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pilih Anggota dari Nasabah Tersimpan (Min. 1)
            </label>
            <button
              type="button"
              onClick={onOpenAddContactFirst}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" /> Tambah Nasabah
            </button>
          </div>

          {savedContacts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-200/80 dark:bg-slate-800 text-slate-500 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Daftar Anggota Masih Kosong
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  Demi privasi, Anda harus menambahkan nasabah menggunakan User ID atau No. Rekening terlebih dahulu sebelum memilihnya sebagai anggota grup.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddContactFirst}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Tambah Nasabah Dulu
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedContacts.map((contact) => {
                const acc = accounts.find(
                  (a) => a.id === contact.targetAccountId || a.accountNumber === contact.targetAccountNumber
                );
                const memberId = acc?.id || contact.targetAccountId;
                const isChecked = selectedIds.includes(memberId);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleMember(memberId)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isChecked
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {contact.customName || acc?.fullName || contact.registeredName}
                        </span>
                        {(acc?.cardTier === 'admin' || contact.cardTier === 'admin') && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Rek {contact.targetAccountNumber}
                        {contact.customName ? ` • ${acc?.fullName || contact.registeredName}` : ''}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PortalModalShell>
  );
};

// ==================== MODAL 3: INFO & PENGATURAN GRUP PRIVAT ====================
interface GroupInfoModalProps {
  open: boolean;
  onClose: () => void;
  group: PrivateChatGroup | null;
  currentAccount: BankAccount | null;
  accounts: BankAccount[];
  savedContacts: PrivateChatContact[];
  isGroupMuted: boolean;
  pinnedMessages: ChatMessage[];
  onToggleMuteGroup: () => void;
  onUpdateDetails: (patch: {
    name?: string;
    description?: string;
    rules?: string;
    coAdminAccountIds?: string[];
  }) => Promise<void>;
  onAddMember: (memberAccountId: string) => Promise<void>;
  onRemoveMember: (memberAccountId: string) => Promise<void>;
  onQuickSaveMemberContact: (acc: BankAccount) => void;
  onUnpinMessage: (messageId: string) => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onDeleteGroup: () => Promise<void>;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  open,
  onClose,
  group,
  currentAccount,
  accounts,
  savedContacts,
  isGroupMuted,
  pinnedMessages,
  onToggleMuteGroup,
  onUpdateDetails,
  onAddMember,
  onRemoveMember,
  onQuickSaveMemberContact,
  onUnpinMessage,
  onLeaveGroup,
  onDeleteGroup,
}) => {
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');
  const [lookupInput, setLookupInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open && group) {
      setEditName(group.name || '');
      setEditDesc(group.description || '');
      setEditRules(group.rules || '');
      setLookupInput('');
      setConfirmDelete(false);
    }
  }, [open, group]);

  if (!group || !currentAccount) return null;

  const isCreator = group.creatorAccountId === currentAccount.id;
  const coAdmins = group.coAdminAccountIds || [];
  const isCoAdmin = coAdmins.includes(currentAccount.id);
  const canManage = isCreator || isCoAdmin;

  const isSavedContact = (accId: string, accNo?: string) =>
    savedContacts.some((c) => c.targetAccountId === accId || (accNo && c.targetAccountNumber === accNo));

  const addableSavedContacts = savedContacts.filter((c) => !group.memberAccountIds.includes(c.targetAccountId));

  const lookupMatch = useMemo(() => {
    const clean = lookupInput.replace(/\D/g, '').trim();
    if (clean.length < 4) return null;
    return (
      accounts.find(
        (a) =>
          String(a.accountNumber || '').replace(/\D/g, '') === clean ||
          String(a.userId16 || '').replace(/\D/g, '') === clean
      ) || null
    );
  }, [accounts, lookupInput]);

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title={`Info Grup • ${group.name}`}
      subtitle={`${group.memberAccountIds.length} anggota aktif`}
      icon={
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getChatGroupColorClass(group.accentColor)}`}>
          {renderChatGroupIcon(group.iconKey, 'w-5 h-5')}
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onLeaveGroup}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 hover:bg-amber-200 dark:hover:bg-amber-900/60 inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Keluar Grup
          </button>
          {isCreator && (
            !confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Grup
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={onDeleteGroup}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Ya, Hapus Permanen
                </button>
              </div>
            )
          )}
        </div>
      }
    >
      {/* Notification Mute Toggle */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/70">
        <div className="flex items-center gap-2.5 min-w-0">
          {isGroupMuted ? (
            <VolumeX className="w-5 h-5 text-amber-500 shrink-0" />
          ) : (
            <Volume2 className="w-5 h-5 text-emerald-500 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">Notifikasi Suara Grup</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isGroupMuted ? 'Dibisukan sementara di akun Anda' : 'Aktif — bunyi beep saat pesan masuk'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleMuteGroup}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
            isGroupMuted
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
          }`}
        >
          {isGroupMuted ? 'Aktifkan' : 'Bisukan'}
        </button>
      </div>

      {/* Group Details & Rules */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4" /> Identitas & Aturan Grup
        </div>
        {canManage ? (
          <>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={80}
              placeholder="Nama grup"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
            <textarea
              rows={2}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              maxLength={240}
              placeholder="Deskripsi singkat grup..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
            />
            <textarea
              rows={2}
              value={editRules}
              onChange={(e) => setEditRules(e.target.value)}
              maxLength={320}
              placeholder="Aturan grup (opsional)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
            />
            <button
              type="button"
              onClick={() =>
                onUpdateDetails({
                  name: editName.trim() || group.name,
                  description: editDesc.trim(),
                  rules: editRules.trim(),
                })
              }
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" /> Simpan Perubahan Info Grup
            </button>
          </>
        ) : (
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p>
              <strong>Deskripsi:</strong> {group.description || 'Belum ada deskripsi grup.'}
            </p>
            <p>
              <strong>Aturan:</strong> {group.rules || 'Jaga kesopanan dan keamanan transaksi sesama anggota.'}
            </p>
          </div>
        )}
      </div>

      {/* Pinned Messages in Group */}
      {pinnedMessages.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/25 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Pin className="w-3.5 h-3.5" /> Pesan Disematkan ({pinnedMessages.length})
          </div>
          {pinnedMessages.map((pm) => (
            <div
              key={pm.id}
              className="flex items-start justify-between gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/70 text-xs"
            >
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{pm.senderName}</p>
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2">{pm.text}</p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onUnpinMessage(pm.id)}
                  className="shrink-0 p-1.5 rounded-lg text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  title="Lepas sematan"
                >
                  <PinOff className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Member List + Simpan Nasabah for unsaved members + Co-Admin controls */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Daftar Anggota ({group.memberAccountIds.length})
        </p>
        <div className="space-y-2">
          {group.memberAccountIds.map((memberId) => {
            const acc = accounts.find((a) => a.id === memberId);
            const isMe = memberId === currentAccount.id;
            const memberIsCreator = memberId === group.creatorAccountId;
            const memberIsCoAdmin = coAdmins.includes(memberId);
            const savedContact = savedContacts.find((c) => c.targetAccountId === memberId);
            const unsaved = !isMe && acc && !isSavedContact(memberId, acc.accountNumber);

            return (
              <div
                key={memberId}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {isMe
                        ? `${currentAccount.fullName} (Anda)`
                        : savedContact?.customName || acc?.fullName || memberId}
                    </span>
                    {acc?.cardTier === 'admin' && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                      </span>
                    )}
                    {memberIsCreator && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        <Crown className="w-3 h-3" /> Pembuat
                      </span>
                    )}
                    {!memberIsCreator && memberIsCoAdmin && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300">
                        Co-Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {acc ? `Rek ${acc.accountNumber}` : 'Anggota Grup'}
                    {unsaved && ' • Belum Disimpan'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  {unsaved && acc && (
                    <button
                      type="button"
                      onClick={() => onQuickSaveMemberContact(acc)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-sm"
                    >
                      <UserPlus className="w-3 h-3" /> Simpan Nasabah
                    </button>
                  )}
                  {isCreator && !memberIsCreator && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextCo = memberIsCoAdmin
                          ? coAdmins.filter((id) => id !== memberId)
                          : [...coAdmins, memberId];
                        void onUpdateDetails({ coAdminAccountIds: nextCo });
                      }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                        memberIsCoAdmin
                          ? 'border-sky-400 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {memberIsCoAdmin ? 'Cabut Co-Admin' : 'Jadikan Co-Admin'}
                    </button>
                  )}
                  {canManage && !memberIsCreator && !isMe && (
                    <button
                      type="button"
                      onClick={() => onRemoveMember(memberId)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50"
                      title="Keluarkan anggota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add New Member in Info Grup: Saved Contacts + User ID / No. Rekening */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Tambah Anggota Baru (Kontak Tersimpan / User ID / No. Rek)
        </p>

        {addableSavedContacts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {addableSavedContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onAddMember(c.targetAccountId)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {c.customName || c.registeredName}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={lookupInput}
            onChange={(e) => setLookupInput(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="Ketik User ID (16 digit) atau No. Rekening..."
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
          />
          <button
            type="button"
            disabled={!lookupMatch || group.memberAccountIds.includes(lookupMatch.id)}
            onClick={() => {
              if (lookupMatch) {
                void onAddMember(lookupMatch.id);
                setLookupInput('');
              }
            }}
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40"
          >
            Tambah
          </button>
        </div>
        {lookupInput.length >= 4 && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lookupMatch
              ? group.memberAccountIds.includes(lookupMatch.id)
                ? `${lookupMatch.fullName} sudah menjadi anggota grup ini.`
                : `Ditemukan: ${lookupMatch.fullName} (Rek ${lookupMatch.accountNumber})`
              : 'Belum cocok dengan User ID / No. Rekening nasabah manapun.'}
          </p>
        )}
      </div>
    </PortalModalShell>
  );
};

// ==================== MODAL 4: INFO DIBACA KHUSUS GRUP PRIVAT ====================
interface ReadReceiptModalProps {
  open: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  group: PrivateChatGroup | null;
  accounts: BankAccount[];
}

export const ReadReceiptModal: React.FC<ReadReceiptModalProps> = ({
  open,
  onClose,
  message,
  group,
  accounts,
}) => {
  if (!message || !group) return null;
  const otherMemberIds = group.memberAccountIds.filter((id) => id !== message.senderAccountId);
  const readByMap = message.readBy || {};

  const readers = otherMemberIds
    .filter((id) => Boolean(readByMap[id]))
    .map((id) => {
      const acc = accounts.find((a) => a.id === id);
      return {
        id,
        name: acc?.fullName || readByMap[id].accountName,
        accountNumber: acc?.accountNumber,
        readAt: readByMap[id].readAt,
        readAtMs: readByMap[id].readAtMs,
      };
    })
    .sort((a, b) => b.readAtMs - a.readAtMs);

  const unreadMembers = otherMemberIds
    .filter((id) => !readByMap[id])
    .map((id) => {
      const acc = accounts.find((a) => a.id === id);
      return {
        id,
        name: acc?.fullName || id,
        accountNumber: acc?.accountNumber,
      };
    });

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title="Info Pesan Dibaca (Grup Privat)"
      subtitle={`Dilihat oleh ${readers.length} dari ${otherMemberIds.length} anggota`}
      icon={
        <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center">
          <Eye className="w-5 h-5" />
        </div>
      }
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
          >
            Tutup
          </button>
        </div>
      }
    >
      {/* Message preview */}
      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
          {message.senderName} • {formatChatTimeShort(message.timestamp)}
        </p>
        <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap break-words">
          {message.text || (message.poll ? `Polling: ${message.poll.question}` : 'Pesan')}
        </p>
      </div>

      {/* Sudah Membaca */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          <CheckCheck className="w-4 h-4" /> Sudah Membaca ({readers.length})
        </div>
        {readers.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
            Belum ada anggota lain yang membaca pesan ini.
          </p>
        ) : (
          <div className="space-y-1.5">
            {readers.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-800/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.name}</p>
                  {r.accountNumber && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Rek {r.accountNumber}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-semibold text-sky-700 dark:text-sky-300 inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {formatChatDateTime(r.readAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Belum Membaca */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <Clock className="w-4 h-4" /> Belum Membaca ({unreadMembers.length})
        </div>
        {unreadMembers.length === 0 ? (
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">
            Semua anggota grup telah membaca pesan ini!
          </p>
        ) : (
          <div className="space-y-1.5">
            {unreadMembers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{u.name}</p>
                  {u.accountNumber && (
                    <p className="text-[11px] text-slate-400">Rek {u.accountNumber}</p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Menunggu</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalModalShell>
  );
};

// ==================== MODAL 5: TERUSKAN PESAN (FORWARD) ====================
interface ForwardMessageModalProps {
  open: boolean;
  onClose: () => void;
  sourceText: string;
  forwardMeta: ChatForwardInfo | null;
  savedContacts: PrivateChatContact[];
  groups: PrivateChatGroup[];
  onForwardToGlobal: () => Promise<void>;
  onForwardToDm: (contact: PrivateChatContact) => void;
  onForwardToGroup: (group: PrivateChatGroup) => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  open,
  onClose,
  sourceText,
  forwardMeta,
  savedContacts,
  groups,
  onForwardToGlobal,
  onForwardToDm,
  onForwardToGroup,
}) => {
  const [q, setQ] = useState('');
  const cleanQ = q.trim().toLowerCase();

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title="Teruskan Pesan"
      subtitle={forwardMeta ? `Dari ${forwardMeta.originalSenderName}` : 'Pilih tujuan pengiriman'}
      icon={
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
          <Forward className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 line-clamp-3">
        {sourceText}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kontak atau grup tujuan..."
          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
        />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            void onForwardToGlobal();
            onClose();
          }}
          className="w-full flex items-center justify-between gap-2 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-left"
        >
          <div>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Chat Global Bank Nusantara</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Teruskan ke ruang obrolan global</p>
          </div>
          <Send className="w-4 h-4 text-emerald-600" />
        </button>

        {groups
          .filter((g) => !cleanQ || g.name.toLowerCase().includes(cleanQ))
          .map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => {
                onForwardToGroup(grp);
                onClose();
              }}
              className="w-full flex items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getChatGroupColorClass(grp.accentColor)}`}>
                  {renderChatGroupIcon(grp.iconKey, 'w-4 h-4')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{grp.name}</p>
                  <p className="text-[11px] text-slate-500">Grup Privat • {grp.memberAccountIds.length} anggota</p>
                </div>
              </div>
              <Send className="w-4 h-4 text-indigo-600 shrink-0" />
            </button>
          ))}

        {savedContacts
          .filter(
            (c) =>
              !cleanQ ||
              (c.customName || c.registeredName).toLowerCase().includes(cleanQ) ||
              c.targetAccountNumber.includes(cleanQ)
          )
          .map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onForwardToDm(c);
                onClose();
              }}
              className="w-full flex items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {c.customName || c.registeredName}
                </p>
                <p className="text-[11px] text-slate-500">Chat Privat 1-on-1 • Rek {c.targetAccountNumber}</p>
              </div>
              <Send className="w-4 h-4 text-indigo-600 shrink-0" />
            </button>
          ))}
      </div>
    </PortalModalShell>
  );
};

// ==================== MODAL 6: BUAT POLLING / VOTING CEPAT (GRUP & ADMIN GLOBAL) ====================
interface CreatePollModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  onCreatePoll: (poll: ChatPollData) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  open,
  onClose,
  title = 'Buat Polling Cepat',
  onCreatePoll,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestion('');
      setOptions(['', '']);
      setAllowMultiple(false);
    }
  }, [open]);

  const validOptions = options.map((o) => o.trim()).filter(Boolean);
  const canSubmit = question.trim().length > 0 && validOptions.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onCreatePoll({
      question: question.trim(),
      allowMultiple,
      votesByAccountId: {},
      options: validOptions.map((text, idx) => ({
        id: `opt-${Date.now()}-${idx}`,
        text,
      })),
    });
    onClose();
  };

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle="Buat pertanyaan voting real-time untuk anggota ruang chat"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center">
          <BarChart2 className="w-5 h-5" />
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-45"
          >
            Kirim Polling
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
            Pertanyaan Polling
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={140}
            placeholder="Contoh: Jadwal kumpul minggu ini enaknya kapan?"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
            Pilihan Jawaban (Min. 2, Maks. 6)
          </label>
          {options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={(e) =>
                  setOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                }
                maxLength={80}
                placeholder={`Opsi ${idx + 1}`}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/40"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ''])}
              className="text-xs font-bold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Opsi
            </button>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
            className="w-4 h-4 rounded accent-violet-600"
          />
          Izinkan peserta memilih lebih dari satu opsi
        </label>
      </div>
    </PortalModalShell>
  );
};

// ==================== MODAL 7: TEGUR LANGSUNG NASABAH (ADMIN) ====================
interface AdminWarnModalProps {
  open: boolean;
  onClose: () => void;
  target: { accountId: string; name: string } | null;
  onSubmit: (reason: string) => Promise<void>;
}

export const AdminWarnModal: React.FC<AdminWarnModalProps> = ({
  open,
  onClose,
  target,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) {
      setReason('Mohon menjaga etika dan ketertiban saat berdiskusi di Chat Global Bank Nusantara.');
    }
  }, [open]);

  if (!target) return null;

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      title={`Tegur Langsung • ${target.name}`}
      subtitle="Mengirim notifikasi peringatan resmi langsung ke perangkat nasabah ini"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={async () => {
              await onSubmit(reason);
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950"
          >
            Kirim Teguran Resmi
          </button>
        </div>
      }
    >
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Tulis isi teguran resmi..."
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
      />
    </PortalModalShell>
  );
};

// ==================== MODAL 8: PANEL MODERASI & SIARAN ADMIN CHAT GLOBAL ====================
interface AdminModerationModalProps {
  open: boolean;
  initialTab?: 'broadcast' | 'moderation' | 'filter' | 'logs';
  prefillMuteTarget?: { accountId: string; name: string; accountNumber?: string } | null;
  onClose: () => void;
  globalChats: GlobalChatMessage[];
  globalChatConfig: GlobalChatConfig;
  connectedDevicesCount: number;
  accounts: BankAccount[];
  moderationLogs: ChatModerationLog[];
  onSendAnnouncement: (input: {
    text: string;
    showPopupOnAllPhones: boolean;
    isPinned: boolean;
    isAdminHighlight: boolean;
  }) => Promise<void>;
  onOpenAdminPoll: () => void;
  onToggleLock: (locked: boolean, cooldownMs?: number) => Promise<void>;
  onUpdateConfig: (partial: Partial<GlobalChatConfig>, logDetail?: string) => Promise<void>;
  onMuteUser: (input: {
    accountId: string;
    accountName: string;
    accountNumber?: string;
    amount: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
    isPermanent?: boolean;
    reason?: string;
  }) => Promise<void>;
  onUnmuteUser: (accountId: string) => Promise<void>;
  onClearAllGlobal: () => Promise<void>;
  onCopyRecap: () => void;
  onDownloadRecap: () => void;
}

export const AdminModerationModal: React.FC<AdminModerationModalProps> = ({
  open,
  initialTab = 'broadcast',
  prefillMuteTarget,
  onClose,
  globalChats,
  globalChatConfig,
  connectedDevicesCount,
  accounts,
  moderationLogs,
  onSendAnnouncement,
  onOpenAdminPoll,
  onToggleLock,
  onUpdateConfig,
  onMuteUser,
  onUnmuteUser,
  onClearAllGlobal,
  onCopyRecap,
  onDownloadRecap,
}) => {
  const [tab, setTab] = useState<'broadcast' | 'moderation' | 'filter' | 'logs'>(initialTab);
  const [announceText, setAnnounceText] = useState('');
  const [announcePopup, setAnnouncePopup] = useState(true);
  const [announcePin, setAnnouncePin] = useState(true);
  const [announceHighlight, setAnnounceHighlight] = useState(true);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  // Flexible Mute form states
  const [muteTargetId, setMuteTargetId] = useState('');
  const [muteAmount, setMuteAmount] = useState('10');
  const [muteUnit, setMuteUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes');
  const [mutePermanent, setMutePermanent] = useState(false);
  const [muteReason, setMuteReason] = useState('');

  // Banned words state
  const [newBannedWord, setNewBannedWord] = useState('');

  useEffect(() => {
    if (open) {
      setTab(prefillMuteTarget ? 'moderation' : initialTab);
      setConfirmClearAll(false);
      if (prefillMuteTarget) {
        setMuteTargetId(prefillMuteTarget.accountId);
      }
    }
  }, [open, initialTab, prefillMuteTarget]);

  const mutedEntries = useMemo(() => {
    const map = globalChatConfig.mutedUsers || {};
    return Object.values(map).filter(
      (entry) => entry && (entry.isPermanent || (entry.mutedUntilMs && entry.mutedUntilMs > Date.now()))
    );
  }, [globalChatConfig.mutedUsers]);

  const selectableCustomers = useMemo(
    () => accounts.filter((a) => a.cardTier !== 'admin' && a.id !== 'acc-admin'),
    [accounts]
  );

  const slowModePresets = [
    { label: 'Off', ms: 0 },
    { label: '3d', ms: 3000 },
    { label: '5d', ms: 5000 },
    { label: '15d', ms: 15000 },
    { label: '30d', ms: 30000 },
    { label: '60d', ms: 60000 },
  ];

  const handleAddBannedWord = async () => {
    const clean = newBannedWord.trim().toLowerCase();
    if (!clean) return;
    const prev = globalChatConfig.bannedWords || [];
    if (prev.includes(clean)) {
      setNewBannedWord('');
      return;
    }
    const next = [...prev, clean];
    await onUpdateConfig({ bannedWords: next }, `Menambahkan kata terlarang "${clean}"`);
    setNewBannedWord('');
  };

  const handleRemoveBannedWord = async (word: string) => {
    const next = (globalChatConfig.bannedWords || []).filter((w) => w !== word);
    await onUpdateConfig({ bannedWords: next }, `Menghapus kata terlarang "${word}"`);
  };

  return (
    <PortalModalShell
      open={open}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      title="Pusat Moderasi & Siaran Admin Chat"
      subtitle="Kontrol penuh Chat Global: Pengumuman, Mute Fleksibel, Slow Mode, Filter Kata & Log"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-5 h-5" />
        </div>
      }
    >
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
          <p className="text-[10px] font-bold uppercase text-slate-500">Total Pesan</p>
          <p className="text-lg font-extrabold text-slate-900 dark:text-white">{globalChats.length}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Online</p>
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">{connectedDevicesCount} HP</p>
        </div>
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
          <p className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Slow Mode</p>
          <p className="text-lg font-extrabold text-amber-700 dark:text-amber-300">
            {globalChatConfig.cooldownMs > 0 ? `${Math.round(globalChatConfig.cooldownMs / 1000)} dtk` : 'Off'}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30">
          <p className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">Di-Mute</p>
          <p className="text-lg font-extrabold text-rose-700 dark:text-rose-300">{mutedEntries.length} Akun</p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
        {[
          { id: 'broadcast' as const, label: 'Siaran', Icon: Megaphone },
          { id: 'moderation' as const, label: 'Moderasi', Icon: Ban },
          { id: 'filter' as const, label: 'Filter Kata', Icon: ShieldAlert },
          { id: 'logs' as const, label: 'Log Admin', Icon: History },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`py-2 px-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
              tab === id
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SIARAN & REKAP */}
      {tab === 'broadcast' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-300/70 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 inline-flex items-center gap-1.5">
                <Megaphone className="w-4 h-4" /> Pengumuman / Broadcast Cepat Admin
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPoll();
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-violet-600 hover:bg-violet-700 text-white inline-flex items-center gap-1"
              >
                <BarChart2 className="w-3 h-3" /> Buat Polling Resmi
              </button>
            </div>
            <textarea
              rows={3}
              value={announceText}
              onChange={(e) => setAnnounceText(e.target.value)}
              placeholder="Tulis pengumuman resmi Admin untuk seluruh nasabah..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            />
            <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcePopup}
                  onChange={(e) => setAnnouncePopup(e.target.checked)}
                  className="accent-amber-500"
                />
                Tampilkan Pop-up di semua HP
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcePin}
                  onChange={(e) => setAnnouncePin(e.target.checked)}
                  className="accent-amber-500"
                />
                Auto-Pin di atas Chat Global
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announceHighlight}
                  onChange={(e) => setAnnounceHighlight(e.target.checked)}
                  className="accent-amber-500"
                />
                Mode Sorotan Admin (Emas)
              </label>
            </div>
            <button
              type="button"
              disabled={!announceText.trim()}
              onClick={async () => {
                await onSendAnnouncement({
                  text: announceText.trim(),
                  showPopupOnAllPhones: announcePopup,
                  isPinned: announcePin,
                  isAdminHighlight: announceHighlight,
                });
                setAnnounceText('');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 disabled:opacity-45 shadow-sm inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Kirim Siaran Resmi Sekarang
            </button>
          </div>

          {/* Export / Copy & Clear All */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCopyRecap}
              className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4 text-indigo-500" /> Salin Rekap Chat Global
            </button>
            <button
              type="button"
              onClick={onDownloadRecap}
              className="py-2.5 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-500" /> Ekspor Rekap (.TXT)
            </button>
          </div>

          <div className="rounded-2xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/20 p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Bersihkan Semua Chat Global</p>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">
                Menghapus permanen seluruh pesan di Chat Global pada semua perangkat.
              </p>
            </div>
            {!confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Bersihkan Chat
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await onClearAllGlobal();
                    setConfirmClearAll(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-700 text-white"
                >
                  Ya, Hapus Semua
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MODERASI, SLOW MODE & MUTE FLEKSIBEL */}
      {tab === 'moderation' && (
        <div className="space-y-4">
          {/* Lock & Slow Mode */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Mode Khusus Admin (Lock Global)</p>
                <p className="text-[11px] text-slate-500">Hanya Admin yang bisa mengirim pesan saat aktif</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleLock(!globalChatConfig.adminOnlyLock)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${
                  globalChatConfig.adminOnlyLock
                    ? 'bg-rose-600 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {globalChatConfig.adminOnlyLock ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                {globalChatConfig.adminOnlyLock ? 'Terkunci (Klik Buka)' : 'Terbuka (Klik Kunci)'}
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Slow Mode (Jeda Antar Pesan Nasabah)
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {slowModePresets.map((p) => {
                  const active = (globalChatConfig.cooldownMs || 0) === p.ms;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => onToggleLock(globalChatConfig.adminOnlyLock, p.ms)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? 'bg-amber-500 border-amber-500 text-slate-950'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Flexible Mute Form */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 inline-flex items-center gap-1.5">
              <Ban className="w-4 h-4" /> Mute Nasabah (Durasi Bebas / Permanen)
            </p>
            <select
              value={muteTargetId}
              onChange={(e) => setMuteTargetId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="">-- Pilih Nasabah yang akan di-Mute --</option>
              {prefillMuteTarget &&
                !selectableCustomers.some((a) => a.id === prefillMuteTarget.accountId) && (
                  <option value={prefillMuteTarget.accountId}>
                    {prefillMuteTarget.name} ({prefillMuteTarget.accountNumber || prefillMuteTarget.accountId})
                  </option>
                )}
              {selectableCustomers.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.fullName} — Rek {a.accountNumber}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="number"
                min={1}
                max={9999}
                disabled={mutePermanent}
                value={muteAmount}
                onChange={(e) => setMuteAmount(e.target.value)}
                placeholder="Angka durasi"
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white disabled:opacity-40"
              />
              <select
                disabled={mutePermanent}
                value={muteUnit}
                onChange={(e) => setMuteUnit(e.target.value as 'seconds' | 'minutes' | 'hours' | 'days')}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-40"
              >
                <option value="seconds">Detik</option>
                <option value="minutes">Menit</option>
                <option value="hours">Jam</option>
                <option value="days">Hari</option>
              </select>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mutePermanent}
                  onChange={(e) => setMutePermanent(e.target.checked)}
                  className="accent-rose-600"
                />
                Permanen
              </label>
            </div>

            <input
              type="text"
              value={muteReason}
              onChange={(e) => setMuteReason(e.target.value)}
              placeholder="Alasan mute (opsional, misal: Spam berulang)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />

            <button
              type="button"
              disabled={!muteTargetId}
              onClick={async () => {
                const targetAcc = accounts.find((a) => a.id === muteTargetId);
                await onMuteUser({
                  accountId: muteTargetId,
                  accountName: targetAcc?.fullName || prefillMuteTarget?.name || muteTargetId,
                  accountNumber: targetAcc?.accountNumber || prefillMuteTarget?.accountNumber,
                  amount: Math.max(1, Number(muteAmount) || 1),
                  unit: muteUnit,
                  isPermanent: mutePermanent,
                  reason: muteReason.trim() || undefined,
                });
                setMuteReason('');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-40"
            >
              Terapkan Mute Sekarang
            </button>
          </div>

          {/* Active Muted Users List */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daftar Nasabah Sedang Di-Mute ({mutedEntries.length})
            </p>
            {mutedEntries.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Tidak ada nasabah yang sedang di-mute.</p>
            ) : (
              mutedEntries.map((m) => (
                <div
                  key={m.accountId}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {m.accountName} {m.accountNumber ? `(${m.accountNumber})` : ''}
                    </p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Durasi: {m.durationLabel}
                      {m.mutedUntilMs && !m.isPermanent ? ` • s/d ${formatChatDateTime(new Date(m.mutedUntilMs).toISOString())}` : ''}
                      {m.reason ? ` • ${m.reason}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUnmuteUser(m.accountId)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Buka Mute
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FILTER KATA TERLARANG */}
      {tab === 'filter' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Mode Tindakan Kata Terlarang</p>
              <p className="text-[11px] text-slate-500">Pilih sensor otomatis menjadi *** atau blokir pengiriman pesan</p>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({ bannedWordMode: 'censor' }, 'Mengubah mode filter kata menjadi Sensor (***)')
                }
                className={`px-3 py-1.5 text-xs font-bold ${
                  (globalChatConfig.bannedWordMode || 'censor') === 'censor'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                Sensor ***
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateConfig({ bannedWordMode: 'block' }, 'Mengubah mode filter kata menjadi Blokir Pesan')
                }
                className={`px-3 py-1.5 text-xs font-bold ${
                  globalChatConfig.bannedWordMode === 'block'
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                Blokir
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newBannedWord}
              onChange={(e) => setNewBannedWord(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAddBannedWord();
                }
              }}
              placeholder="Tambah kata terlarang (contoh: judol, spam)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddBannedWord}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Tambah
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(globalChatConfig.bannedWords || []).length === 0 ? (
              <p className="text-xs text-slate-500 italic">Belum ada kata terlarang yang ditambahkan.</p>
            ) : (
              (globalChatConfig.bannedWords || []).map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => handleRemoveBannedWord(word)}
                    className="hover:text-rose-950 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: LOG RIWAYAT MODERASI */}
      {tab === 'logs' && (
        <div className="space-y-2">
          {moderationLogs.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">
              Belum ada aktivitas moderasi Admin yang tercatat.
            </p>
          ) : (
            moderationLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{log.detail}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Oleh <strong>{log.adminName}</strong> • {formatChatDateTime(log.timestamp)}
                  </p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {log.action}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </PortalModalShell>
  );
};
