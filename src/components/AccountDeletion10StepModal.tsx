import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
  Clock,
  UserCheck,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'admin' | 'customer';
  initialTargetAccountId?: string;
  onDeleted?: (message: string) => void;
}

const STEP_LABELS = [
  { num: 1, title: 'Penjelasan' },
  { num: 2, title: 'Pertanyaan' },
  { num: 3, title: 'Alasan' },
  { num: 4, title: 'Konfirmasi Admin' },
  { num: 5, title: 'Ketik HAPUS' },
] as const;

export const AccountDeletion5StepModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTargetAccountId,
  onDeleted,
}) => {
  const {
    accounts,
    currentAccount,
    accountDeletionRequests,
    submitAccountDeletionRequest,
    cancelAccountDeletionRequest,
    approveAccountDeletionRequest,
    rejectAccountDeletionRequest,
    adminDeleteAccount,
  } = useBank();

  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [adminTab, setAdminTab] = useState<'queue' | 'quick_delete'>('queue');
  const [step, setStep] = useState<number>(1);

  // Step 2: 3 Pertanyaan konfirmasi
  const [qUnderstandLoss, setQUnderstandLoss] = useState<boolean>(false);
  const [qNoPending, setQNoPending] = useState<boolean>(false);
  const [qAgreeAdmin, setQAgreeAdmin] = useState<boolean>(false);

  // Step 3: Alasan
  const [reasonCategory, setReasonCategory] = useState<string>('Rekening Ganda / Tidak Terpakai');
  const [reasonDetail, setReasonDetail] = useState<string>('');

  // Step 5 / Quick Delete: Ketik HAPUS
  const [confirmKeyword, setConfirmKeyword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Admin Queue note per request
  const [adminNotesById, setAdminNotesById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    const defaultId =
      mode === 'customer'
        ? currentAccount?.id || accounts[0]?.id || ''
        : initialTargetAccountId || accounts[0]?.id || '';
    setTargetAccountId(defaultId);
    setAdminTab('queue');
    setStep(1);
    setQUnderstandLoss(false);
    setQNoPending(false);
    setQAgreeAdmin(false);
    setReasonCategory('Rekening Ganda / Tidak Terpakai');
    setReasonDetail('');
    setConfirmKeyword('');
    setFormError('');
    setStatusMessage('');
  }, [isOpen, mode, initialTargetAccountId, currentAccount?.id]);

  if (!isOpen) return null;

  const targetAccount =
    accounts.find((a) => a.id === targetAccountId) ||
    (mode === 'customer' ? currentAccount : accounts[0]) ||
    null;

  const pendingRequestForCustomer =
    mode === 'customer' && targetAccount
      ? accountDeletionRequests.find(
          (r) => r.accountId === targetAccount.id && r.status === 'pending'
        ) || null
      : null;

  const latestRejectedForCustomer =
    mode === 'customer' && targetAccount && !pendingRequestForCustomer
      ? accountDeletionRequests.find(
          (r) => r.accountId === targetAccount.id && r.status === 'rejected'
        ) || null
      : null;

  const pendingQueue = accountDeletionRequests.filter((r) => r.status === 'pending');
  const historyQueue = accountDeletionRequests.filter((r) => r.status !== 'pending').slice(0, 10);

  const handleNextCustomerStep = () => {
    setFormError('');
    if (!targetAccount) {
      setFormError('Rekening tidak ditemukan.');
      return;
    }
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!qUnderstandLoss || !qNoPending || !qAgreeAdmin) {
        setFormError('Harap jawab "Ya / Setuju" pada ketiga pertanyaan konfirmasi sebelum melanjutkan.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (reasonDetail.trim().length < 5) {
        setFormError('Tuliskan alasan penghapusan akun Anda minimal 5 karakter agar dapat ditinjau Admin.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      if (confirmKeyword.trim().toUpperCase() !== 'HAPUS') {
        setFormError('Ketik kata "HAPUS" dengan tepat untuk mengirim pengajuan ke Admin.');
        return;
      }
      const res = submitAccountDeletionRequest({
        accountId: targetAccount.id,
        reasonCategory,
        reasonDetail: reasonDetail.trim(),
        confirmationAnswers: {
          understandPermanentLoss: qUnderstandLoss,
          noPendingObligations: qNoPending,
          agreeAdminReview: qAgreeAdmin,
        },
      });
      if (!res.success) {
        setFormError(res.message);
        return;
      }
      setStatusMessage(res.message);
      setConfirmKeyword('');
    }
  };

  const handleCancelCustomerPending = () => {
    if (!pendingRequestForCustomer) return;
    const res = cancelAccountDeletionRequest(pendingRequestForCustomer.id);
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    setStatusMessage(res.message);
  };

  const handleAdminQuickDelete = () => {
    setFormError('');
    if (!targetAccount) {
      setFormError('Pilih rekening target terlebih dahulu.');
      return;
    }
    if (confirmKeyword.trim().toUpperCase() !== 'HAPUS') {
      setFormError('Ketik kata "HAPUS" untuk mengeksekusi penghapusan cepat Admin.');
      return;
    }
    const res = adminDeleteAccount(targetAccount.id, { logoutIfCurrent: false });
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    onDeleted?.(res.message);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 text-xs text-slate-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {mode === 'admin'
                  ? 'Kelola Persetujuan & Hapus Cepat Akun'
                  : pendingRequestForCustomer
                  ? 'Status Pengajuan Hapus Akun'
                  : 'Pengajuan Hapus Akun — 5 Konfirmasi'}
              </h3>
              <p className="text-[11px] text-amber-300">
                {mode === 'admin' ? (
                  <>
                    Antrean Menunggu Persetujuan:{' '}
                    <strong className="text-white tabular-nums">{pendingQueue.length} pengajuan</strong>
                  </>
                ) : pendingRequestForCustomer ? (
                  <>Menunggu Persetujuan Admin (Akun Tetap Aktif Dipakai)</>
                ) : (
                  <>
                    Tahap Aktif: <strong className="text-white tabular-nums">Konfirmasi {step} dari 5</strong>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================
            MODE ADMIN: TAB ANTREAN PERSETUJUAN & HAPUS CEPAT ADMIN
           ============================================================ */}
        {mode === 'admin' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAdminTab('queue');
                  setFormError('');
                  setStatusMessage('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs cursor-pointer transition whitespace-nowrap ${
                  adminTab === 'queue'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Antrean Persetujuan ({pendingQueue.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminTab('quick_delete');
                  setFormError('');
                  setStatusMessage('');
                }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs cursor-pointer transition whitespace-nowrap ${
                  adminTab === 'quick_delete'
                    ? 'bg-rose-600 text-white font-black'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Hapus Cepat Admin
              </button>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 font-bold text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {adminTab === 'queue' && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {pendingQueue.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-1">
                    <UserCheck className="w-7 h-7 text-emerald-400 mx-auto" />
                    <p className="font-bold text-white text-xs">Tidak ada antrean persetujuan hapus akun</p>
                    <p className="text-[11px] text-slate-400">
                      Semua permohonan nasabah sudah selesai diproses atau belum ada pengajuan baru.
                    </p>
                  </div>
                ) : (
                  pendingQueue.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-amber-500/50 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white text-sm">{req.accountName}</span>
                            <span className="text-[11px] font-mono text-amber-300 tabular-nums">
                              {req.accountNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                            Saldo: <strong className="text-emerald-300">{formatRupiah(req.balanceSnapshot)}</strong>
                            {' · '}Diajukan: {new Date(req.requestedAt).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-bold text-[10px]">
                          Menunggu Persetujuan
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <p className="text-slate-300">
                          <strong className="text-white">Kategori:</strong> {req.reasonCategory}
                        </p>
                        <p className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed">
                          <strong className="text-amber-300 block mb-0.5">Alasan Nasabah:</strong>
                          {req.reasonDetail}
                        </p>
                        <p className="text-emerald-300 text-[10px]">
                          ✓ Nasabah telah menjawab Ya pada 3 pertanyaan verifikasi dan mengetik HAPUS.
                        </p>
                      </div>

                      <input
                        type="text"
                        placeholder="Catatan Admin (opsional, dikirim jika ditolak)"
                        value={adminNotesById[req.id] || ''}
                        onChange={(e) =>
                          setAdminNotesById((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const res = rejectAccountDeletionRequest(req.id, adminNotesById[req.id]);
                            setStatusMessage(res.message);
                            onDeleted?.(res.message);
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold cursor-pointer flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5 text-amber-300" />
                          <span>Tolak Pengajuan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = approveAccountDeletionRequest(req.id, adminNotesById[req.id]);
                            setStatusMessage(res.message);
                            onDeleted?.(res.message);
                          }}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black cursor-pointer flex items-center gap-1.5 shadow-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Setujui &amp; Hapus Permanen</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {historyQueue.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold text-slate-400">Riwayat Keputusan Terbaru:</p>
                    {historyQueue.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-white">{h.accountName}</span>{' '}
                          <span className="text-slate-400 font-mono">({h.accountNumber})</span>
                          {h.adminNote && (
                            <span className="block text-[10px] text-slate-400 truncate">
                              Catatan: {h.adminNote}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${
                            h.status === 'approved'
                              ? 'bg-rose-500/20 text-rose-300'
                              : h.status === 'rejected'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {h.status === 'approved'
                            ? 'Disetujui Hapus'
                            : h.status === 'rejected'
                            ? 'Ditolak'
                            : 'Dibatalkan Nasabah'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminTab === 'quick_delete' && (
              <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-rose-500/40">
                <h4 className="font-bold text-rose-300 text-xs">
                  Hapus Cepat Admin (Eksekusi Langsung)
                </h4>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Pilih Rekening Target</label>
                  <select
                    value={targetAccountId}
                    onChange={(e) => setTargetAccountId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.fullName} • {acc.accountNumber} ({formatRupiah(acc.balance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">
                    Ketik kata <strong className="text-white">HAPUS</strong> untuk konfirmasi cepat
                  </label>
                  <input
                    type="text"
                    placeholder='Ketik "HAPUS"'
                    value={confirmKeyword}
                    onChange={(e) => setConfirmKeyword(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-rose-500/60 text-rose-200 font-black uppercase tracking-wider text-center text-sm"
                  />
                </div>
                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 font-bold text-[11px]">
                    {formError}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleAdminQuickDelete}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Akun Sekarang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            MODE NASABAH: STATUS MENUNGGU PERSETUJUAN ADMIN (+ BATALKAN)
           ============================================================ */}
        {mode === 'customer' && pendingRequestForCustomer && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-amber-950/35 border border-amber-400/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-amber-200 text-sm">
                    Menunggu Persetujuan Admin
                  </h4>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    Ke-5 konfirmasi hapus akun untuk rekening{' '}
                    <strong className="text-white">{pendingRequestForCustomer.accountName}</strong> (
                    <span className="font-mono text-amber-300">{pendingRequestForCustomer.accountNumber}</span>) telah diterima.
                    Selama menunggu peninjauan Admin, <strong>akun Anda tetap dapat digunakan secara normal</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-[11px]">
                <p>
                  <span className="text-slate-400">Waktu Pengajuan:</span>{' '}
                  <strong className="text-white tabular-nums">
                    {new Date(pendingRequestForCustomer.requestedAt).toLocaleString('id-ID')}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-400">Kategori Alasan:</span>{' '}
                  <strong className="text-white">{pendingRequestForCustomer.reasonCategory}</strong>
                </p>
                <p>
                  <span className="text-slate-400">Alasan Tertulis:</span>{' '}
                  <span className="text-slate-200">{pendingRequestForCustomer.reasonDetail}</span>
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 font-bold text-xs">
                {statusMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCancelCustomerPending}
                className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 text-emerald-200 font-black cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Batalkan Pengajuan Hapus Akun</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ============================================================
            MODE NASABAH: 5 KONFIRMASI (PENJELASAN, PERTANYAAN, ALASAN, KONFIRMASI ADMIN, KETIK HAPUS)
           ============================================================ */}
        {mode === 'customer' && !pendingRequestForCustomer && (
          <>
            {latestRejectedForCustomer && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 text-[11px] text-amber-200">
                <strong>Catatan Pengajuan Sebelumnya (Ditolak Admin):</strong>{' '}
                {latestRejectedForCustomer.adminNote || 'Ditolak oleh Admin.'}
              </div>
            )}

            {/* 5-Step Progress Indicator */}
            <div className="grid grid-cols-5 gap-1.5">
              {STEP_LABELS.map((s) => (
                <div
                  key={s.num}
                  className={`py-2 px-1.5 rounded-xl border text-center font-bold text-[10px] transition-all ${
                    step === s.num
                      ? 'bg-rose-500/20 border-rose-400 text-rose-200 shadow'
                      : step > s.num
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="block tabular-nums">
                    {step > s.num ? `✓ ${s.num}` : `${s.num}.`}
                  </span>
                  <span className="block truncate">{s.title}</span>
                </div>
              ))}
            </div>

            {/* Konfirmasi 1: Penjelasan */}
            {step === 1 && (
              <div className="space-y-3 bg-slate-950/85 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Konfirmasi 1: Penjelasan Lengkap Penghapusan Akun</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 leading-relaxed text-slate-300">
                  <p>
                    Rekening yang akan diajukan untuk dihapus:{' '}
                    <strong className="text-white">{targetAccount?.fullName}</strong> (
                    <span className="font-mono text-amber-300">{targetAccount?.accountNumber}</span>) · Saldo:{' '}
                    <strong className="text-emerald-300 tabular-nums">
                      {targetAccount ? formatRupiah(targetAccount.balance) : 'Rp 0'}
                    </strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>
                      Apabila disetujui Admin, seluruh saldo tunai, Tabungan Emas 24K, Celengan Impian, Deposito,
                      aset bisnis, bursa trading, kartu, serta riwayat transaksi akan dihapus permanen.
                    </li>
                    <li>
                      Proses ini <strong>tidak langsung menghapus akun secara seketika</strong>, melainkan wajib melewati
                      5 tahap konfirmasi lalu masuk ke antrean <strong>Persetujuan Admin</strong>.
                    </li>
                    <li>
                      Selama menunggu keputusan Admin, akun Anda tetap dapat digunakan seperti biasa dan pengajuan
                      masih bisa Anda batalkan kapan saja.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Konfirmasi 2: Pertanyaan */}
            {step === 2 && (
              <div className="space-y-3 bg-slate-950/85 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400" />
                  <span>Konfirmasi 2: Pertanyaan Verifikasi Kesiapan</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Jawab &ldquo;Ya / Setuju&rdquo; pada seluruh pertanyaan di bawah ini untuk melanjutkan:
                </p>
                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qUnderstandLoss}
                      onChange={(e) => setQUnderstandLoss(e.target.checked)}
                      className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-[11px] text-slate-200 leading-snug">
                      <strong>Pertanyaan 1:</strong> Apakah Anda yakin dan memahami bahwa seluruh saldo serta data akun
                      akan hilang permanen setelah disetujui oleh Admin?
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qNoPending}
                      onChange={(e) => setQNoPending(e.target.checked)}
                      className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-[11px] text-slate-200 leading-snug">
                      <strong>Pertanyaan 2:</strong> Apakah Anda sudah memastikan tidak ada saldo atau transaksi penting
                      yang perlu dipindahkan terlebih dahulu?
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qAgreeAdmin}
                      onChange={(e) => setQAgreeAdmin(e.target.checked)}
                      className="mt-0.5 accent-rose-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-[11px] text-slate-200 leading-snug">
                      <strong>Pertanyaan 3:</strong> Apakah Anda bersedia menunggu persetujuan Admin (dan memahami akun tetap
                      aktif serta dapat dibatalkan sebelum disetujui)?
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Konfirmasi 3: Alasan */}
            {step === 3 && (
              <div className="space-y-3 bg-slate-950/85 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Konfirmasi 3: Alasan Penghapusan Akun</span>
                </h4>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Pilih Kategori Alasan</label>
                  <select
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  >
                    <option value="Rekening Ganda / Tidak Terpakai">Rekening Ganda / Tidak Terpakai</option>
                    <option value="Ganti Perangkat / Buat Kartu Baru">Ganti Perangkat / Buat Kartu Baru</option>
                    <option value="Keamanan & Privasi Data">Keamanan &amp; Privasi Data</option>
                    <option value="Ingin Berhenti Menggunakan Layanan">Ingin Berhenti Menggunakan Layanan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">
                    Jelaskan Alasan Lengkap Anda (Wajib untuk Tinjauan Admin)
                  </label>
                  <textarea
                    rows={3}
                    value={reasonDetail}
                    onChange={(e) => setReasonDetail(e.target.value)}
                    placeholder="Contoh: Saya sudah memiliki rekening utama lain dan ingin menutup rekening cadangan ini..."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs resize-none"
                  />
                </div>
              </div>
            )}

            {/* Konfirmasi 4: Konfirmasi Admin */}
            {step === 4 && (
              <div className="space-y-3 bg-slate-950/85 p-4 rounded-2xl border border-amber-500/40">
                <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span>Konfirmasi 4: Ringkasan &amp; Persetujuan Antrean Admin</span>
                </h4>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
                  <p>
                    <span className="text-slate-400">Nasabah:</span>{' '}
                    <strong className="text-white">{targetAccount?.fullName}</strong> (
                    <span className="font-mono text-amber-300">{targetAccount?.accountNumber}</span>)
                  </p>
                  <p>
                    <span className="text-slate-400">Kategori:</span>{' '}
                    <strong className="text-white">{reasonCategory}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Alasan Tertulis:</span>{' '}
                    <span className="text-slate-200">{reasonDetail}</span>
                  </p>
                  <p className="text-emerald-300">✓ Ketiga pertanyaan verifikasi telah disetujui.</p>
                </div>
                <p className="text-[11px] text-amber-200 leading-relaxed">
                  Setelah Anda menyelesaikan langkah ke-5, permohonan akan berstatus{' '}
                  <strong>Menunggu Persetujuan Admin</strong>. Selama belum disetujui Admin, akun Anda tetap aktif normal
                  dan dapat dibatalkan kapan saja.
                </p>
              </div>
            )}

            {/* Konfirmasi 5: Ketik HAPUS */}
            {step === 5 && (
              <div className="space-y-3 bg-rose-950/30 p-4 rounded-2xl border border-rose-500/50">
                <h4 className="font-bold text-rose-300 text-xs flex items-center gap-1.5 border-b border-rose-500/30 pb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Konfirmasi 5: Ketik &ldquo;HAPUS&rdquo; &amp; Kirim ke Persetujuan Admin</span>
                </h4>
                <p className="text-rose-200/90 text-[11px] leading-relaxed">
                  Ketik kata <strong className="text-white">HAPUS</strong> untuk mengirim permohonan penghapusan rekening{' '}
                  <strong className="text-white">{targetAccount?.accountNumber}</strong> ke antrean{' '}
                  <strong className="text-amber-300">Persetujuan Admin</strong>.
                </p>
                <input
                  type="text"
                  placeholder='Ketik "HAPUS"'
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-900 border border-rose-500/60 text-rose-200 font-black uppercase tracking-wider text-center text-sm"
                />
              </div>
            )}

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 font-bold text-[11px]">
                {formError}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormError('');
                    setStep((s) => s - 1);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Kembali
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
              )}

              <button
                type="button"
                onClick={handleNextCustomerStep}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                {step === 5 ? <Clock className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                <span>{step === 5 ? 'Kirim & Tunggu Persetujuan Admin' : 'Lanjut'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const AccountDeletion10StepModal = AccountDeletion5StepModal;
