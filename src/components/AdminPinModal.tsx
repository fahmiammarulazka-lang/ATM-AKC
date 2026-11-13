/**
 * Bank Nusantara Admin Authorization PIN / Code Modal
 * Used for:
 * 1. Entering the Admin Panel
 * 2. Authorizing features configured with PIN Admin
 * 3. Switching cards ("Ganti Kartu ke Kartu Lain Tanpa Membuat Kartu Baru — Cukup Masukkan Kode Admin, Bukan Kode Kartu")
 */
import React, { useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { playAtmSound } from '../utils/bankUtils';

interface AdminPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
  description?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  title = 'Otorisasi Kode Admin',
  subtitle = 'RESTRICTED ACCESS • KODE ADMIN',
  description = 'Masukkan 6 digit Kode Admin resmi Bank Nusantara (Bukan Kode/PIN Kartu) untuk melanjutkan tindakan ini.',
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    playAtmSound('beep');
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next.length === 6) {
        verifyAdminPin(next);
      }
    }
  };

  const handleClear = () => {
    playAtmSound('beep');
    setPinInput('');
    setErrorMsg('');
  };

  const verifyAdminPin = (enteredPin: string) => {
    // Secret Administrator Code: 159357 (Strictly enforced, not revealed in UI)
    if (enteredPin === '159357') {
      playAtmSound('success');
      setErrorMsg('');
      setPinInput('');
      onSuccess();
    } else {
      playAtmSound('alert');
      setErrorMsg('Kode Admin SALAH! Pastikan Anda memasukkan Kode Admin (bukan kode/PIN kartu).');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-rose-500/50 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[10px] text-rose-300 font-mono tracking-wider uppercase">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setPinInput('');
              setErrorMsg('');
              onCancel();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info text */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
          <p className="text-slate-300 text-[11px] leading-relaxed">{description}</p>
        </div>

        {/* PIN Input Dots */}
        <div className="text-center space-y-2 py-1">
          <label className="text-[11px] text-amber-300 font-bold block">
            Masukkan 6 Digit Kode Admin (Bukan Kode Kartu):
          </label>
          <div className="flex justify-center items-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={`w-9 h-11 rounded-xl border-2 flex items-center justify-center font-mono font-bold text-xl transition-all ${
                  idx < pinInput.length
                    ? 'border-rose-400 bg-rose-400/20 text-rose-300 scale-105'
                    : 'border-slate-700 bg-slate-950 text-slate-600'
                }`}
              >
                {idx < pinInput.length ? '●' : ''}
              </div>
            ))}
          </div>

          {errorMsg && (
            <p className="text-[11px] text-rose-400 bg-rose-950/80 p-2 rounded-lg border border-rose-600/40 font-semibold">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Keypad */}
        <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
          <div className="grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-mono font-bold text-base rounded-xl transition-all active:scale-95 cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-10 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 font-bold text-xs rounded-xl cursor-pointer"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-10 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-mono font-bold text-base rounded-xl cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => {
                setPinInput('');
                setErrorMsg('');
                onCancel();
              }}
              className="h-10 bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
