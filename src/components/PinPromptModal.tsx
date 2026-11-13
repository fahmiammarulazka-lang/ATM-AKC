/**
 * Reusable 6-Digit PIN Security Prompt Modal
 * - Untuk PIN Kartu Nasabah: PIN TIDAK dikasih tahu otomatis. Jika lupa, tersedia tombol "Lupa PIN?" yang mengirim pengajuan ke Panel Admin.
 * - Jika Admin sudah menyetujui pengajuan Lupa PIN, maka PIN baru diberitahukan di layar modal ini.
 */
import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, AlertCircle, X, Delete, CheckCircle2, HelpCircle, Clock, Eye } from 'lucide-react';
import { useBank } from '../context/BankContext';

interface PinPromptModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  targetAccountId?: string;
  targetAccountName: string;
  cardNumberSnippet?: string;
  expectedPin: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  title,
  description,
  targetAccountId,
  targetAccountName,
  cardNumberSnippet,
  expectedPin,
  onSuccess,
  onCancel,
}) => {
  const { currentAccount, pinResetRequests, requestPinReset } = useBank();
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [forgotReason, setForgotReason] = useState<string>('');
  const [showForgotForm, setShowForgotForm] = useState<boolean>(false);
  const [forgotFeedback, setForgotFeedback] = useState<string>('');

  const isAdminPinPrompt = expectedPin === '159357';
  const resolvedAccountId = targetAccountId || currentAccount?.id;

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setShowForgotForm(false);
      setForgotFeedback('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activePinRequest = resolvedAccountId
    ? pinResetRequests.find(
        (r) => r.accountId === resolvedAccountId && (r.status === 'pending' || r.status === 'approved')
      )
    : undefined;

  const handleDigitPress = (digit: string) => {
    setErrorMsg('');
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPinInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setPinInput('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.length !== 6) {
      setErrorMsg('Masukkan genap 6 digit angka PIN.');
      return;
    }
    if (pinInput !== expectedPin) {
      setErrorMsg(
        isAdminPinPrompt
          ? 'PIN Otorisasi Admin tidak sesuai!'
          : 'Kode PIN Kartu salah! Pastikan Anda memasukkan 6 digit PIN Kartu tersebut. Jika lupa PIN, klik tombol "Lupa PIN Kartu?" di bawah untuk ditinjau Admin.'
      );
      setPinInput('');
      return;
    }
    onSuccess();
  };

  const handleSendForgotRequest = () => {
    if (!resolvedAccountId) return;
    const res = requestPinReset(
      resolvedAccountId,
      forgotReason.trim() || `Nasabah lupa PIN Kartu (${targetAccountName}) saat ingin login / otorisasi kartu`
    );
    setForgotFeedback(res.message);
    setShowForgotForm(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/50 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Top glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                {isAdminPinPrompt ? 'Otorisasi PIN Admin' : 'Verifikasi PIN Kartu Rahasia'}
              </span>
              <h3 className="font-bold text-base text-white leading-tight">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">{description}</p>

        {/* Account Info Pill */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-3 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Target Otorisasi:</span>
            <span className="font-bold text-white">{targetAccountName}</span>
          </div>
          {cardNumberSnippet && (
            <span className="font-mono text-amber-300 text-[11px] bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              •••• {cardNumberSnippet.slice(-4)}
            </span>
          )}
        </div>

        {/* Pin Dots Display */}
        <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl py-3.5 px-4 mb-3 flex items-center justify-center gap-3">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const filled = idx < pinInput.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  filled
                    ? 'bg-amber-400 scale-110 shadow-[0_0_10px_#fbbf24]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {forgotFeedback && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px]">
            {forgotFeedback}
          </div>
        )}

        {/* Status Lupa PIN / Approved oleh Admin */}
        {!isAdminPinPrompt && activePinRequest?.status === 'pending' && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px] flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span>
              Permintaan <strong>Lupa PIN</strong> sedang ditinjau Admin di Panel Admin (Tab Lupa PIN ATM).
            </span>
          </div>
        )}

        {!isAdminPinPrompt && activePinRequest?.status === 'approved' && activePinRequest.revealedPin && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>PIN Disetujui Admin:</span>
              <strong className="font-mono text-sm text-white tracking-widest bg-slate-950 px-2 py-0.5 rounded">
                {activePinRequest.revealedPin}
              </strong>
            </div>
            <button
              type="button"
              onClick={() => setPinInput(activePinRequest.revealedPin!)}
              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
            >
              Isi PIN
            </button>
          </div>
        )}

        {/* Lupa PIN Trigger Button (Hanya untuk PIN Kartu Nasabah, PIN tidak diberitahu otomatis) */}
        {!isAdminPinPrompt && !activePinRequest && !showForgotForm && (
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-[10px] text-slate-400">PIN kartu dirahasiakan demi keamanan.</span>
            <button
              type="button"
              onClick={() => setShowForgotForm(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Lupa PIN Kartu?</span>
            </button>
          </div>
        )}

        {showForgotForm && (
          <div className="mb-3 p-3 rounded-xl bg-slate-950 border border-amber-500/40 space-y-2 text-xs">
            <span className="font-bold text-amber-300 block">Ajukan Tinjauan Lupa PIN ke Admin:</span>
            <input
              type="text"
              value={forgotReason}
              onChange={(e) => setForgotReason(e.target.value)}
              placeholder="Alasan lupa PIN (opsional)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSendForgotRequest}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer"
              >
                Kirim ke Admin
              </button>
              <button
                type="button"
                onClick={() => setShowForgotForm(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[11px] cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Interactive Keypad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigitPress(d)}
              className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base border border-slate-700 transition-all cursor-pointer shadow"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 font-bold text-xs border border-rose-800/50 transition-all cursor-pointer"
          >
            HAPUS
          </button>
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-mono font-bold text-base border border-slate-700 transition-all cursor-pointer shadow"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="py-2.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 font-bold text-xs border border-amber-800/50 transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

        {/* Submit / Cancel Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={pinInput.length !== 6}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Konfirmasi PIN</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Batal
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Sistem Keamanan Enkripsi PIN 6-Digit Bank Nusantara</span>
        </div>
      </div>
    </div>
  );
};
