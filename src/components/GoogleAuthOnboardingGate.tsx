/**
 * Bank Nusantara — Initial Google Sign-In & Card Registration / Old Card Login Gate
 * Sesuai permintaan user:
 * 1. "Diawal awal disuruh masuk menggunakan akun Google"
 * 2. "Setelah menggunakan akun Google itu disuruh daftar ya, mulai daftar."
 * 3. "Jika kita lupa, untuk ganti contohnya aku kan mau ganti ke kartu ku yang lama, itu tuh pakai pin kartu bukan pakai pin admin, tapi pakai pin kartu kita yang lama.
 *    Contohnya aku kan punya kartu baru dan juga kartu lama. Nah, kartu barunya aku mau aku login. Nah, aku mau login ke kartu lama. Nah, itu juga kita membutuhkan kita harus tahu pin kartu lama kita."
 */
import React, { useState } from 'react';
import {
  CreditCard,
  ShieldCheck,
  UserCheck,
  KeyRound,
  LogIn,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
  ArrowRight,
  LogOut,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CardTier, BankAccount } from '../types/bank';
import { CARD_TIER_CONFIGS, formatRupiah } from '../utils/bankUtils';
import { PinPromptModal } from './PinPromptModal';
import { VerifiedBadge } from './VerifiedBadge';
import { AllowNotificationFooterButton } from './GlobalChatAndNotificationLayer';
import { GoogleMapsAddressPicker } from './GoogleMapsAddressPicker';

interface GoogleAuthOnboardingGateProps {
  onOpenAdminPanel?: () => void;
}

const PRESET_GOOGLE_ACCOUNTS = [
  {
    email: 'fahmiammarulazka@gmail.com',
    name: 'Fahmi Ammarul Azka',
    badge: 'Akun Google Utama Anda',
  },
  {
    email: 'raden.satrio.nusantara@gmail.com',
    name: 'Raden Satrio',
    badge: 'Akun Google Nasabah',
  },
  {
    email: 'putri.maharani.vip@gmail.com',
    name: 'Putri Maharani Ningrum',
    badge: 'Akun Google Prioritas',
  },
];

