import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  FileText,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

interface AccountDeletion10StepModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'admin' | 'customer';
  initialTargetAccountId?: string;
  onDeleted?: (message: string) => void;
}

export const AccountDeletion10StepModal: React.FC<AccountDeletion10StepModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTargetAccountId,
  onDeleted,
}) => {
  const { accounts, currentAccount, adminDeleteAccount } = useBank();

  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [step, setStep] = useState<number>(1); // 3-step interactive wizard
  const [reasonCategory, setReasonCategory] = useState<string>('Rekening Ganda / Tidak Terpakai');
  const [pinInput, setPinInput] = useState<string>('');
  const [confirmKeyword, setConfirmKeyword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const defaultId =
      mode === 'customer'
        ? currentAccount?.id || accounts[0]?.id || ''
        : initialTargetAccountId || accounts[0]?.id || '';
    setTargetAccountId(defaultId);
    setStep(1);
    setReasonCategory('Rekening Ganda / Tidak Terpakai');
    setPinInput('');
    setConfirmKeyword('');
    setFormError('');
  }, [isOpen, mode, initialTargetAccountId, currentAccount?.id]);

  if (!isOpen) return null;

  const targetAccount =
    accounts.find((a) => a.id === targetAccountId) ||
    (mode === 'customer' ? currentAccount : accounts[0]) ||
    null;

  const handleNextStep = () => {
    setFormError('');
    if (step === 1) {
      if (!targetAccount) {
        setFormError('Pilih rekening target terlebih dahulu.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!pinInput.trim() || pinInput.trim().length !== 6) {
        setFormError('Masukkan 6 digit PIN akun atau PIN Admin (159357) dengan benar.');
        return;
      }
      const cleanPin = pinInput.trim();
      const validAdminOverride = mode === 'admin' && cleanPin === '159357';
      if (targetAccount?.pin && cleanPin !== targetAccount.pin && !validAdminOverride) {
        setFormError('6 digit PIN salah! (Gunakan 159357 untuk override Admin).');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (confirmKeyword.trim().toUpperCase() !== 'HAPUS') {
        setFormError('Ketik kata "HAPUS" dengan huruf kapital untuk konfirmasi akhir.');
        return;
      }

      const res = adminDeleteAccount(targetAccount!.id, {
        logoutIfCurrent: mode === 'customer',
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      onDeleted?.(res.message);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Penghapusan Akun Instan — 3 Langkah Konfirmasi
              </h3>
              <p className="text-[11px] text-amber-300">
                Langkah Aktif: <strong className="text-white">Langkah {step} dari 3</strong>
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

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`py-2 px-3 rounded-xl border text-center font-bold text-[11px] transition-all ${
                step === s
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 shadow'
                  : step > s
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
            >
              {step > s ? `✓ Step ${s} Selesai` : `Step ${s}`}
            </div>
          ))}
        </div>

        {/* Step 1: Target & Alasan */}
        {step === 1 && (
          <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Langkah 1: Pilih Rekening &amp; Alasan Penghapusan</span>
            </h4>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Pilih Rekening Target</label>
              {mode === 'admin' ? (
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
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold">
                  {targetAccount?.fullName} • {targetAccount?.accountNumber}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Alasan Penghapusan</label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value="Rekening Ganda / Tidak Terpakai">Rekening Ganda / Tidak Terpakai</option>
                <option value="Ganti Perangkat / Buat Kartu Baru">Ganti Perangkat / Buat Kartu Baru</option>
                <option value="Keamanan & Privasi Data">Keamanan &amp; Privasi Data</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: PIN Otorisasi */}
        {step === 2 && (
          <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Langkah 2: Masukkan 6 Digit PIN / Otorisasi Admin</span>
            </h4>
            <p className="text-slate-400 text-[11px]">
              Masukkan 6 digit PIN kartu nasabah tersebut (atau PIN Admin <strong className="text-amber-300 font-mono">159357</strong> untuk bypass darurat).
            </p>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              placeholder="••••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tracking-[0.4em] text-center text-lg"
            />
          </div>
        )}

        {/* Step 3: Konfirmasi Akhir Kata HAPUS */}
        {step === 3 && (
          <div className="space-y-3 bg-rose-950/30 p-4 rounded-2xl border border-rose-500/50">
            <h4 className="font-bold text-rose-300 text-xs flex items-center gap-1.5 border-b border-rose-500/30 pb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Langkah 3: Konfirmasi Akhir &amp; Ketik "HAPUS"</span>
            </h4>
            <p className="text-rose-200/90 text-[11px] leading-relaxed">
              Tindakan ini permanen. Seluruh saldo ({targetAccount ? formatRupiah(targetAccount.balance) : 'Rp 0'}) dan riwayat akun akan dimusnahkan. Ketik kata <strong className="text-white">HAPUS</strong> untuk melanjutkan.
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
            ⚠️ {formError}
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
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>{step === 3 ? 'Hapus Akun Permanen' : 'Lanjut'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
