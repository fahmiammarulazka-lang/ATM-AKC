import React, { useMemo, useState } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Copy,
  Check,
  Crown,
  Shield,
  User as UserIcon,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  LogOut,
  Wallet,
  Coins,
  Briefcase,
  CreditCard,
  Mail,
  AlertCircle,
  History,
  X,
  Sparkles,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  calculateNextFamilySlotCost,
  formatFamilyCode4x3,
} from '../data/diamondCatalog';
import { formatRupiah } from '../utils/bankUtils';
import { BankAccount, FamilyGroup } from '../types/bank';
import { DiamondIcon, DiamondText } from './DiamondIcon';

export const FamilyWorkspaceView: React.FC = () => {
  const {
    currentAccount,
    accounts,
    transactions,
    loans,
    families,
    familyConfig,
    diamondConfig,
    createFamilyGroup,
    purchaseExtraFamilySlot,
    joinFamilyByCode,
    leaveFamilyGroup,
    renameFamilyGroup,
    updateMemberNameTag,
    setFamilyMemberRole,
    setFamilyMemberPermissions,
    submitFamilyPermissionRequest,
    resolveFamilyPermissionRequest,
    kickFamilyMember,
    setIsDiamondStoreOpen,
  } = useBank();

  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [actionMode, setActionMode] = useState<'none' | 'create' | 'join'>('none');
  const [newFamilyName, setNewFamilyName] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    showTopUpShortcut?: boolean;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Edit family name / name tag states
  const [editingFamilyName, setEditingFamilyName] = useState<boolean>(false);
  const [familyNameDraft, setFamilyNameDraft] = useState<string>('');
  const [editingTagAccountId, setEditingTagAccountId] = useState<string | null>(null);
  const [nameTagDraft, setNameTagDraft] = useState<string>('');

  // Owner-only private info inspector
  const [inspectedMemberAccountId, setInspectedMemberAccountId] = useState<string | null>(null);

  const myFamilies = useMemo(() => {
    if (!currentAccount) return [];
    return families.filter((f) =>
      f.members.some((m) => m.accountId === currentAccount.id)
    );
  }, [families, currentAccount]);

  const ownedFamiliesCount = useMemo(() => {
    if (!currentAccount) return 0;
    return families.filter((f) => f.ownerAccountId === currentAccount.id).length;
  }, [families, currentAccount]);

  const maxOwnedSlots =
    (familyConfig.defaultMaxFamilies || 1) + (currentAccount?.extraFamilySlots || 0);

  const nextSlotCost = useMemo(
    () => calculateNextFamilySlotCost(currentAccount?.extraFamilySlots || 0, familyConfig),
    [currentAccount?.extraFamilySlots, familyConfig]
  );

  const activeFamily: FamilyGroup | null = useMemo(() => {
    if (myFamilies.length === 0) return null;
    if (selectedFamilyId) {
      const found = myFamilies.find((f) => f.id === selectedFamilyId);
      if (found) return found;
    }
    return myFamilies[0];
  }, [myFamilies, selectedFamilyId]);

  const myMemberRecord = useMemo(() => {
    if (!activeFamily || !currentAccount) return null;
    return activeFamily.members.find((m) => m.accountId === currentAccount.id) || null;
  }, [activeFamily, currentAccount]);

  const isOwner = Boolean(
    activeFamily && currentAccount && activeFamily.ownerAccountId === currentAccount.id
  );
  const isCoLeader = Boolean(myMemberRecord?.role === 'co_leader');

  const inspectedAccount: BankAccount | null = useMemo(() => {
    if (!isOwner || !inspectedMemberAccountId) return null;
    return accounts.find((a) => a.id === inspectedMemberAccountId) || null;
  }, [isOwner, inspectedMemberAccountId, accounts]);

  const inspectedTransactions = useMemo(() => {
    if (!inspectedAccount) return [];
    return transactions
      .filter((t) => t.accountId === inspectedAccount.id)
      .slice(0, 15);
  }, [inspectedAccount, transactions]);

  const inspectedLoanDebt = useMemo(() => {
    if (!inspectedAccount) return 0;
    const activeLoansSum = loans
      .filter((l) => l.accountId === inspectedAccount.id && l.status === 'approved')
      .reduce((acc, l) => {
        const remaining =
          typeof l.remainingInstallments === 'number'
            ? l.remainingInstallments * (l.monthlyInstallment || 0)
            : l.totalRepayment || l.amount || 0;
        return acc + Math.max(0, remaining);
      }, 0);
    return (inspectedAccount.debtAmount || 0) + activeLoansSum;
  }, [inspectedAccount, loans]);

  const handleJoinCodeChange = (rawValue: string) => {
    setJoinCodeInput(formatFamilyCode4x3(rawValue));
  };

  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createFamilyGroup(newFamilyName);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success && res.family) {
      setNewFamilyName('');
      setActionMode('none');
      setSelectedFamilyId(res.family.id);
    }
  };

  const handleJoinFamily = (e: React.FormEvent) => {
    e.preventDefault();
    const res = joinFamilyByCode(joinCodeInput);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success && res.family) {
      setJoinCodeInput('');
      setActionMode('none');
      setSelectedFamilyId(res.family.id);
    }
  };

  const handleBuySlot = () => {
    const res = purchaseExtraFamilySlot();
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
      showTopUpShortcut: Boolean(res.insufficientDiamonds),
    });
  };

  const handleCopyFamilyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1800);
    } catch {
      // ignore
    }
  };

  if (!currentAccount) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-black text-slate-900">Silakan Login Terlebih Dahulu</h2>
        <p className="mt-1 text-sm text-slate-500">
          Masuk ke rekening Bank Nusantara Anda untuk membuat atau bergabung dengan Keluarga.
        </p>
      </div>
    );
  }

  if (!familyConfig.enabled) {
    return (
      <div className="mx-auto max-w-4xl rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-600" />
        <h2 className="text-lg font-black text-amber-950">Fitur Keluarga Sedang Dinonaktifkan</h2>
        <p className="mt-1 text-sm text-amber-800">
          Admin sedang menonaktifkan sementara fitur Keluarga melalui Panel Admin.
        </p>
      </div>
    );
  }

  const slotDiamondNeeded =
    diamondConfig.enabledFeatures?.family_slots !== false
      ? nextSlotCost.diamondCost
      : 0;
  const pendingRequests = (activeFamily?.pendingRequests || []).filter(
    (r) => r.status === 'pending'
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* Top Hero & Slot Controls */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">
                  Keluarga Bank Nusantara
                </h1>
                <p className="text-xs text-slate-300">
                  Buat keluarga sendiri, undang dengan kode 12 digit, angkat Wakil Kepala Keluarga, & kelola anggota secara aman.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setActionMode(actionMode === 'create' ? 'none' : 'create');
                setFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-600 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Buat Keluarga
            </button>

            <button
              type="button"
              onClick={() => {
                setActionMode(actionMode === 'join' ? 'none' : 'join');
                setFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-sky-500 px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-sky-600 active:scale-95"
            >
              <KeyRound className="h-4 w-4" />
              Join Keluarga
            </button>
          </div>
        </div>

        {/* Slot Bar & Tiered Upgrade */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Slot Buat Keluarga Anda
              </p>
              <p className="text-lg font-black tabular-nums">
                {ownedFamiliesCount} / {maxOwnedSlots} Keluarga
              </p>
            </div>
            <div className="h-8 w-px bg-white/15 hidden sm:block" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                Biaya Tambah Slot ke-{nextSlotCost.nextSlotNumber}
              </p>
              <p className="flex flex-wrap items-center gap-1 text-xs font-black text-amber-300 tabular-nums">
                <span>{formatRupiah(nextSlotCost.moneyCost)}</span>
                {slotDiamondNeeded > 0 && (
                  <>
                    <span>+ {slotDiamondNeeded.toLocaleString('id-ID')}</span>
                    <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBuySlot}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow-sm transition hover:bg-amber-300 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Tambah Slot
            </button>
            {currentAccount.cardTier !== 'admin' &&
              (currentAccount.diamonds || 0) < 900_000_000_000_000 &&
              slotDiamondNeeded > 0 &&
              (currentAccount.diamonds || 0) < slotDiamondNeeded && (
              <button
                type="button"
                onClick={() => setIsDiamondStoreOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-cyan-500/20 px-3 py-2 text-xs font-bold text-cyan-200 ring-1 ring-cyan-400/40 hover:bg-cyan-500/30"
              >
                <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                Top-Up
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-xs font-bold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <DiamondText text={feedback.text} />
          <div className="flex items-center gap-2">
            {feedback.showTopUpShortcut && (
              <button
                type="button"
                onClick={() => setIsDiamondStoreOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-cyan-700 active:scale-95"
              >
                <span>Top-Up</span>
                <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                <span>Cepat</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-lg p-1 hover:bg-black/5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Create / Join Interactive Panel */}
      {actionMode === 'create' && (
        <form
          onSubmit={handleCreateFamily}
          className="rounded-3xl border-2 border-emerald-200 bg-emerald-50/50 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-black text-slate-900">Buat Keluarga Baru</h2>
            <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-black text-emerald-800">
              Sisa Slot: {Math.max(0, maxOwnedSlots - ownedFamiliesCount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Anda akan otomatis menjadi <strong>Kepala Keluarga (Pemilik)</strong> dengan akses penuh mengelola jabatan, izin, dan melihat informasi lengkap anggota.
          </p>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              placeholder="Masukkan Nama Keluarga (contoh: Keluarga Besar Nusantara)"
              maxLength={40}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={ownedFamiliesCount >= maxOwnedSlots}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              Buat Sekarang
            </button>
          </div>
          {ownedFamiliesCount >= maxOwnedSlots && (
            <p className="mt-2 text-xs font-bold text-rose-600">
              Slot Anda penuh ({ownedFamiliesCount}/{maxOwnedSlots}). Klik tombol "Tambah Slot" di atas terlebih dahulu.
            </p>
          )}
        </form>
      )}

      {actionMode === 'join' && (
        <form
          onSubmit={handleJoinFamily}
          className="rounded-3xl border-2 border-sky-200 bg-sky-50/60 p-5 shadow-sm"
        >
          <h2 className="text-base font-black text-slate-900">Join Keluarga dengan Kode</h2>
          <p className="mt-1 text-xs text-slate-600">
            Ketik langsung 12 karakter kode keluarga — spasi manual diblokir & sistem otomatis memberi jarak per 4 huruf (format <code className="font-mono font-black">XXXX XXXX XXXX</code>).
          </p>
          <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
            <input
              type="text"
              value={joinCodeInput}
              onKeyDown={(e) => {
                if (e.key === ' ') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => handleJoinCodeChange(e.target.value)}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 font-mono text-base font-black tracking-widest text-slate-900 uppercase focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-sky-700"
            >
              Masuk Keluarga
            </button>
          </div>
        </form>
      )}

      {/* Family Switcher Tabs (if user is in >= 1 families) */}
      {myFamilies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {myFamilies.map((fam) => {
            const active = activeFamily?.id === fam.id;
            const ownerBadge = fam.ownerAccountId === currentAccount.id;
            return (
              <button
                key={fam.id}
                type="button"
                onClick={() => {
                  setSelectedFamilyId(fam.id);
                  setEditingFamilyName(false);
                  setEditingTagAccountId(null);
                  setInspectedMemberAccountId(null);
                }}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-black transition ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {ownerBadge && <Crown className="h-3.5 w-3.5 text-amber-300" />}
                <span>{fam.name}</span>
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {fam.members.length} orang
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Empty State if user not in any family yet */}
      {!activeFamily ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-base font-black text-slate-900">
            Anda Belum Tergabung di Keluarga Mana Pun
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
            Tekan <strong>Buat Keluarga</strong> untuk mendirikan keluarga baru (gratis 1 slot bawaan), atau tekan <strong>Join Keluarga</strong> jika Anda sudah menerima kode <code className="font-mono font-bold">XXXX XXXX XXXX</code>.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Family Header Card + Prominent Code XXXX XXXX XXXX */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {/* Family Code Banner at the very top */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                  Kode Undangan Keluarga (4 x 3 Digit)
                </p>
                <p className="font-mono text-xl font-black tracking-[0.18em] text-indigo-950">
                  {activeFamily.familyCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopyFamilyCode(activeFamily.familyCode)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700"
              >
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? 'Kode Disalin!' : 'Salin Kode'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 min-w-[220px]">
                {editingFamilyName ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={familyNameDraft}
                      onChange={(e) => setFamilyNameDraft(e.target.value)}
                      maxLength={40}
                      className="rounded-xl border border-indigo-300 px-3 py-2 text-sm font-black text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (isOwner || myMemberRecord?.canEditFamilyName) {
                          const res = renameFamilyGroup(activeFamily.id, familyNameDraft);
                          setFeedback({
                            type: res.success ? 'success' : 'error',
                            text: res.message,
                          });
                        } else {
                          const res = submitFamilyPermissionRequest(
                            activeFamily.id,
                            'family_name',
                            familyNameDraft
                          );
                          setFeedback({
                            type: res.success ? 'success' : 'error',
                            text: res.message,
                          });
                        }
                        setEditingFamilyName(false);
                      }}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-700"
                    >
                      {isOwner || myMemberRecord?.canEditFamilyName
                        ? 'Simpan Nama'
                        : 'Ajukan ke Kepala Keluarga'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFamilyName(false)}
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">{activeFamily.name}</h2>
                    <button
                      type="button"
                      onClick={() => {
                        setFamilyNameDraft(activeFamily.name);
                        setEditingFamilyName(true);
                      }}
                      title={
                        isOwner || myMemberRecord?.canEditFamilyName
                          ? 'Ubah Nama Keluarga'
                          : 'Ajukan Ganti Nama Keluarga ke Kepala Keluarga'
                      }
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition hover:bg-indigo-100 hover:text-indigo-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <p className="mt-1 text-xs text-slate-500">
                  Total Anggota: <strong>{activeFamily.members.length}</strong> /{' '}
                  {familyConfig.maxMembersPerFamily} • Jabatan Anda:{' '}
                  <strong className="text-indigo-700">
                    {isOwner
                      ? 'Kepala Keluarga (Pemilik)'
                      : isCoLeader
                      ? 'Wakil Kepala Keluarga (Co-Leader)'
                      : 'Anggota'}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const res = leaveFamilyGroup(activeFamily.id);
                  setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                  setSelectedFamilyId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                {isOwner ? 'Bubarkan Keluarga' : 'Keluar Keluarga'}
              </button>
            </div>
          </div>

          {/* Pending Approval Requests Queue (Owner Only) */}
          {isOwner && pendingRequests.length > 0 && (
            <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-amber-700" />
                <h3 className="text-sm font-black text-amber-950">
                  Permintaan Izin Anggota Menunggu Persetujuan ({pendingRequests.length})
                </h3>
              </div>
              <div className="mt-3 space-y-2.5">
                {pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white p-3.5"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {req.requesterName}{' '}
                        <span className="font-semibold text-slate-500">
                          mengajukan perubahan{' '}
                          {req.type === 'family_name' ? 'Nama Keluarga' : 'Name Tag'}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-indigo-700">
                        Usulan baru: "{req.proposedValue}"
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const res = resolveFamilyPermissionRequest(
                            activeFamily.id,
                            req.id,
                            'approved'
                          );
                          setFeedback({
                            type: res.success ? 'success' : 'error',
                            text: res.message,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = resolveFamilyPermissionRequest(
                            activeFamily.id,
                            req.id,
                            'rejected'
                          );
                          setFeedback({
                            type: res.success ? 'success' : 'error',
                            text: res.message,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-100 px-3 py-1.5 text-xs font-black text-rose-700 hover:bg-rose-200"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Member Roster */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Daftar Anggota Keluarga ({activeFamily.members.length})
                </h3>
                <p className="text-xs text-slate-500">
                  {isOwner
                    ? 'Sebagai Kepala Keluarga, Anda dapat melihat Info Umum & Info Pribadi Lengkap setiap anggota serta mengatur jabatan dan izin.'
                    : 'Anggota dapat melihat Info Umum seluruh anggota keluarga. Data pribadi (rekening, saldo, hutang, mutasi) terlindungi eksklusif untuk Kepala Keluarga.'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {activeFamily.members.map((member) => {
                const memberAcc = accounts.find((a) => a.id === member.accountId);
                const isSelf = member.accountId === currentAccount.id;
                const isTargetOwner = member.role === 'owner';
                const canDirectEditThisTag =
                  isOwner ||
                  (isCoLeader && myMemberRecord?.canEditNameTag && !isTargetOwner) ||
                  (isSelf && member.canEditNameTag);

                return (
                  <div
                    key={member.accountId}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-indigo-200"
                  >
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                      {/* General Info (Visible to all members) */}
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {memberAcc?.fullName || 'Nasabah Bank Nusantara'}
                          </span>
                          {isSelf && (
                            <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              Anda
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-black ${
                              member.role === 'owner'
                                ? 'bg-amber-100 text-amber-800'
                                : member.role === 'co_leader'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {member.role === 'owner' ? (
                              <Crown className="h-3 w-3" />
                            ) : member.role === 'co_leader' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <UserIcon className="h-3 w-3" />
                            )}
                            {member.role === 'owner'
                              ? 'Kepala Keluarga'
                              : member.role === 'co_leader'
                              ? 'Wakil Kepala Keluarga (Co-Leader)'
                              : 'Anggota'}
                          </span>
                          <span className="rounded-lg bg-cyan-100 px-2 py-0.5 text-[10px] font-black text-cyan-900">
                            Tag: {member.nameTag}
                          </span>
                        </div>

                        {/* General Metadata Strip */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
                          <span>ID: {memberAcc?.userId16 || member.accountId}</span>
                          <span>• Level Pekerjaan: Lv.{memberAcc?.jobLevel || 1}</span>
                          <span>• Tier Kartu: {(memberAcc?.cardTier || 'silver').toUpperCase()}</span>
                          <span>
                            • Gabung: {new Date(member.joinedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        {/* Inline Name Tag Editor */}
                        {editingTagAccountId === member.accountId && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              value={nameTagDraft}
                              onChange={(e) => setNameTagDraft(e.target.value)}
                              maxLength={32}
                              placeholder="Tulis Name Tag baru..."
                              className="rounded-lg border border-indigo-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-900"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (canDirectEditThisTag) {
                                  const res = updateMemberNameTag(
                                    activeFamily.id,
                                    member.accountId,
                                    nameTagDraft
                                  );
                                  setFeedback({
                                    type: res.success ? 'success' : 'error',
                                    text: res.message,
                                  });
                                } else {
                                  const res = submitFamilyPermissionRequest(
                                    activeFamily.id,
                                    'name_tag',
                                    nameTagDraft
                                  );
                                  setFeedback({
                                    type: res.success ? 'success' : 'error',
                                    text: res.message,
                                  });
                                }
                                setEditingTagAccountId(null);
                              }}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-black text-white hover:bg-indigo-700"
                            >
                              {canDirectEditThisTag ? 'Simpan Tag' : 'Ajukan ke Kepala Keluarga'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTagAccountId(null)}
                              className="rounded-lg bg-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700"
                            >
                              Batal
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Member Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {(isSelf || isOwner || (isCoLeader && myMemberRecord?.canEditNameTag && !isTargetOwner)) && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTagAccountId(member.accountId);
                              setNameTagDraft(member.nameTag);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <Pencil className="h-3 w-3" />
                            {canDirectEditThisTag ? 'Ganti Name Tag' : 'Minta Ganti Tag'}
                          </button>
                        )}

                        {/* Owner-only Private Inspector Trigger */}
                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => setInspectedMemberAccountId(member.accountId)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-indigo-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Info Pribadi Lengkap
                          </button>
                        )}

                        {/* Owner Role Promotion / Demotion */}
                        {isOwner && !isTargetOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextRole =
                                member.role === 'co_leader' ? 'member' : 'co_leader';
                              const res = setFamilyMemberRole(
                                activeFamily.id,
                                member.accountId,
                                nextRole
                              );
                              setFeedback({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                              member.role === 'co_leader'
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                            }`}
                          >
                            <Shield className="h-3 w-3" />
                            {member.role === 'co_leader' ? 'Turunkan Wakil' : 'Angkat Wakil'}
                          </button>
                        )}

                        {/* Kick Member */}
                        {!isTargetOwner && !isSelf && (isOwner || isCoLeader) && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = kickFamilyMember(activeFamily.id, member.accountId);
                              setFeedback({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100"
                            title="Keluarkan anggota"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Owner-Only Direct Permission Toggles */}
                    {isOwner && !isTargetOwner && (
                      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-2.5 text-[11px]">
                        <span className="font-bold text-slate-500">Sakelar Izin Langsung:</span>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(member.canEditNameTag)}
                            onChange={(e) => {
                              const res = setFamilyMemberPermissions(
                                activeFamily.id,
                                member.accountId,
                                { canEditNameTag: e.target.checked }
                              );
                              setFeedback({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className="h-3.5 w-3.5 rounded accent-indigo-600"
                          />
                          Boleh Ganti Name Tag Langsung
                        </label>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={Boolean(member.canEditFamilyName)}
                            onChange={(e) => {
                              const res = setFamilyMemberPermissions(
                                activeFamily.id,
                                member.accountId,
                                { canEditFamilyName: e.target.checked }
                              );
                              setFeedback({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className="h-3.5 w-3.5 rounded accent-indigo-600"
                          />
                          Boleh Ganti Nama Keluarga Langsung
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Owner-Only Private Member Inspector Modal */}
      {isOwner && inspectedAccount && (
        <div className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <Crown className="h-5 w-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-black">
                    Info Pribadi Lengkap: {inspectedAccount.fullName}
                  </h3>
                  <p className="flex flex-wrap items-center gap-1 text-[11px] text-slate-300">
                    <span>Akses eksklusif Kepala Keluarga • Rekening, Email, Saldo, Coin,</span>
                    <DiamondIcon tone="bright" className="h-3 w-3" />
                    <span>, Hutang, Level &amp; Mutasi</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedMemberAccountId(null)}
                className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              {/* Identity Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                    Nomor Rekening
                  </div>
                  <p className="mt-1 font-mono text-sm font-black text-slate-900">
                    {inspectedAccount.accountNumber}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                    <Mail className="h-3.5 w-3.5 text-sky-600" />
                    Email Terdaftar
                  </div>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {inspectedAccount.googleEmail || inspectedAccount.email || 'Belum ditautkan'}
                  </p>
                </div>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                    <Wallet className="h-3.5 w-3.5" />
                    Saldo Uang
                  </div>
                  <p className="mt-1 text-sm font-black text-emerald-950 tabular-nums">
                    {formatRupiah(inspectedAccount.balance)}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                    <Coins className="h-3.5 w-3.5" />
                    Saldo Coin
                  </div>
                  <p className="mt-1 text-sm font-black text-amber-950 tabular-nums">
                    {(inspectedAccount.spinCoins || 0).toLocaleString('id-ID')} Coin
                  </p>
                </div>
                <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-700">
                    <span>Saldo</span>
                    <DiamondIcon className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-sm font-black text-cyan-950 tabular-nums">
                    <span>{(inspectedAccount.diamonds || 0).toLocaleString('id-ID')}</span>
                    <DiamondIcon className="h-4 w-4" />
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Total Hutang
                  </div>
                  <p className="mt-1 text-sm font-black text-rose-950 tabular-nums">
                    {formatRupiah(inspectedLoanDebt)}
                  </p>
                </div>
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
                    <Briefcase className="h-3.5 w-3.5" />
                    Level Pekerjaan
                  </div>
                  <p className="mt-1 text-sm font-black text-indigo-950">
                    Level {inspectedAccount.jobLevel || 1} ({inspectedAccount.levelVouchers || 0} Voucher)
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Poin & Tier
                  </div>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {(inspectedAccount.rewardPoints || 0).toLocaleString('id-ID')} Poin •{' '}
                    {inspectedAccount.cardTier.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Member Transaction History */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Riwayat Transaksi Terbaru ({inspectedTransactions.length})
                  </h4>
                </div>
                {inspectedTransactions.length === 0 ? (
                  <p className="py-4 text-center text-xs text-slate-400">
                    Belum ada riwayat transaksi tercatat pada rekening ini.
                  </p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {inspectedTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-800">
                            <DiamondText text={tx.title || tx.description || tx.type} />
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(tx.timestamp || tx.date || Date.now()).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span className="shrink-0 font-black text-slate-900 tabular-nums">
                          {formatRupiah(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
