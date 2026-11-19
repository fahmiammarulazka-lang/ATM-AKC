/**
 * Full-Screen Cloud Login & Card Onboarding Gate (Cloud Firestore + LocalStorage Guest)
 * - 3 Tab & Tombol Login Resmi SELALU TAMPIL di Semua Layar Masuk (termasuk saat sesi Google aktif di layar Verifikasi PIN / Buat Kartu):
 *   1) "Sign in with Google" (Otomatis Kartu Reguler untuk akun baru; jika email tersambung ke beberapa akun termasuk Akun OA/Guest yang sudah di-sync, tampil pemilih akun + wajib 6 digit PIN Kartu)
 *   2) "Login Dengan Akun OA" (Wajib isi: No. Rekening, ID 16 Digit, PIN Kartu & PIN Admin — khusus Akun OA buatan Panel Admin)
 *   3) "Login Lewat Guest" (Tersimpan di LocalStorage perangkat ini, 1-Klik Buat Kartu Reguler Guest Baru dengan PIN Cepat 6 Digit atau lanjutkan akun Guest tersimpan dengan PIN Kartu, dan bisa disambungkan ke Google lewat tombol "Sign in with Google" di tombol Sync atas Navbar)
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Landmark,
  ShieldCheck,
  CreditCard,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Wallet,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  Fingerprint,
  Building2,
  HardDrive,
  PlusCircle,
  Zap,
  Shuffle,
  ChevronDown,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  CARD_TIER_CONFIGS,
  formatRupiah,
  validateStrongPin,
  isUnlimitedNumber,
  generateRandomPin6,
} from '../utils/bankUtils';
import { VerifiedBadge, UserId16AboveNameBanner, OaAccountBadge } from './VerifiedBadge';

export const GoogleAuthOnboardingGate: React.FC = () => {
  const {
    googleUser,
    isAuthLoading,
    isCloudBootReady,
    cloudAccountVerificationState,
    retryCloudAccountCheck,
    loginWithGooglePopup,
    loginWithOaAccount,
    logoutGoogle,
    registerCard,
    guestLocalAccounts,
    registerGuestRegularCard,
    loginToGuestAccountWithPin,
    linkedUserAccount,
    linkedUserAccounts,
    verifyInitialCardPin,
    requestPinReset,
    pinResetRequests,
  } = useBank();

  // Mode Tab Utama yang SELALU tampil di semua layar masuk: 'google' | 'oa_login' | 'guest_login'
  const [lobbyMode, setLobbyMode] = useState<'google' | 'oa_login' | 'guest_login'>('google');

  // State Login Dengan Akun OA (Wajib 4 Kolom: No. Rek, ID 16 Digit, PIN Kartu, PIN Admin)
  const [oaAccountNumber, setOaAccountNumber] = useState('');
  const [oaUserId16, setOaUserId16] = useState('');
  const [oaCardPin, setOaCardPin] = useState('');
  const [oaAdminPin, setOaAdminPin] = useState('');
  const [showOaCardPin, setShowOaCardPin] = useState(false);
  const [showOaAdminPin, setShowOaAdminPin] = useState(false);
  const [isOaSubmitting, setIsOaSubmitting] = useState(false);

  // State Login Lewat Guest (LocalStorage - 1-Klik Kartu Reguler dengan PIN Cepat atau Masuk Guest Lama)
  const [guestSubMode, setGuestSubMode] = useState<'choose_existing' | 'create_new'>(() =>
    guestLocalAccounts.length > 0 ? 'choose_existing' : 'create_new'
  );
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [guestPinInput, setGuestPinInput] = useState('');
  const [showGuestPin, setShowGuestPin] = useState(false);

  // 1-Klik Buat Kartu Reguler Guest Baru dengan PIN Cepat
  const [guestFullName, setGuestFullName] = useState('Nasabah Guest Nusantara');
  const [guestQuickPin, setGuestQuickPin] = useState(() => generateRandomPin6());
  const [showGuestNewPin, setShowGuestNewPin] = useState(true);
  const [showGuestExtraFields, setShowGuestExtraFields] = useState(false);
  const [guestNik, setGuestNik] = useState(() => {
    const rand12 = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    return `3171${rand12}`;
  });
  const [guestPhone, setGuestPhone] = useState(() => {
    const rand8 = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
    return `0812${rand8}`;
  });
  const [guestAddress, setGuestAddress] = useState('Jl. Jend. Sudirman Kav. 1, Jakarta Pusat');
  const [guestInitialDeposit, setGuestInitialDeposit] = useState<number>(500_000);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRetryingCloudCheck, setIsRetryingCloudCheck] = useState(false);
  const [allowManualCreateOnTimeout, setAllowManualCreateOnTimeout] = useState(false);
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);

  // Stage 2A: Existing Card(s) Detected under Google Email -> Choose Account + Verify 6-Digit PIN
  const [selectedLinkedAccountId, setSelectedLinkedAccountId] = useState<string>('');
  const [existingPinInput, setExistingPinInput] = useState('');
  const [showExistingPin, setShowExistingPin] = useState(false);
  const [pinVerifyError, setPinVerifyError] = useState<string | null>(null);
  const [remainingPinTries, setRemainingPinTries] = useState<number>(5);
  const [forgotPinReason, setForgotPinReason] = useState('');
  const [showForgotPinBox, setShowForgotPinBox] = useState(false);
  const [forgotPinStatusMsg, setForgotPinStatusMsg] = useState<string | null>(null);

  // Stage 2B: New Google User -> Create Card (Otomatis Kartu Reguler)
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [initialDeposit, setInitialDeposit] = useState<number>(500_000);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [mapsAutocompleteReady, setMapsAutocompleteReady] = useState(false);

  // Sync default selected guest account
  useEffect(() => {
    if (guestLocalAccounts.length > 0) {
      if (!selectedGuestId || !guestLocalAccounts.some((g) => g.id === selectedGuestId)) {
        setSelectedGuestId(guestLocalAccounts[0].id);
      }
    } else {
      setGuestSubMode('create_new');
    }
  }, [guestLocalAccounts, selectedGuestId]);

  // Sync default selected linked account for Stage 2A
  useEffect(() => {
    if (linkedUserAccounts.length > 0) {
      if (
        !selectedLinkedAccountId ||
        !linkedUserAccounts.some((a) => a.id === selectedLinkedAccountId)
      ) {
        setSelectedLinkedAccountId(linkedUserAccount?.id || linkedUserAccounts[0].id);
      }
    }
  }, [linkedUserAccounts, linkedUserAccount, selectedLinkedAccountId]);

  const activeTargetAccount =
    linkedUserAccounts.find((a) => a.id === selectedLinkedAccountId) ||
    linkedUserAccount ||
    linkedUserAccounts[0] ||
    null;

  useEffect(() => {
    if (googleUser) {
      if (!fullName) setFullName(googleUser.name);
      if (!nik) {
        const rand12 = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
        setNik(`3171${rand12}`);
      }
      if (!phone) {
        const rand8 = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
        setPhone(`0812${rand8}`);
      }
      if (!address) {
        setAddress('Jl. Jend. Sudirman Kav. 1, Jakarta Pusat');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser]);

  // Integrasi Google Maps Places Autocomplete untuk kolom alamat saat buat kartu baru
  useEffect(() => {
    if (!googleUser || linkedUserAccounts.length > 0 || lobbyMode !== 'google') return;
    let autocompleteInstance: any = null;
    let listenerHandle: any = null;

    const initPlaces = () => {
      const g = (window as any).google;
      if (g?.maps?.places && addressInputRef.current) {
        try {
          autocompleteInstance = new g.maps.places.Autocomplete(addressInputRef.current, {
            fields: ['formatted_address', 'name', 'geometry'],
          });
          setMapsAutocompleteReady(true);
          listenerHandle = autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            const chosen = place?.formatted_address || place?.name;
            if (chosen) {
              setAddress(chosen);
            }
          });
        } catch {
          // Fallback manual input tetap berjalan lancar
        }
      }
    };

    initPlaces();
    const timer = window.setTimeout(initPlaces, 1200);
    return () => {
      window.clearTimeout(timer);
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
    };
  }, [googleUser, linkedUserAccounts.length, lobbyMode]);

  useEffect(() => {
    if (activeTargetAccount) {
      const used = activeTargetAccount.failedPinAttempts || 0;
      setRemainingPinTries(Math.max(0, 5 - used));
    }
  }, [activeTargetAccount]);

  const handleGooglePopupSignIn = async () => {
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const res = await loginWithGooglePopup();
      if (!res.success && res.errorCode !== 'auth/popup-closed-by-user') {
        setAuthError({ code: res.errorCode, message: res.message });
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleOaLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsOaSubmitting(true);
    try {
      const res = await loginWithOaAccount({
        accountNumber: oaAccountNumber,
        userId16: oaUserId16,
        cardPin: oaCardPin,
        adminPin: oaAdminPin,
      });
      if (!res.success) {
        setAuthError({ message: res.message });
      }
    } finally {
      setIsOaSubmitting(false);
    }
  };

  const handleGuestPinLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!selectedGuestId) {
      setAuthError({ message: 'Pilih akun Guest terlebih dahulu.' });
      return;
    }
    const res = loginToGuestAccountWithPin(selectedGuestId, guestPinInput);
    if (!res.success) {
      setAuthError({ message: res.message });
      setGuestPinInput('');
    }
  };

  const handleQuickCreateGuestCardSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    const cleanName = guestFullName.trim() || 'Nasabah Guest Nusantara';
    const cleanNik = /^\d{16}$/.test(guestNik.trim())
      ? guestNik.trim()
      : `3171${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')}`;
    const cleanPhone =
      guestPhone.trim().length >= 9
        ? guestPhone.trim()
        : `0812${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;
    const cleanPin =
      /^\d{6}$/.test(guestQuickPin.trim()) ? guestQuickPin.trim() : generateRandomPin6();

    const res = registerGuestRegularCard({
      fullName: cleanName,
      nik: cleanNik,
      phone: cleanPhone,
      address: guestAddress.trim() || 'Jl. Jend. Sudirman Kav. 1, Jakarta Pusat',
      pin: cleanPin,
      initialDeposit: Math.max(50_000, Number(guestInitialDeposit) || 500_000),
    });

    if (!res.success) {
      setAuthError({ message: res.message });
    }
  };

  const handleVerifyExistingCardPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinVerifyError(null);
    const res = verifyInitialCardPin(existingPinInput, activeTargetAccount?.id);
    if (!res.success) {
      setPinVerifyError(res.message);
      if (typeof res.remainingAttempts === 'number') {
        setRemainingPinTries(res.remainingAttempts);
      }
      setExistingPinInput('');
    }
  };

  const handleForgotPinSubmit = () => {
    if (!activeTargetAccount) return;
    const res = requestPinReset(
      activeTargetAccount.id,
      forgotPinReason.trim() || 'Lupa PIN Kartu saat login akun di layar verifikasi awal'
    );
    setForgotPinStatusMsg(res.message);
  };

  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Nama Lengkap sesuai identitas wajib diisi.');
      return;
    }
    if (!/^\d{16}$/.test(nik.trim())) {
      setErrorMsg('NIK harus terdiri dari tepat 16 digit angka.');
      return;
    }
    if (phone.trim().length < 9) {
      setErrorMsg('Nomor HP tidak valid.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Alamat tempat tinggal wajib diisi.');
      return;
    }
    const pinValidation = validateStrongPin(pin.trim());
    if (!pinValidation.valid) {
      setErrorMsg(pinValidation.reason || 'PIN harus terdiri dari tepat 6 digit angka yang kuat.');
      return;
    }
    if (pin.trim() !== confirmPin.trim()) {
      setErrorMsg('Konfirmasi PIN tidak cocok dengan PIN yang Anda masukkan.');
      return;
    }
    if (initialDeposit < 50_000) {
      setErrorMsg('Setoran awal minimal Rp 50.000.');
      return;
    }

    const res = registerCard({
      fullName: fullName.trim(),
      nik: nik.trim(),
      phone: phone.trim(),
      email: googleUser?.email || 'nasabah@gmail.com',
      address: address.trim(),
      pin: pin.trim(),
      cardTier: 'regular',
      initialDeposit,
    });

    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  if (isAuthLoading || !isCloudBootReady) {
    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-700 flex items-center justify-center shadow-xl shadow-cyan-500/20 mb-4 animate-pulse">
          <Landmark className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-bold text-cyan-300">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Menghubungkan ke Cloud Database Bank Nusantara...</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Memeriksa sesi keamanan dan status rekening real-time
        </p>
      </div>
    );
  }

  // KOMPONEN BAR 3 TAB LOGIN YANG SELALU TAMPIL DI SEMUA LAYAR MASUK (STAGE 1, STAGE 2A, STAGE 2B)
  const renderPersistentThreeLoginTabs = () => (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
          Pilih Metode Masuk (3 Jalur Resmi):
        </span>
        <span className="text-[10px] font-mono text-emerald-300">
          Guest Local: {guestLocalAccounts.length} Akun
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-slate-950/95 border border-slate-700/90 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setLobbyMode('google');
            setAuthError(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            lobbyMode === 'google'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/25'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">1. Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLobbyMode('oa_login');
            setAuthError(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            lobbyMode === 'oa_login'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'text-amber-300 hover:text-amber-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">2. Akun OA</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLobbyMode('guest_login');
            setGuestSubMode(guestLocalAccounts.length > 0 ? 'choose_existing' : 'create_new');
            setAuthError(null);
          }}
          className={`py-2.5 px-2 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            lobbyMode === 'guest_login'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'text-emerald-300 hover:text-emerald-200 hover:bg-slate-900'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">3. Login Guest</span>
        </button>
      </div>
    </div>
  );

  // JIKA PENGGUNA MEMILIH TAB "2. AKUN OA" ATAU "3. LOGIN GUEST" (MESKIPUN SESI GOOGLE SEDANG AKTIF)
  if (lobbyMode === 'oa_login' || lobbyMode === 'guest_login') {
    const selectedGuestAccount =
      guestLocalAccounts.find((g) => g.id === selectedGuestId) || guestLocalAccounts[0] || null;

    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {/* Brand Logo */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-cyan-500/25 border border-white/20 mb-2.5">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bank Nusantara Digital
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerbang Masuk Resmi: Google Cloud • Akun OA Panel Admin • Guest Cloud (Firebase Real-Time)
            </p>
          </div>

          {renderPersistentThreeLoginTabs()}

          {lobbyMode === 'oa_login' ? (
            /* FORM LOGIN DENGAN AKUN OA (WAJIB 4 KOLOM) */
            <form onSubmit={handleOaLoginSubmit} className="space-y-4">
              <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-emerald-500/15 border border-amber-500/40 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <OaAccountBadge size="sm" />
                  <span className="text-xs font-extrabold text-amber-200">
                    Otorisasi Khusus Akun OA Panel Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Masukkan keempat kredensial Akun OA Anda. Setelah masuk, Anda juga dapat menyambungkan Akun OA ke email Google melalui tombol <strong>"Sign in with Google"</strong> di bagian atas Navbar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  1. Nomor Rekening (10 Digit) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={oaAccountNumber}
                  onChange={(e) => setOaAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Contoh: 9999999999"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-white focus:border-amber-400 focus:outline-none tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
                    2. ID User 16 Digit (Di Atas Nama User) *
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">
                    {oaUserId16.replace(/\D/g, '').length}/16 Digit
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    oaUserId16
                      .replace(/\D/g, '')
                      .slice(0, 16)
                      .replace(/(\d{4})(?=\d)/g, '$1 ')
                  }
                  onChange={(e) =>
                    setOaUserId16(e.target.value.replace(/\D/g, '').slice(0, 16))
                  }
                  placeholder="XXXX XXXX XXXX XXXX (16 Digit)"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-amber-300 focus:border-amber-400 focus:outline-none tracking-widest"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    3. PIN Kartu (6 Digit) *
                  </label>
                  <div className="relative">
                    <input
                      type={showOaCardPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      value={oaCardPin}
                      onChange={(e) => setOaCardPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 Digit PIN Kartu"
                      required
                      className="w-full pl-3.5 pr-9 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-white focus:border-emerald-400 focus:outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOaCardPin((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showOaCardPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    4. PIN Admin OA *
                  </label>
                  <div className="relative">
                    <input
                      type={showOaAdminPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      value={oaAdminPin}
                      onChange={(e) => setOaAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="PIN Admin"
                      required
                      className="w-full pl-3.5 pr-9 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-rose-200 focus:border-rose-400 focus:outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOaAdminPin((p) => !p)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showOaAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isOaSubmitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-60"
              >
                {isOaSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Kredensial Akun OA...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Masuk Sekarang dengan Akun OA</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* MODE 3: LOGIN LEWAT GUEST (LOCALSTORAGE - 1-KLIK KARTU REGULER DENGAN PIN CEPAT) */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/40 rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4" />
                    <span>Login Lewat Guest (Tersinkron Real-Time di Firebase Firestore)</span>
                  </span>
                  {guestLocalAccounts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuestSubMode((prev) =>
                          prev === 'choose_existing' ? 'create_new' : 'choose_existing'
                        );
                        setAuthError(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-black cursor-pointer"
                    >
                      {guestSubMode === 'choose_existing'
                        ? '+ Buat Guest Baru (1-Klik)'
                        : `Pilih Guest Tersimpan (${guestLocalAccounts.length})`}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Akun Guest langsung disimpan secara real-time di <strong>Firebase Cloud Firestore (azkaakc)</strong> tanpa localStorage (otomatis mendapatkan <strong>Kartu Reguler</strong> &amp; <strong>ID 16 Digit</strong>). Kapan saja Anda ingin menyambungkannya ke akun Google, klik tombol <strong>"Sign in with Google"</strong> di bagian atas Navbar.
                </p>
              </div>

              {guestSubMode === 'choose_existing' && guestLocalAccounts.length > 0 ? (
                <form onSubmit={handleGuestPinLoginSubmit} className="space-y-3.5">
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {guestLocalAccounts.map((gAcc) => {
                      const isSelected = gAcc.id === (selectedGuestAccount?.id || '');
                      return (
                        <button
                          key={gAcc.id}
                          type="button"
                          onClick={() => {
                            setSelectedGuestId(gAcc.id);
                            setAuthError(null);
                          }}
                          className={`w-full p-3 rounded-2xl border text-left transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/60 border-emerald-400 shadow-lg shadow-emerald-500/10'
                              : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="mb-1">
                            <UserId16AboveNameBanner account={gAcc} size="xs" />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>{gAcc.fullName}</span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                                  GUEST LOCAL
                                </span>
                              </p>
                              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                                No. Rek: <strong className="text-amber-300">{gAcc.accountNumber}</strong> • Saldo:{' '}
                                <strong className="text-emerald-300">{formatRupiah(gAcc.balance)}</strong>
                              </p>
                            </div>
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                                  : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Masukkan 6 Digit PIN Kartu Guest ({selectedGuestAccount?.fullName}) *
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showGuestPin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        value={guestPinInput}
                        onChange={(e) =>
                          setGuestPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder="••••••"
                        required
                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-center text-base font-mono font-bold tracking-[0.4em] text-white focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGuestPin((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showGuestPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={guestPinInput.length !== 6}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Lanjutkan Masuk ke Akun Guest Ini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setGuestSubMode('create_new');
                      setAuthError(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Buat Kartu Reguler Guest Baru (1-Klik PIN Cepat)</span>
                  </button>
                </form>
              ) : (
                /* 1-KLIK BUAT KARTU REGULER GUEST BARU DENGAN PIN CEPAT */
                <form onSubmit={handleQuickCreateGuestCardSubmit} className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>1-Klik Kartu Reguler Guest Baru (Cloud Firestore)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase">
                        Otomatis Reguler
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Nama Tampilan Guest
                        </label>
                        <input
                          type="text"
                          value={guestFullName}
                          onChange={(e) => setGuestFullName(e.target.value)}
                          placeholder="Nasabah Guest Nusantara"
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:border-emerald-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-emerald-300">
                            PIN Cepat Kartu Guest (6 Digit) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setGuestQuickPin(generateRandomPin6())}
                            className="text-[10px] font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Shuffle className="w-3 h-3" /> Acak PIN
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showGuestNewPin ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={6}
                            value={guestQuickPin}
                            onChange={(e) =>
                              setGuestQuickPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            required
                            className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-xs font-mono font-black tracking-widest text-emerald-300 focus:border-emerald-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowGuestNewPin((p) => !p)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          >
                            {showGuestNewPin ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowGuestExtraFields((p) => !p)}
                      className="text-[11px] font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          showGuestExtraFields ? 'rotate-180' : ''
                        }`}
                      />
                      <span>
                        {showGuestExtraFields
                          ? 'Sembunyikan Detail Tambahan (NIK, No. HP, Setoran Awal)'
                          : 'Atur Detail Tambahan (Opsional — Otomatis Terisi)'}
                      </span>
                    </button>

                    {showGuestExtraFields && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            NIK (16 Digit)
                          </label>
                          <input
                            type="text"
                            maxLength={16}
                            value={guestNik}
                            onChange={(e) =>
                              setGuestNik(e.target.value.replace(/\D/g, '').slice(0, 16))
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            Setoran Awal (Rp)
                          </label>
                          <input
                            type="number"
                            min={50000}
                            step={50000}
                            value={guestInitialDeposit}
                            onChange={(e) => setGuestInitialDeposit(Number(e.target.value))}
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition cursor-pointer"
                  >
                    <Zap className="w-5 h-5" />
                    <span>⚡ Buka Kartu Reguler Guest &amp; Masuk Sekarang (1-Klik)</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {authError && (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 space-y-2.5">
              <div className="flex items-start gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError.message}</span>
              </div>
              {authError.code === 'auth/popup-blocked' && (
                <button
                  type="button"
                  onClick={handleGooglePopupSignIn}
                  disabled={isSigningIn}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-black text-xs cursor-pointer transition disabled:opacity-60"
                >
                  Coba Lagi Login Popup Google
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAGE 1: LOBI AWAL SAAT BELUM ADA SESI GOOGLE (!googleUser)
  if (!googleUser) {
    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {/* Brand Logo */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-cyan-500/25 border border-white/20 mb-3">
              <Landmark className="w-8 h-8 text-white" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold tracking-wider uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Portal Perbankan Cloud &amp; Local Guest
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bank Nusantara Digital
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
              Pilih salah satu dari <strong>3 tombol login resmi</strong> di bawah ini:
            </p>
          </div>

          {renderPersistentThreeLoginTabs()}

          <div className="space-y-3.5">
            {/* Tombol Utama 1: Sign in with Google */}
            <button
              type="button"
              onClick={handleGooglePopupSignIn}
              disabled={isSigningIn}
              className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl transition cursor-pointer disabled:opacity-60"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Membuka Jendela Login Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>1. Sign in with Google</span>
                </>
              )}
            </button>

            {/* Tombol Utama 2: Login Dengan Akun OA */}
            <button
              type="button"
              onClick={() => {
                setLobbyMode('oa_login');
                setAuthError(null);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-slate-950" />
              <span>2. Login Dengan Akun OA (Buatan Panel Admin)</span>
            </button>

            {/* Tombol Utama 3: Login Lewat Guest (Cloud Firestore) */}
            <button
              type="button"
              onClick={() => {
                setLobbyMode('guest_login');
                setGuestSubMode(guestLocalAccounts.length > 0 ? 'choose_existing' : 'create_new');
                setAuthError(null);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition cursor-pointer"
            >
              <HardDrive className="w-5 h-5 text-slate-950" />
              <span>
                3. Login Lewat Guest (Firebase Cloud
                {guestLocalAccounts.length > 0 ? ` · ${guestLocalAccounts.length} Tersimpan` : ' · 1-Klik'}
                )
              </span>
            </button>

            {/* Informasi Fitur Login */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Sign in with Google:</strong> Akun baru otomatis mendapatkan <strong className="text-cyan-300">Kartu Reguler</strong>. Jika email Anda terhubung ke beberapa akun (termasuk Akun OA / Guest yang sudah di-sync), Anda bebas memilih akun mana yang ingin dimasuki.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">Login Dengan Akun OA:</strong> Khusus untuk akun yang dibuat di Panel Admin menggunakan <strong>No. Rekening, ID 16 Digit, PIN Kartu &amp; PIN Admin</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">Login Lewat Guest:</strong> Langsung tersimpan secara real-time di <strong>Firebase Cloud Firestore (azkaakc)</strong> dan bisa disambungkan ke akun Google lewat tombol <strong>"Sign in with Google"</strong> di bagian atas Navbar.
                </span>
              </div>
            </div>
          </div>

          {authError && (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 space-y-2.5">
              <div className="flex items-start gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError.message}</span>
              </div>
              {authError.code === 'auth/popup-blocked' && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGooglePopupSignIn}
                    disabled={isSigningIn}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs cursor-pointer transition disabled:opacity-60"
                  >
                    Coba Lagi Login Popup Google
                  </button>
                  <span className="text-[11px] text-rose-200/80">
                    Pastikan izin pop-up browser untuk halaman ini sudah aktif.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STAGE 2A: EMAIL GOOGLE SUDAH TERHUBUNG KE 1 ATAU BEBERAPA AKUN
  // -> TETAP TAMPILKAN 3 TAB LOGIN DI ATAS + PEMILIH AKUN + VERIFIKASI 6 DIGIT PIN KARTU + TOMBOL PINTAS LOGIN GUEST & OA
  if (linkedUserAccounts.length > 0 && activeTargetAccount) {
    const tierCfg = CARD_TIER_CONFIGS[activeTargetAccount.cardTier] || CARD_TIER_CONFIGS.regular;
    const latestResetReq = pinResetRequests.find(
      (r) => r.accountId === activeTargetAccount.id
    );

    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {/* Bar 3 Tab Login Selalu Terlihat di Paling Atas */}
          {renderPersistentThreeLoginTabs()}

          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-10 h-10 rounded-full border border-cyan-400/50 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {googleUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">{googleUser.name}</p>
                <p className="text-[11px] text-cyan-300 truncate">{googleUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logoutGoogle}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" /> Ganti Email
            </button>
          </div>

          {/* PEMILIH AKUN (MULTI-ACCOUNT CHOOSER): TAMPILKAN SEMUA AKUN DI EMAIL TERSEBUT */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>
                  {linkedUserAccounts.length > 1
                    ? `Pilih Akun Rekening yang Ingin Anda Masuki (${linkedUserAccounts.length} Akun Terhubung):`
                    : 'Akun Rekening Terhubung ke Email Google Ini:'}
                </span>
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {linkedUserAccounts.map((acc, idx) => {
                const isSelected = acc.id === activeTargetAccount.id;
                const itemTierCfg = CARD_TIER_CONFIGS[acc.cardTier] || CARD_TIER_CONFIGS.regular;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSelectedLinkedAccountId(acc.id);
                      setExistingPinInput('');
                      setPinVerifyError(null);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-950/80 via-slate-900 to-indigo-950/80 border-cyan-400 shadow-lg shadow-cyan-500/15'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-amber-300">
                        Akun #{idx + 1}{' '}
                        {acc.isOfficialAdminAccount
                          ? '• AKUN OA TERHUBUNG GOOGLE'
                          : '• AKUN GOOGLE CLOUD'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${itemTierCfg.badgeColor}`}>
                        {itemTierCfg.name}
                      </span>
                    </div>

                    <div className="mb-1">
                      <UserId16AboveNameBanner account={acc} size="xs" />
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                          <span>{acc.fullName}</span>
                          {acc.isVerified && (
                            <VerifiedBadge size="xs" label={acc.verifiedLabel} />
                          )}
                          {acc.isOfficialAdminAccount && <OaAccountBadge size="xs" />}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          No. Rek: <span className="text-cyan-300 font-bold">{acc.accountNumber}</span> • Saldo:{' '}
                          <span className="text-emerald-300 font-bold">
                            {acc.cardTier === 'admin' || isUnlimitedNumber(acc.balance)
                              ? '∞ Unlimited'
                              : formatRupiah(acc.balance)}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black shrink-0 ${
                          isSelected
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isSelected ? '✓ Dipilih' : 'Pilih Akun'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-center mb-3.5">
            <h2 className="text-base sm:text-lg font-black text-white flex items-center justify-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Masukkan 6 Digit PIN Kartu "{activeTargetAccount.fullName}"</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Wajib masukkan 6 digit PIN Kartu untuk membuka rekening{' '}
              <strong className="text-cyan-300">{activeTargetAccount.accountNumber}</strong> ({tierCfg.name}).
            </p>
            {!activeTargetAccount.isOfficialAdminAccount && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                <span>Sisa Kesempatan PIN: {remainingPinTries} / 5</span>
                <span className="text-rose-400">• (Salah 5x = Banned 1 Hari)</span>
              </div>
            )}
          </div>

          <form onSubmit={handleVerifyExistingCardPin} className="space-y-3.5">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showExistingPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={6}
                value={existingPinInput}
                onChange={(e) => setExistingPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                required
                className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-center text-lg font-mono tracking-[0.5em] text-white focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowExistingPin((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showExistingPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {pinVerifyError && (
              <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 flex items-start gap-2 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{pinVerifyError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={existingPinInput.length !== 6}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Verifikasi PIN &amp; Masuk ke "{activeTargetAccount.fullName}"</span>
            </button>
          </form>

          {/* Tombol Pintas Langsung ke Login Lewat Guest & Login Dengan Akun OA di Bawah Form PIN */}
          <div className="mt-4 pt-3.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setLobbyMode('guest_login');
                setGuestSubMode(guestLocalAccounts.length > 0 ? 'choose_existing' : 'create_new');
                setAuthError(null);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <HardDrive className="w-4 h-4" />
              <span>Login Lewat Guest (Local)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLobbyMode('oa_login');
                setAuthError(null);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Login Dengan Akun OA</span>
            </button>
          </div>

          {/* Opsi Lupa PIN Kartu */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowForgotPinBox((p) => !p)}
              className="w-full text-center text-xs font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
            >
              Lupa PIN Kartu 6 Digit Anda? Ajukan Bantuan ke Admin
            </button>

            {showForgotPinBox && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-2.5">
                {latestResetReq?.status === 'approved' && latestResetReq.revealedPin ? (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200">
                    ✅ Permohonan disetujui Admin! PIN Kartu Anda adalah:{' '}
                    <span className="font-mono font-black text-sm text-emerald-300">
                      {latestResetReq.revealedPin}
                    </span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={forgotPinReason}
                      onChange={(e) => setForgotPinReason(e.target.value)}
                      placeholder="Catatan singkat untuk Admin (opsional)..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleForgotPinSubmit}
                      className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold cursor-pointer"
                    >
                      Kirim Permohonan Lihat PIN ke Admin
                    </button>
                  </>
                )}
                {forgotPinStatusMsg && (
                  <p className="text-[11px] text-cyan-300">{forgotPinStatusMsg}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STAGE 2A-GUARD: TAHAN FORM BUAT AKUN SAMPAI CLOUD BENAR-BENAR MENGONFIRMASI 0 KARTU!
  if (
    linkedUserAccounts.length === 0 &&
    (cloudAccountVerificationState === 'verifying' ||
      (cloudAccountVerificationState === 'network_timeout' && !allowManualCreateOnTimeout))
  ) {
    const isTimeoutState = cloudAccountVerificationState === 'network_timeout';
    const handleRetryCloud = async () => {
      setIsRetryingCloudCheck(true);
      try {
        await retryCloudAccountCheck();
      } finally {
        setIsRetryingCloudCheck(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 py-8 px-4 flex items-center justify-center relative overflow-hidden">
        <div className="w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
          {renderPersistentThreeLoginTabs()}

          <div className="flex items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              {googleUser.picture ? (
                <img
                  src={googleUser.picture}
                  alt={googleUser.name}
                  className="w-10 h-10 rounded-full border border-cyan-400/50 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                  {googleUser.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">{googleUser.name}</p>
                <p className="text-[11px] text-cyan-300 truncate">{googleUser.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logoutGoogle}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" /> Ganti Email
            </button>
          </div>

          <div className="rounded-2xl bg-[#0c1324] border border-slate-800 p-6 text-center space-y-4">
            <div
              className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center border ${
                isTimeoutState
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {isTimeoutState && !isRetryingCloudCheck ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <Loader2 className="w-6 h-6 animate-spin" />
              )}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-white">
                {isTimeoutState && !isRetryingCloudCheck
                  ? 'Koneksi Cloud Lambat — Rekening Belum Terkonfirmasi'
                  : 'Memverifikasi Rekening Lama Anda di Cloud...'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isTimeoutState && !isRetryingCloudCheck
                  ? 'Server Firebase (azkaakc) belum merespons penuh. Form pembuatan akun baru ditahan agar rekening lama Anda tidak tertimpa.'
                  : 'Memeriksa Kartu Reguler dan Akun OA yang terhubung ke email Google Anda di Firebase secara real-time.'}
              </p>
            </div>

            <div className="pt-1 space-y-2.5">
              <button
                type="button"
                onClick={handleRetryCloud}
                disabled={isRetryingCloudCheck}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {isRetryingCloudCheck ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memeriksa Ulang Data Cloud...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Muat Ulang Akun Cloud</span>
                  </>
                )}
              </button>

              {isTimeoutState && !isRetryingCloudCheck && (
                <button
                  type="button"
                  onClick={() => setAllowManualCreateOnTimeout(true)}
                  className="w-full py-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-semibold transition cursor-pointer"
                >
                  Saya nasabah baru &amp; belum punya kartu, lanjut buat kartu baru
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STAGE 2B: PENGGUNA GOOGLE BARU (TERKONFIRMASI 0 KARTU OLEH CLOUD) -> BUAT KARTU BARU (OTOMATIS KARTU REGULER)
  const regularCfg = CARD_TIER_CONFIGS.regular;

  return (
    <div className="min-h-screen bg-[#040814] text-slate-100 py-8 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-5 sm:p-8 shadow-2xl relative z-10">
        {renderPersistentThreeLoginTabs()}

        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {googleUser.picture ? (
              <img
                src={googleUser.picture}
                alt={googleUser.name}
                className="w-11 h-11 rounded-full border-2 border-cyan-400"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg">
                {googleUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold text-white">{googleUser.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Google Terhubung
                </span>
              </div>
              <p className="text-xs text-cyan-300">{googleUser.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logoutGoogle}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Ganti Akun
          </button>
        </div>

        <form onSubmit={handleCreateCardSubmit} className="space-y-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-3.5 text-xs text-cyan-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Pendaftaran Kartu Baru (Otomatis Kartu Reguler)</p>
              <p className="text-slate-300 mt-0.5">
                Setiap pendaftaran baru melalui Sign in with Google otomatis mendapatkan{' '}
                <strong className="text-cyan-300">1. Kartu Reguler (Biasa)</strong> beserta{' '}
                <strong className="text-amber-300">ID 16 Digit Permanen</strong> di atas nama Anda.
              </p>
            </div>
          </div>

          {/* Info Jenis Kartu Otomatis Reguler */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/60 via-indigo-950/70 to-slate-950 border border-blue-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{regularCfg.nameIndo}</p>
                <p className="text-[11px] text-blue-200">
                  Limit Tarik Harian: {formatRupiah(regularCfg.dailyWithdrawalLimit)} • Biaya Bulanan:{' '}
                  {formatRupiah(regularCfg.monthlyFee)}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shrink-0">
              Otomatis Reguler
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Lengkap Sesuai KTP *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                NIK (16 Digit Angka) *
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nomor WhatsApp / HP Aktif *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Setoran Awal (Min. Rp 50.000) *
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={50000}
                  step={50000}
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Number(e.target.value))}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-300">
                Alamat Domisili Lengkap (Terintegrasi Google Maps) *
              </label>
              {mapsAutocompleteReady && (
                <span className="text-[10px] text-emerald-400 font-semibold">
                  📍 Google Maps Autocomplete Aktif
                </span>
              )}
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={addressInputRef}
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ketik alamat atau pilih dari saran Google Maps..."
                required
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Buat PIN Kartu (6 Digit Kuat) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Contoh: 482917"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tracking-widest text-white focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPin((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Ulangi Konfirmasi PIN (6 Digit) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Ketik ulang 6 digit PIN"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tracking-widest text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Terbitkan Kartu Reguler &amp; Masuk ke Rekening Saya</span>
          </button>
        </form>
      </div>
    </div>
  );
};