export const GoogleAuthOnboardingGate: React.FC<GoogleAuthOnboardingGateProps> = ({
  onOpenAdminPanel,
}) => {
  const {
    googleUser,
    loginWithGoogle,
    loginWithFirebaseGoogle,
    logoutGoogle,
    accounts,
    registerCard,
    loginToCardWithPin,
  } = useBank();

  // Stage 1: Google Login State
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState<boolean>(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState<string>('');
  const [customGoogleName, setCustomGoogleName] = useState<string>('');
  const [googleError, setGoogleError] = useState<string>('');
  const [firebasePopupLoading, setFirebasePopupLoading] = useState<boolean>(false);

  // Stage 2: Post-Google Login Mode ('register' = Mulai Daftar Kartu Baru, 'login_old' = Login ke Kartu Lama Pakai PIN Kartu Lama)
  const [onboardingTab, setOnboardingTab] = useState<'register' | 'login_old'>('register');

  // Registration Form State
  const [fullName, setFullName] = useState<string>(googleUser?.name || '');
  const [nik, setNik] = useState<string>('3171042010980001');
  const [phone, setPhone] = useState<string>('081298765432');
  const [address, setAddress] = useState<string>('Jl. Jend. Sudirman Kav. 21, Jakarta Pusat');
  const [selectedTier, setSelectedTier] = useState<CardTier>('regular');
  const [initialDeposit, setInitialDeposit] = useState<number>(500_000);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [regError, setRegError] = useState<string>('');

  // Old Card Login with Old Card PIN State
  const [selectedOldCard, setSelectedOldCard] = useState<BankAccount | null>(null);
  const [oldCardSearch, setOldCardSearch] = useState<string>('');

  // Handle real Firebase Google Popup Sign-In
  const handleFirebaseGooglePopup = async () => {
    setGoogleError('');
    setFirebasePopupLoading(true);
    try {
      const res = await loginWithFirebaseGoogle();
      if (!res.success) {
        setGoogleError(res.message);
      }
    } finally {
      setFirebasePopupLoading(false);
    }
  };

  // Handle selecting a preset Google account
  const handleSelectGoogleAccount = (email: string, name: string) => {
    setFullName(name);
    loginWithGoogle(email, name);
  };

  // Handle custom Google account login
  const handleCustomGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError('');
    const cleanEmail = customGoogleEmail.trim();
    const cleanName = customGoogleName.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setGoogleError('Masukkan alamat email Akun Google yang valid (contoh: nama@gmail.com).');
      return;
    }
    if (!cleanName || cleanName.length < 2) {
      setGoogleError('Masukkan nama lengkap Akun Google Anda.');
      return;
    }
    setFullName(cleanName);
    loginWithGoogle(cleanEmail, cleanName);
  };

  // Handle New Card Registration after Google Login
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const finalName = (fullName || googleUser?.name || '').trim();
    if (finalName.length < 3) {
      setRegError('Nama lengkap sesuai identitas minimal 3 karakter.');
      return;
    }
    if (!/^\d{16}$/.test(nik.trim())) {
      setRegError('Nomor Induk Kependudukan (NIK KTP) harus terdiri dari tepat 16 digit angka.');
      return;
    }
    if (phone.trim().length < 10) {
      setRegError('Nomor HP aktif minimal 10 digit angka.');
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setRegError('PIN Kartu Baru wajib terdiri dari tepat 6 digit angka.');
      return;
    }
    if (newPin !== confirmPin) {
      setRegError('Konfirmasi 6 digit PIN Kartu tidak sama!');
      return;
    }

    const res = registerCard({
      fullName: finalName,
      nik: nik.trim(),
      phone: phone.trim(),
      email: googleUser?.email || 'nasabah@gmail.com',
      address: address.trim() || 'Jakarta, Indonesia',
      pin: newPin,
      cardTier: selectedTier,
      initialDeposit: selectedTier === 'admin' ? 999_999_999_999_999 : initialDeposit,
    });

    if (!res.success) {
      setRegError(res.message);
    }
  };

  // ============================================================================
  // STAGE 1: MASUK MENGGUNAKAN AKUN GOOGLE (AWAL-AWAL BUKA WEBSITE)
  // ============================================================================
  if (!googleUser) {
    return (
      <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
          {/* Bank Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/25">
              <CreditCard className="w-7 h-7 text-slate-950" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-mono uppercase tracking-widest">
              <span>Langkah 1 dari 2 • Otentikasi Akun Google</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Masuk Menggunakan Akun Google
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Selamat datang di <strong>PT Bank Nusantara (Persero) Tbk</strong>. Silakan masuk menggunakan <strong>Akun Google</strong> Anda terlebih dahulu untuk melanjutkan ke pendaftaran kartu baru atau masuk ke kartu lama Anda.
            </p>
          </div>

          {/* Official Google Logo & Account Chooser */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                {/* Google "G" SVG Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span className="text-xs font-bold text-white">Pilih Akun Google untuk Masuk</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">Google OAuth 2.0</span>
            </div>

            <button
              type="button"
              disabled={firebasePopupLoading}
              onClick={handleFirebaseGooglePopup}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>
                {firebasePopupLoading
                  ? 'Membuka Jendela Google...'
                  : 'Masuk dengan Google (Sinkron Cloud Firebase)'}
              </span>
            </button>

            {googleError && !showCustomGoogleForm && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px]">
                {googleError}
              </div>
            )}

            <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
              <div className="flex-1 h-px bg-slate-800" />
              <span>atau pilih akun cepat</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="space-y-2">
              {PRESET_GOOGLE_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(acc.email, acc.name)}
                  className="w-full p-3 rounded-xl bg-slate-900 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/60 transition-all flex items-center justify-between gap-3 text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow">
                      {acc.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white text-xs truncate">{acc.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-semibold shrink-0">
                          {acc.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono truncate block">
                        {acc.email}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              ))}
            </div>

            {/* Option to enter another custom Google Account */}
            {!showCustomGoogleForm ? (
              <button
                type="button"
                onClick={() => setShowCustomGoogleForm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                <span>Gunakan Akun Google Lainnya (Ketik Email Sendiri)</span>
              </button>
            ) : (
              <form onSubmit={handleCustomGoogleSubmit} className="pt-2 border-t border-slate-800 space-y-2.5 text-xs">
                <span className="font-bold text-amber-300 block">Masukkan Akun Google Anda:</span>
                {googleError && (
                  <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px]">
                    {googleError}
                  </div>
                )}
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Nama Lengkap Google:</label>
                  <input
                    type="text"
                    required
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[11px] block mb-1">Alamat Email Google (@gmail.com):</label>
                  <input
                    type="email"
                    required
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="nama.anda@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Masuk dengan Google ➔
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleForm(false)}
                    className="px-3 py-2.5 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-2.5 text-[11px] text-slate-500 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Terdaftar & Diawasi OJK</span>
              </span>
              <span>Setelah masuk Google ➔ Mulai Daftar Kartu</span>
            </div>

            {onOpenAdminPanel && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                <AllowNotificationFooterButton />
                <button
                  type="button"
                  onClick={onOpenAdminPanel}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-semibold flex items-center gap-1.5 cursor-pointer text-[11px]"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Panel Admin (Butuh PIN)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STAGE 2: SETELAH MASUK AKUN GOOGLE -> DISURUH MULAI DAFTAR KARTU BARU
  //          ATAU LOGIN KE KARTU LAMA MENGGUNAKAN PIN KARTU LAMA (BUKAN PIN ADMIN)
  // ============================================================================
  const filteredOldCards = accounts.filter(
    (a) =>
      a.fullName.toLowerCase().includes(oldCardSearch.toLowerCase()) ||
      a.accountNumber.includes(oldCardSearch) ||
      a.cardNumber.includes(oldCardSearch)
  );

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="max-w-3xl w-full bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 relative z-10 my-6">
        {/* Top Signed-in Google Account Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
              {googleUser.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  ✓ Terhubung dengan Google
                </span>
                <span className="text-xs font-bold text-white">{googleUser.name}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block">{googleUser.email}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutGoogle}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Ganti Akun Google</span>
          </button>
        </div>

        {/* Step Title & Mode Switcher */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              LANGKAH 2 SETELAH LOGIN GOOGLE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {onboardingTab === 'register'
              ? 'Mulai Daftar Kartu ATM Baru Anda'
              : 'Login ke Kartu Lama Menggunakan PIN Kartu Lama'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {onboardingTab === 'register'
              ? 'Setelah berhasil masuk menggunakan Akun Google, silakan mulai daftar kartu ATM Bank Nusantara Anda di bawah ini. Jika Anda sudah punya kartu lama dan ingin masuk ke kartu lama Anda, klik tab "Login ke Kartu Lama (Pakai PIN Kartu Lama)".'
              : 'Pilih kartu lama Anda di bawah ini lalu masukkan 6 digit PIN Kartu Lama Anda (bukan PIN Admin!). Jika Anda lupa PIN kartu lama Anda, tersedia tombol "Lupa PIN Kartu?" di layar PIN untuk ditinjau Admin.'}
          </p>

          {/* Two Mode Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setOnboardingTab('register')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                onboardingTab === 'register'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <UserCheck className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-xs sm:text-sm block font-bold">1. Mulai Daftar Kartu Baru</span>
                <span className="text-[10px] opacity-80 block">
                  Buka rekening & buat PIN 6 digit baru
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setOnboardingTab('login_old')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                onboardingTab === 'login_old'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 font-black shadow-lg shadow-blue-600/25'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <KeyRound className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <span className="text-xs sm:text-sm block font-bold">
                  2. Login ke Kartu Lama (Pakai PIN Kartu)
                </span>
                <span className="text-[10px] opacity-80 block">
                  Masuk ke kartu lama dengan 6 digit PIN kartu lama Anda
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB A: MULAI DAFTAR KARTU BARU
           ===================================================================== */}
        {onboardingTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs border-t border-slate-800 pt-5">
            {regError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nama Lengkap Sesuai KTP:
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nomor Identitas NIK KTP (16 Digit):
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                  placeholder="3171042010980001"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nomor HP Aktif (WhatsApp / SMS OTP):
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="081298765432"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
                />
              </div>
            </div>

            {/* Ambil Alamat Langsung dari Google Maps (Tanpa Perlu Menulis Manual) */}
            <GoogleMapsAddressPicker
              value={address}
              onChange={(newAddr) => setAddress(newAddr)}
              required={true}
              label="Alamat Tempat Tinggal (Ambil Langsung dari Google Maps Tanpa Menulis Manual):"
              placeholder="Pilih titik di Peta Google Maps di atas atau klik Ambil Lokasi GPS Saya Otomatis..."
            />

            {/* Pilih Jenis Kartu (5 Pilihan Kartu termasuk Kartu Admin ∞) */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1.5">
                Pilih Jenis Kartu ATM Bank Nusantara (5 Pilihan Kartu):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {Object.values(CARD_TIER_CONFIGS).map((cfg, idx) => {
                  const isSelected = selectedTier === cfg.tier;
                  const isAdminTier = cfg.tier === 'admin';
                  return (
                    <div
                      key={cfg.tier}
                      onClick={() => setSelectedTier(cfg.tier)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400'
                          : isAdminTier
                          ? 'border-fuchsia-500/50 bg-purple-950/30 hover:border-fuchsia-400'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono text-amber-300 block">
                          Kartu #{idx + 1}
                        </span>
                        <span className="font-bold text-white text-xs block mt-0.5">
                          {cfg.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                        Limit: {isAdminTier ? '∞ Unlimited' : formatRupiah(cfg.dailyWithdrawalLimit)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Setoran Awal & Buat PIN 6 Digit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Setoran Awal (Rp):
                </label>
                <input
                  type="number"
                  min={50000}
                  step={50000}
                  disabled={selectedTier === 'admin'}
                  value={selectedTier === 'admin' ? 999999999 : initialDeposit}
                  onChange={(e) => setInitialDeposit(parseInt(e.target.value, 10) || 50000)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Buat PIN Kartu Baru (6 Digit):
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••••• (6 Angka)"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-white font-mono text-center tracking-widest text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Ulangi PIN Kartu Baru (6 Digit):
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••••• (6 Angka)"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-3 text-white font-mono text-center tracking-widest text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Mulai Daftar & Buat Kartu Baru Sekarang ➔</span>
            </button>
          </form>
        )}

        {/* =====================================================================
            TAB B: LOGIN / GANTI KE KARTU LAMA (PAKAI PIN KARTU LAMA, BUKAN PIN ADMIN!)
           ===================================================================== */}
        {onboardingTab === 'login_old' && (
          <div className="space-y-4 text-xs border-t border-slate-800 pt-5">
            <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-500/40 text-blue-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">
                  Aturan Login ke Kartu Lama: Menggunakan 6 Digit PIN Kartu Lama Anda (Bukan PIN Admin!)
                </strong>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Pilih kartu lama Anda di bawah ini. Anda wajib memasukkan <strong>PIN Kartu Lama</strong> tersebut. Apabila Anda lupa PIN kartu lama Anda, klik tombol <strong>&quot;Lupa PIN Kartu?&quot;</strong> di jendela PIN agar ditinjau oleh Admin dan diberitahukan PIN-nya.
                </p>
              </div>
            </div>

            <input
              type="text"
              value={oldCardSearch}
              onChange={(e) => setOldCardSearch(e.target.value)}
              placeholder="Cari nama pemilik kartu lama atau 10 digit nomor rekening..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredOldCards.map((acc, idx) => {
                const isAdminCard = acc.cardTier === 'admin';
                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedOldCard(acc)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isAdminCard
                        ? 'bg-purple-950/40 border-fuchsia-500/50 hover:border-fuchsia-400'
                        : 'bg-slate-950 border-slate-800 hover:border-blue-500/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Kartu #{idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{acc.fullName}</span>
                        {acc.isVerified && <VerifiedBadge size="xs" />}
                      </div>
                      <span className="font-mono text-[11px] text-amber-300 block mt-0.5">
                        No. Rek: {acc.accountNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Jenis: {CARD_TIER_CONFIGS[acc.cardTier]?.nameIndo}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOldCard(acc);
                      }}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login PIN</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Shortcut to Izinkan Notifikasi & Admin Panel at the very bottom */}
        {onOpenAdminPanel && (
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Izinkan notifikasi atau buka Panel Admin di bawah ini:</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <AllowNotificationFooterButton />
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-rose-500/40 text-rose-300 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Panel Admin (Butuh PIN)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal PIN Kartu Lama saat mau login ke Kartu Lama */}
      {selectedOldCard && (
        <PinPromptModal
          isOpen={true}
          title={`Login ke Kartu: ${selectedOldCard.fullName}`}
          description={`Masukkan 6 digit PIN Kartu milik "${selectedOldCard.fullName}" (No. Rek: ${selectedOldCard.accountNumber}) untuk masuk ke kartu lama Anda. (Menggunakan PIN Kartu Lama, bukan PIN Admin. Jika lupa PIN, klik "Lupa PIN Kartu?" di bawah).`}
          targetAccountId={selectedOldCard.id}
          targetAccountName={selectedOldCard.fullName}
          cardNumberSnippet={selectedOldCard.cardNumber}
          expectedPin={selectedOldCard.pin}
          onSuccess={() => {
            loginToCardWithPin(selectedOldCard.id, selectedOldCard.pin);
            setSelectedOldCard(null);
          }}
          onCancel={() => setSelectedOldCard(null)}
        />
      )}
    </div>
  );
};
