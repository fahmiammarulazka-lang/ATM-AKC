/**
 * Bank Nusantara — Gerbang Masuk Portal Nasabah & Pendaftaran / Login Kartu
 * Alur 2 Tahap Wajib Google Sign-In:
 * 1. Layar Awal: Tombol "Sign in with Google" (Firebase Auth Popup) dengan domain resmi atm-akc.vercel.app.
 * 2. Setelah Login Google berhasil: Tampil pilihan "Buat Kartu Baru" atau "Login ke Kartu Lain".
 */
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  UserCheck,
  KeyRound,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Lock,
  LogOut,
  Cloud,
  Globe,
  Mail,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CardTier, BankAccount } from '../types/bank';
import { CARD_TIER_CONFIGS, formatRupiah } from '../utils/bankUtils';
import { PinPromptModal } from './PinPromptModal';
import { VerifiedBadge } from './VerifiedBadge';
import { AllowNotificationFooterButton } from './GlobalChatAndNotificationLayer';
import { GoogleMapsAddressPicker } from './GoogleMapsAddressPicker';
import { FIREBASE_CLOUD_CONFIG } from '../config/firebaseCloudConfig';

export const GoogleAuthOnboardingGate: React.FC = () => {
  const {
    googleUser,
    loginOrRegisterWithEmail,
    loginWithGooglePopup,
    logoutGoogle,
    accounts,
    registerCard,
    loginToCardWithPin,
    cloudSyncStatus,
  } = useBank();

  const [directEmail, setDirectEmail] = useState<string>('');
  const [directFullName, setDirectFullName] = useState<string>('');
  const [emailAuthLoading, setEmailAuthLoading] = useState<boolean>(false);
  const [emailAuthError, setEmailAuthError] = useState<string>('');

  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{ message: string; code?: string } | null>(null);

  // Stage 2 Mode ('register' = Buat Kartu Baru, 'login_old' = Login ke Kartu Lain pakai PIN Kartu / PIN Admin)
  const [onboardingTab, setOnboardingTab] = useState<'register' | 'login_old'>('register');

  // Registration Form State
  const [fullName, setFullName] = useState<string>('');
  const [nik, setNik] = useState<string>('3171042010980001');
  const [phone, setPhone] = useState<string>('081298765432');
  const [email, setEmail] = useState<string>('nasabah@banknusantara.id');
  const [address, setAddress] = useState<string>('Jl. Jend. Sudirman Kav. 21, Jakarta Pusat');
  const [selectedTier, setSelectedTier] = useState<CardTier>('regular');
  const [initialDeposit, setInitialDeposit] = useState<number>(500_000);
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [regError, setRegError] = useState<string>('');

  // Prefill nama & email dari akun Cloud yang login
  useEffect(() => {
    if (googleUser) {
      if (!fullName && googleUser.name) setFullName(googleUser.name);
      if (googleUser.email) setEmail(googleUser.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser?.email, googleUser?.name]);

  // Login to Another Card State
  const [selectedOldCard, setSelectedOldCard] = useState<BankAccount | null>(null);
  const [oldCardSearch, setOldCardSearch] = useState<string>('');

  const handleDirectEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailAuthError('');
    setAuthError(null);
    setEmailAuthLoading(true);
    try {
      const res = await loginOrRegisterWithEmail({
        email: directEmail,
        displayName: directFullName,
      });
      if (!res.success) {
        setEmailAuthError(res.message);
      }
    } finally {
      setEmailAuthLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setAuthError(null);
    setEmailAuthError('');
    setAuthLoading(true);
    try {
      const res = await loginWithGooglePopup();
      if (!res.success) {
        setAuthError({ message: res.message, code: res.errorCode });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle New Card Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    const finalName = fullName.trim();
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
      email: email.trim() || googleUser?.email || 'nasabah@banknusantara.id',
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
  // STAGE 1: LAYAR AWAL — DAFTAR/MASUK BEBAS SEMUA EMAIL + SIGN IN WITH GOOGLE (OPSIONAL)
  // ============================================================================
  if (!googleUser) {
    return (
      <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="max-w-md w-full bg-[#090B10] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
          {/* Bank Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <CreditCard className="w-6 h-6 text-slate-950" />
            </div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
              PT Bank Nusantara (Persero) Tbk
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bank Nusantara
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Daftar atau masuk dengan <strong className="text-white">email apa saja</strong> tanpa verifikasi Firebase — langsung aktif dan sinkron real-time antara HP dan laptop.
            </p>
          </div>

          {/* Primary Free Email Registration & Login Form */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2.5">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Autentikasi Cloud Real-Time</span>
              </span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  cloudSyncStatus === 'synced' ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {cloudSyncStatus === 'synced' ? 'Cloud Online' : 'Menghubungkan...'}
              </span>
            </div>

            {(emailAuthError || authError) && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1.5">
                <div className="flex items-start gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{emailAuthError || authError?.message}</span>
                </div>
                {authError?.code === 'auth/unauthorized-domain' && (
                  <p className="text-[11px] text-amber-200 pl-6 leading-relaxed">
                    Pastikan domain <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300">atm-akc.vercel.app</code> sudah ditambahkan pada <strong>Firebase Console → Authentication → Settings → Authorized domains</strong>.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleDirectEmailSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Alamat Email (Bebas Semua Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    placeholder="contoh: namaanda@gmail.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#11151E] border border-slate-700/80 focus:border-amber-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Nama Tampilan <span className="text-slate-500 font-normal">(opsional untuk akun baru)</span>
                </label>
                <input
                  type="text"
                  value={directFullName}
                  onChange={(e) => setDirectFullName(e.target.value)}
                  placeholder="Nama Lengkap Anda"
                  autoComplete="name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#11151E] border border-slate-700/80 focus:border-amber-400 text-sm text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={emailAuthLoading || authLoading}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] disabled:opacity-60 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>
                  {emailAuthLoading ? 'Menghubungkan ke Cloud...' : 'Masuk / Daftar Sekarang'}
                </span>
              </button>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Langsung aktif otomatis tanpa link atau verifikasi email Firebase. Login dengan email yang sama di HP &amp; laptop untuk sinkronisasi instan.
              </p>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-800" />
              <span className="shrink mx-3 text-[11px] text-slate-500">
                atau masuk dengan Google (opsional)
              </span>
              <div className="flex-grow border-t border-slate-800" />
            </div>

            {/* Optional Sign in with Google Button */}
            <button
              type="button"
              disabled={authLoading || emailAuthLoading}
              onClick={handleGoogleSignInClick}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 active:scale-[0.99] disabled:opacity-60 text-slate-900 font-bold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              {/* Official Google G Emblem SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>{authLoading ? 'Menghubungkan ke Google...' : 'Sign in with Google'}</span>
            </button>

            <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between gap-2 pt-0.5">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Authorized Domain</span>
              </span>
              <span className="text-amber-300 font-semibold truncate">
                {FIREBASE_CLOUD_CONFIG.authorizedDomains[0]}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 text-[11px] text-slate-500 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Cloud Firestore Real-Time</span>
              </span>
              <span>Tanpa Cache Lokal</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
              <AllowNotificationFooterButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STAGE 2: SETELAH LOGIN EMAIL / GOOGLE -> BUAT KARTU BARU ATAU LOGIN KE KARTU LAIN (PIN KARTU / PIN ADMIN)
  // ============================================================================
  const filteredOldCards = accounts.filter(
    (a) =>
      a.fullName.toLowerCase().includes(oldCardSearch.toLowerCase()) ||
      a.accountNumber.includes(oldCardSearch) ||
      a.cardNumber.includes(oldCardSearch)
  );

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="max-w-3xl w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 relative z-10 my-6">
        {/* Top Portal Bar showing Signed-In User */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            {googleUser.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl border border-amber-400/50 object-cover shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black text-sm flex items-center justify-center shrink-0">
                {googleUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="font-bold text-white truncate">{googleUser.name}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-[11px] font-mono text-emerald-400 truncate">
                  {googleUser.email}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {googleUser.authMode === 'email_direct'
                  ? 'Akun Email Cloud terhubung Real-Time (Aktif Otomatis). Pilih buat kartu baru atau login ke kartu Anda.'
                  : 'Akun Google terhubung ke Cloud Firestore Real-Time. Pilih buat kartu baru atau login ke kartu Anda.'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutGoogle}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>{googleUser.authMode === 'email_direct' ? 'Ganti Email / Akun' : 'Ganti Akun'}</span>
          </button>
        </div>

        {/* Step Title & Mode Switcher */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
            Pilih Akses Rekening Anda
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {onboardingTab === 'register'
              ? 'Buat Kartu ATM Baru Anda'
              : 'Login ke Kartu Lain (Pakai PIN Kartu 6 Digit)'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {onboardingTab === 'register'
              ? 'Isi identitas lengkap di bawah ini untuk membuat kartu ATM Bank Nusantara baru dan tentukan PIN 6 digit Anda. Jika sudah memiliki kartu, pilih tab "Login ke Kartu Lain".'
              : 'Pilih kartu tujuan di bawah ini lalu masukkan 6 digit PIN Kartu tersebut. Jika lupa PIN kartu, tersedia tombol "Lupa PIN Kartu?" di layar PIN.'}
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
                <span className="text-xs sm:text-sm block font-bold">1. Buat Kartu Baru</span>
                <span className="text-[10px] opacity-80 block">
                  Buka rekening &amp; buat PIN 6 digit baru
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
                  2. Login ke Kartu Lain
                </span>
                <span className="text-[10px] opacity-80 block">
                  Masukkan 6 digit PIN Kartu Anda
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB A: BUAT KARTU BARU
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

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Alamat Email Notifikasi Rekening:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nasabah@banknusantara.id"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono"
                />
              </div>
            </div>

            {/* Ambil Alamat Langsung dari Google Maps */}
            <GoogleMapsAddressPicker
              value={address}
              onChange={(newAddr) => setAddress(newAddr)}
              required={true}
              label="Alamat Tempat Tinggal:"
              placeholder="Pilih titik di peta di atas atau klik Ambil Lokasi GPS Saya Otomatis..."
            />

            {/* Pilih Jenis Kartu */}
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
              <span>Buat Kartu Baru Sekarang</span>
            </button>
          </form>
        )}

        {/* =====================================================================
            TAB B: LOGIN KE KARTU LAIN (PAKAI 6 DIGIT PIN KARTU)
           ===================================================================== */}
        {onboardingTab === 'login_old' && (
          <div className="space-y-4 text-xs border-t border-slate-800 pt-5">
            <div className="p-3.5 rounded-2xl bg-blue-950/50 border border-blue-500/40 text-blue-200 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">
                  Verifikasi Login Kartu: PIN Kartu 6 Digit
                </strong>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Pilih kartu mana saja di bawah ini, lalu masukkan <strong>6 digit PIN Kartu</strong> tersebut untuk langsung masuk. Jika lupa PIN kartu, klik tombol <strong>&quot;Lupa PIN Kartu?&quot;</strong> di modal PIN.
                </p>
              </div>
            </div>

            <input
              type="text"
              value={oldCardSearch}
              onChange={(e) => setOldCardSearch(e.target.value)}
              placeholder="Cari nama pemilik kartu atau 10 digit nomor rekening..."
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
                        <span className="text-[9px] font-mono text-amber-300">
                          Kartu #{idx + 1}
                        </span>
                        <span className="font-bold text-white truncate">{acc.fullName}</span>
                        {acc.isVerified && <VerifiedBadge size="xs" />}
                      </div>
                      <span className="font-mono text-[11px] text-amber-300 block mt-0.5">
                        No. Rek: {acc.accountNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Jenis: {CARD_TIER_CONFIGS[acc.cardTier]?.nameIndo} · Koin: {(acc.spinCoins || 0).toLocaleString('id-ID')}
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

        {/* Footer Shortcut to Izinkan Notifikasi */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Aktifkan notifikasi latar belakang agar pembaruan transaksi &amp; keamanan masuk real-time:</span>
          <AllowNotificationFooterButton />
        </div>
      </div>

      {/* Modal PIN Kartu saat mau login ke Kartu Lain */}
      {selectedOldCard && (
        <PinPromptModal
          isOpen={true}
          title={`Login ke Kartu: ${selectedOldCard.fullName}`}
          description={`Masukkan 6 digit PIN Kartu milik "${selectedOldCard.fullName}" (No. Rek: ${selectedOldCard.accountNumber}) untuk masuk ke kartu ini. Jika lupa PIN, klik "Lupa PIN Kartu?" di bawah.`}
          targetAccountId={selectedOldCard.id}
          targetAccountName={selectedOldCard.fullName}
          cardNumberSnippet={selectedOldCard.cardNumber}
          expectedPin={selectedOldCard.pin}
          acceptAdminPin={true}
          onSuccess={(enteredPin) => {
            loginToCardWithPin(
              selectedOldCard.id,
              enteredPin || selectedOldCard.pin
            );
            setSelectedOldCard(null);
          }}
          onCancel={() => setSelectedOldCard(null)}
        />
      )}
    </div>
  );
};
