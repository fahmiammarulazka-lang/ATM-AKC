/**
 * Full-Screen Cloud Login & Card Onboarding Gate (Cloud Firestore + LocalStorage Guest)
 * - 3 Tab & Tombol Login Resmi SELALU TAMPIL di Semua Layar Masuk (termasuk saat sesi Google aktif di layar Verifikasi PIN / Buat Kartu):
 *   1) "Sign in with Google" (Otomatis Kartu Reguler untuk akun baru; jika email tersambung ke beberapa akun termasuk Akun OA/Guest yang sudah di-sync, tampil pemilih akun + wajib 6 digit PIN Kartu)
 *   2) "Login Dengan Akun OA" (Wajib isi: No. Rekening, ID 16 Digit, PIN Kartu & PIN Admin — khusus Akun OA buatan Panel Admin)
 *   3) "Login Lewat Guest" (Tersimpan di LocalStorage perangkat ini, 1-Klik Buat Kartu Reguler Guest Baru dengan PIN Cepat 6 Digit atau lanjutkan akun Guest tersimpan dengan PIN Kartu, dan bisa disambungkan ke Google lewat tombol "Sign in with Google" di tombol Sync atas Navbar)
 */
import React, { useState, useEffect } from 'react';
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
  LogIn,
  UserPlus,
  Copy,
  Link2,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  CARD_TIER_CONFIGS,
  formatRupiah,
  validateStrongPin,
  isUnlimitedNumber,
  generateRandomPin6,
  formatUserId16,
  formatUserId16Display,
  formatAccountNumberDisplay,
  ensureAccountUserId16,
} from '../utils/bankUtils';
import { StructuredIndonesiaAddress, BankAccount } from '../types/bank';
import {
  createEmptyStructuredAddress,
  validateStructuredAddress,
} from '../data/indonesiaRegionsOffline';
import { IndonesiaAddressPicker } from './IndonesiaAddressPicker';
import { VerifiedBadge, UserId16AboveNameBanner, OaAccountBadge } from './VerifiedBadge';
import { signInWithGooglePopup } from '../firebase';

export const GoogleAuthOnboardingGate: React.FC = () => {
  const {
    googleUser,
    isAuthLoading,
    isCloudBootReady,
    cloudAccountVerificationState,
    retryCloudAccountCheck,
    loginWithGooglePopup,
    loginWithStandardAccount,
    loginWithOaAccount,
    logoutGoogle,
    registerCard,
    guestLocalAccounts,
    deviceLobbyGuestAccount,
    canCreateLobbyGuestOnThisDevice,
    canCreateLobbyRegularAccountOnThisDevice,
    registerLobbyStandaloneAccount,
    linkCurrentAccountWithGooglePopup,
    registerGuestRegularCard,
    loginToGuestAccountWithPin,
    linkedUserAccount,
    linkedUserAccounts,
    verifyInitialCardPin,
    requestPinReset,
    pinResetRequests,
    accounts,
    quickSwitchReturnSnapshot,
    returnToPreviousAccountFromSwitch,
  } = useBank();

  // Mode Tab Utama yang SELALU tampil di semua layar masuk (5 Jalur Resmi):
  // 1) 'google' | 2) 'create_account' (Buat Akun) | 3) 'standard_login' (Login Ke Akun) | 4) 'oa_login' (OA) | 5) 'guest_login' (Guest)
  const [lobbyMode, setLobbyMode] = useState<
    'google' | 'create_account' | 'standard_login' | 'oa_login' | 'guest_login'
  >('google');

  // State Tab 2: Buat Akun (Tanpa Wajib Google + Opsional Sambungkan Google, Alamat 38 Provinsi, Kartu Reguler, Saldo Rp 0, Menunggu Persetujuan Admin, Maks 1 per Perangkat)
  const [createFullName, setCreateFullName] = useState('');
  const [createNik, setCreateNik] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createStructuredAddress, setCreateStructuredAddress] = useState<StructuredIndonesiaAddress>(
    () => createEmptyStructuredAddress()
  );
  const [createPin, setCreatePin] = useState('');
  const [createConfirmPin, setCreateConfirmPin] = useState('');
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [createOptionalGoogleEmail, setCreateOptionalGoogleEmail] = useState<string>('');
  const [isLinkingOptionalGoogleInForm, setIsLinkingOptionalGoogleInForm] = useState(false);
  const [isLinkingExistingCreatedAccountGoogle, setIsLinkingExistingCreatedAccountGoogle] =
    useState(false);
  const [newlyCreatedAccountSummary, setNewlyCreatedAccountSummary] =
    useState<BankAccount | null>(null);
  const [copiedCredentialField, setCopiedCredentialField] = useState<string | null>(null);
  const [createAccountFeedbackMsg, setCreateAccountFeedbackMsg] = useState<string | null>(null);

  // State Login Ke Akun (Wajib 3 Kolom: No. Rek, User ID 16 Digit, PIN Kartu — semua akun KECUALI Akun OA)
  const [stdAccountNumber, setStdAccountNumber] = useState('');
  const [stdUserId16, setStdUserId16] = useState('');
  const [stdCardPin, setStdCardPin] = useState('');
  const [showStdCardPin, setShowStdCardPin] = useState(false);
  const [isStdSubmitting, setIsStdSubmitting] = useState(false);

  // State Login Dengan Akun OA (Wajib 4 Kolom: No. Rek, ID 16 Digit, PIN Kartu, PIN Admin)
  const [oaAccountNumber, setOaAccountNumber] = useState('');
  const [oaUserId16, setOaUserId16] = useState('');
  const [oaCardPin, setOaCardPin] = useState('');
  const [oaAdminPin, setOaAdminPin] = useState('');
  const [showOaCardPin, setShowOaCardPin] = useState(false);
  const [showOaAdminPin, setShowOaAdminPin] = useState(false);
  const [isOaSubmitting, setIsOaSubmitting] = useState(false);

  // State Login Lewat Guest (Maks 1 pembuatan Guest per perangkat di Lobi, Tanpa Alamat, Saldo Rp 0)
  const [guestSubMode, setGuestSubMode] = useState<'choose_existing' | 'create_new'>(() =>
    guestLocalAccounts.length > 0 || !canCreateLobbyGuestOnThisDevice
      ? 'choose_existing'
      : 'create_new'
  );
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [guestPinInput, setGuestPinInput] = useState('');
  const [showGuestPin, setShowGuestPin] = useState(false);

  // Buat Kartu Reguler Guest Baru dengan PIN Cepat (Tanpa Alamat & Saldo Awal Rp 0)
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

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isRetryingCloudCheck, setIsRetryingCloudCheck] = useState(false);
  const [allowManualCreateOnTimeout, setAllowManualCreateOnTimeout] = useState(false);
  const [maskLobbyNumbers, setMaskLobbyNumbers] = useState(false);
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
  const [forgotPinVerifyNik, setForgotPinVerifyNik] = useState('');
  const [forgotPinVerifySecondary, setForgotPinVerifySecondary] = useState('');
  const [forgotPinOwnerVerified, setForgotPinOwnerVerified] = useState(false);
  const [forgotPinVerifyError, setForgotPinVerifyError] = useState<string | null>(null);

  // Stage 2B: New Google User -> Create Card (Otomatis Kartu Reguler, Saldo Awal Rp 0, Alamat Wilayah Indonesia Berjenjang)
  const [fullName, setFullName] = useState('');
  const [nik, setNik] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [structuredAddress, setStructuredAddress] = useState<StructuredIndonesiaAddress>(() =>
    createEmptyStructuredAddress()
  );
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync default selected guest account & enforce 1-guest limit submode
  useEffect(() => {
    if (guestLocalAccounts.length > 0) {
      if (!selectedGuestId || !guestLocalAccounts.some((g) => g.id === selectedGuestId)) {
        setSelectedGuestId(deviceLobbyGuestAccount?.id || guestLocalAccounts[0].id);
      }
      if (!canCreateLobbyGuestOnThisDevice && guestSubMode === 'create_new') {
        setGuestSubMode('choose_existing');
      }
    } else if (canCreateLobbyGuestOnThisDevice) {
      setGuestSubMode('create_new');
    }
  }, [guestLocalAccounts, selectedGuestId, canCreateLobbyGuestOnThisDevice, deviceLobbyGuestAccount, guestSubMode]);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleUser]);

  useEffect(() => {
    if (activeTargetAccount) {
      const used = activeTargetAccount.failedPinAttempts || 0;
      setRemainingPinTries(Math.max(0, 5 - used));
    }
    setForgotPinOwnerVerified(false);
    setForgotPinVerifyNik('');
    setForgotPinVerifySecondary('');
    setForgotPinVerifyError(null);
  }, [activeTargetAccount]);

  // Kredensial sekali tampil HANYA untuk sesi pendaftaran yang baru saja selesai dikirim (tidak pernah dimuat ulang dari perangkat)
  const oneTimeCreatedAccountSummary = newlyCreatedAccountSummary;

  // Ticker 1 detik untuk hitung mundur Kunci Login 1 Hari (24 Jam) akibat salah PIN 5x
  const [loginLockNowMs, setLoginLockNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => {
      setLoginLockNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const getAccountLoginLockInfo = (acc: BankAccount | null | undefined) => {
    if (!acc || acc.isOfficialAdminAccount || !acc.loginLockedUntil) {
      return { isLocked: false, remainingMs: 0, formattedCountdown: '' };
    }
    const lockUntilMs = new Date(acc.loginLockedUntil).getTime();
    if (!Number.isFinite(lockUntilMs) || lockUntilMs <= loginLockNowMs) {
      return { isLocked: false, remainingMs: 0, formattedCountdown: '' };
    }
    const diffSec = Math.max(0, Math.ceil((lockUntilMs - loginLockNowMs) / 1000));
    const hours = Math.floor(diffSec / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    const formattedCountdown = `${String(hours).padStart(2, '0')} Jam : ${String(minutes).padStart(
      2,
      '0'
    )} Menit : ${String(seconds).padStart(2, '0')} Detik`;
    return {
      isLocked: true,
      remainingMs: lockUntilMs - loginLockNowMs,
      formattedCountdown,
    };
  };

  const renderLoginLock1DayBox = (targetAcc: BankAccount | null | undefined) => {
    const lockInfo = getAccountLoginLockInfo(targetAcc);
    if (!lockInfo.isLocked || !targetAcc) return null;
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/95 via-slate-950 to-amber-950/80 border-2 border-rose-500/70 shadow-xl space-y-2.5 text-left">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-400/50 text-rose-200 text-[11px] font-black uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            Tidak Bisa Login 1 Hari (24 Jam)
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
            Kartu Tetap Aktif (Tidak Dibanned)
          </span>
        </div>

        <p className="text-xs font-extrabold text-white">
          Akun &ldquo;{targetAcc.fullName}&rdquo; Terkunci Login Sementara karena Salah PIN 5x
        </p>

        <p className="text-[11px] text-rose-100/90 leading-relaxed">
          Anda telah salah memasukkan PIN Kartu sebanyak <strong>5 kali</strong>. Sesuai kebijakan keamanan, akun ini{' '}
          <strong>tidak bisa login selama 1 hari (24 jam)</strong> dan{' '}
          <strong>tidak dapat diajukan tinjauan/banding</strong>. Kartu Anda tidak dibanned dan akses login akan terbuka otomatis setelah hitung mundur selesai.
        </p>

        <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-400/40 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400 animate-spin" />
            <span>Sisa Waktu Kunci Login:</span>
          </span>
          <span className="font-mono tabular-nums text-xs sm:text-sm font-black text-amber-300 tracking-wide">
            {lockInfo.formattedCountdown}
          </span>
        </div>
      </div>
    );
  };

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

  const handleConnectOptionalGoogleInCreateForm = async () => {
    setAuthError(null);
    setCreateAccountFeedbackMsg(null);
    setIsLinkingOptionalGoogleInForm(true);
    try {
      const res = await signInWithGooglePopup();
      if (res.success && res.user?.email) {
        setCreateOptionalGoogleEmail(res.user.email);
        if (!createFullName.trim() && res.user.displayName) {
          setCreateFullName(res.user.displayName);
        }
        setCreateAccountFeedbackMsg(
          `Email Google ${res.user.email} siap disambungkan otomatis saat akun dibuat.`
        );
      } else if (!res.success && res.errorCode !== 'auth/popup-closed-by-user') {
        setAuthError({ code: res.errorCode, message: res.message });
      }
    } finally {
      setIsLinkingOptionalGoogleInForm(false);
    }
  };

  const handleCreateStandaloneAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setCreateAccountFeedbackMsg(null);

    if (!canCreateLobbyRegularAccountOnThisDevice) {
      setAuthError({
        message:
          'Batas maksimal 1 pembuatan akun lewat tab Buat Akun di perangkat ini sudah terpakai. Silakan masuk melalui kartu kredensial di bawah atau tab Login Ke Akun.',
      });
      return;
    }

    if (!createFullName.trim()) {
      setAuthError({ message: 'Nama Lengkap sesuai identitas wajib diisi.' });
      return;
    }
    if (!/^\d{16}$/.test(createNik.trim())) {
      setAuthError({ message: 'NIK wajib terdiri dari tepat 16 digit angka.' });
      return;
    }
    if (createPhone.trim().length < 9) {
      setAuthError({ message: 'Nomor HP tidak valid (minimal 9 digit).' });
      return;
    }
    const addrCheck = validateStructuredAddress(createStructuredAddress);
    if (!addrCheck.valid && !createAddress.trim()) {
      setAuthError({
        message:
          addrCheck.message ||
          'Alamat domisili 38 Provinsi wajib dipilih berurutan dari Provinsi hingga RT/RW.',
      });
      return;
    }
    if (createStructuredAddress.provinceName && !addrCheck.valid) {
      setAuthError({
        message:
          addrCheck.message ||
          'Alamat domisili 38 Provinsi wajib dilengkapi hingga RT/RW.',
      });
      return;
    }
    const pinValidation = validateStrongPin(createPin.trim());
    if (!pinValidation.valid) {
      setAuthError({
        message: pinValidation.reason || 'PIN Kartu wajib terdiri dari tepat 6 digit angka yang kuat.',
      });
      return;
    }
    if (createPin.trim() !== createConfirmPin.trim()) {
      setAuthError({ message: 'Konfirmasi PIN 6 Digit tidak cocok.' });
      return;
    }

    const res = registerLobbyStandaloneAccount({
      fullName: createFullName.trim(),
      nik: createNik.trim(),
      phone: createPhone.trim(),
      address: createAddress.trim(),
      structuredAddress: createStructuredAddress.provinceName
        ? createStructuredAddress
        : undefined,
      pin: createPin.trim(),
      optionalGoogleEmail: createOptionalGoogleEmail || undefined,
    });

    if (!res.success) {
      setAuthError({ message: res.message });
      return;
    }

    if (res.account) {
      setNewlyCreatedAccountSummary(res.account);
      setCreateAccountFeedbackMsg(res.message);
    }
  };

  const handleCopyCredentialValue = (label: string, val: string) => {
    try {
      navigator.clipboard.writeText(val);
      setCopiedCredentialField(label);
      setTimeout(() => setCopiedCredentialField(null), 2200);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleLinkCreatedSummaryAccountToGoogle = async (accountId: string) => {
    setAuthError(null);
    setCreateAccountFeedbackMsg(null);
    setIsLinkingExistingCreatedAccountGoogle(true);
    try {
      const res = await linkCurrentAccountWithGooglePopup(accountId);
      if (res.success) {
        setCreateAccountFeedbackMsg(res.message);
      } else if (res.errorCode !== 'auth/popup-closed-by-user') {
        setAuthError({ code: res.errorCode, message: res.message });
      }
    } finally {
      setIsLinkingExistingCreatedAccountGoogle(false);
    }
  };

  const handleStandardLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsStdSubmitting(true);
    try {
      const res = await loginWithStandardAccount({
        accountNumber: stdAccountNumber,
        userId16: stdUserId16,
        cardPin: stdCardPin,
      });
      if (!res.success) {
        setAuthError({ message: res.message });
      }
    } finally {
      setIsStdSubmitting(false);
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

    if (!canCreateLobbyGuestOnThisDevice) {
      setAuthError({
        message:
          'Batas maksimal 1 Akun Guest per perangkat di Lobi awal sudah digunakan. Silakan masuk ke Akun Guest tersimpan Anda.',
      });
      return;
    }

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
      pin: cleanPin,
      initialDeposit: 0,
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
    const addrCheck = validateStructuredAddress(structuredAddress);
    if (!addrCheck.valid && !address.trim()) {
      setErrorMsg(
        addrCheck.message || 'Alamat domisili wajib diisi berurutan dari Provinsi hingga RT/RW.'
      );
      return;
    }
    if (structuredAddress.provinceName && !addrCheck.valid) {
      setErrorMsg(
        addrCheck.message || 'Alamat domisili wajib diisi berurutan dari Provinsi hingga RT/RW.'
      );
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

    const res = registerCard({
      fullName: fullName.trim(),
      nik: nik.trim(),
      phone: phone.trim(),
      email: googleUser?.email || 'nasabah@gmail.com',
      address: address.trim(),
      structuredAddress: structuredAddress.provinceName ? structuredAddress : undefined,
      pin: pin.trim(),
      cardTier: 'regular',
      initialDeposit: 0,
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

  // KOMPONEN BAR 5 TAB LOGIN YANG SELALU TAMPIL DI SEMUA LAYAR MASUK:
  // Urutan Pasti: 1. Google | 2. Buat Akun | 3. Login Ke Akun | 4. OA | 5. Guest
  const renderPersistentThreeLoginTabs = () => (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-slate-300">
          Pilih Metode Masuk (5 Jalur Resmi)
        </span>
        <span className="text-[10px] font-mono tabular-nums text-emerald-300">
          Privasi Lobi Ketat · Wajib PIN
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-slate-950/95 border border-slate-700/90 shadow-inner">
        <button
          type="button"
          onClick={() => {
            setLobbyMode('google');
            setAuthError(null);
          }}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
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
            setLobbyMode('create_account');
            setAuthError(null);
          }}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            lobbyMode === 'create_account'
              ? 'bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25'
              : 'text-purple-300 hover:text-purple-200 hover:bg-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">2. Buat Akun</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLobbyMode('standard_login');
            setAuthError(null);
          }}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            lobbyMode === 'standard_login'
              ? 'bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 text-slate-950 shadow-lg shadow-sky-500/25'
              : 'text-sky-300 hover:text-sky-200 hover:bg-slate-900'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">3. Login Ke Akun</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLobbyMode('oa_login');
            setAuthError(null);
          }}
          className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            lobbyMode === 'oa_login'
              ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'text-amber-300 hover:text-amber-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">4. OA</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setLobbyMode('guest_login');
            setGuestSubMode(
              guestLocalAccounts.length > 0 || !canCreateLobbyGuestOnThisDevice
                ? 'choose_existing'
                : 'create_new'
            );
            setAuthError(null);
          }}
          className={`col-span-2 sm:col-span-1 py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
            lobbyMode === 'guest_login'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25'
              : 'text-emerald-300 hover:text-emerald-200 hover:bg-slate-900'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">5. Guest</span>
        </button>
      </div>
    </div>
  );

  // Tombol Kembali di Pojok Kiri Atas Lobi (hanya aktif saat masuk Lobi dari menu Ganti Akun)
  const renderTopLeftQuickReturnButton = () => {
    if (!quickSwitchReturnSnapshot) return null;
    return (
      <div className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50">
        <button
          type="button"
          onClick={() => {
            const res = returnToPreviousAccountFromSwitch();
            if (!res.success) {
              setAuthError({ message: res.message });
            }
          }}
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-white border border-cyan-400/50 shadow-xl shadow-slate-950/60 backdrop-blur-md inline-flex items-center gap-2 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap max-w-[240px] sm:max-w-[300px]"
          title={`Kembali ke Dashboard ${quickSwitchReturnSnapshot.fullName}`}
        >
          <ArrowLeft className="w-4 h-4 text-cyan-300 shrink-0" />
          <span className="truncate">Kembali · {quickSwitchReturnSnapshot.fullName}</span>
        </button>
      </div>
    );
  };

  // JIKA PENGGUNA MEMILIH TAB "2. BUAT AKUN", "3. LOGIN KE AKUN", "4. OA", ATAU "5. GUEST"
  if (
    lobbyMode === 'create_account' ||
    lobbyMode === 'standard_login' ||
    lobbyMode === 'oa_login' ||
    lobbyMode === 'guest_login'
  ) {
    const selectedGuestAccount =
      guestLocalAccounts.find((g) => g.id === selectedGuestId) || guestLocalAccounts[0] || null;
    const summaryTargetAccount = oneTimeCreatedAccountSummary;
    const cleanStdAccNum = stdAccountNumber.replace(/\D/g, '');
    const cleanStdUid16 = stdUserId16.replace(/\D/g, '');
    const matchedStdAccount =
      accounts.find(
        (a) =>
          !a.isOfficialAdminAccount &&
          ((cleanStdAccNum.length >= 6 &&
            a.accountNumber.replace(/\D/g, '') === cleanStdAccNum) ||
            (cleanStdUid16.length === 16 &&
              ensureAccountUserId16(a) === cleanStdUid16))
      ) || null;
    const summaryAccountHasRealGoogle =
      summaryTargetAccount &&
      Boolean(
        summaryTargetAccount.googleEmail &&
          !summaryTargetAccount.googleEmail.endsWith('@banknusantara.local') &&
          !summaryTargetAccount.googleEmail.endsWith('@guest.banknusantara.local')
      );

    return (
      <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-4 pt-16 sm:pt-4 relative overflow-hidden">
        {renderTopLeftQuickReturnButton()}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative z-10 max-h-[95dvh] overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex flex-col items-center text-center mb-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-cyan-500/25 border border-white/20 mb-2">
              <Landmark className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Bank Nusantara Digital
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Google · Buat Akun · Login Ke Akun · OA · Guest
            </p>
          </div>

          {renderPersistentThreeLoginTabs()}

          {lobbyMode === 'create_account' ? (
            /* TAB 2: BUAT AKUN (TANPA WAJIB GOOGLE + OPSIONAL SAMBUNGKAN GOOGLE, ALAMAT 38 PROVINSI, KARTU REGULER, SALDO Rp 0, MENUNGGU PERSETUJUAN ADMIN, MAKS 1 AKUN PER PERANGKAT) */
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 border border-purple-500/40 rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <span className="text-xs font-extrabold text-purple-200 flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Buat Akun Baru (Tanpa Wajib Google · Opsional Sambungkan Google)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-purple-950/90 border border-purple-500/40 text-purple-200">
                    Maks. 1 Akun / Perangkat
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Daftar rekening baru dengan <strong>Nama, NIK 16 Digit, Nomor HP, PIN 6 Digit, dan Alamat 38 Provinsi</strong>. Otomatis mendapatkan <strong>Kartu Reguler</strong> (bisa upgrade di Dashboard), <strong>Saldo Awal Rp 0</strong>, dan status <strong>Menunggu Persetujuan Admin</strong>.
                </p>
              </div>

              {createAccountFeedbackMsg && (
                <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{createAccountFeedbackMsg}</span>
                </div>
              )}

              {summaryTargetAccount ? (
                /* TAMPILAN KREDENSIAL SEKALI TAMPIL SAAT SELESAI DAFTAR (HILANG PERMANEN SAAT DITUTUP) */
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950/70 to-purple-950/60 border border-purple-400/50 shadow-xl space-y-3.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/50 text-amber-200 text-[11px] font-black">
                        <Lock className="w-3.5 h-3.5 text-amber-300" />
                        Kredensial Sekali Tampil — Catat Sekarang
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                        Pendaftaran Terkirim
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-100/90 leading-relaxed bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5">
                      Demi keamanan dari orang asing di perangkat bersama, data ini <strong>hanya ditampilkan sekali</strong>. Setelah layar ini ditutup, Anda wajib login manual di tab <strong>Login Ke Akun</strong> menggunakan No. Rekening, User ID 16 Digit, dan PIN Kartu 6 Digit Anda. Status persetujuan kartu akan tampil aman di dalam Dashboard setelah login PIN.
                    </p>

                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <UserId16AboveNameBanner
                          account={summaryTargetAccount}
                          size="sm"
                          masked={maskLobbyNumbers}
                        />
                        <button
                          type="button"
                          onClick={() => setMaskLobbyNumbers((p) => !p)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-cyan-300 hover:text-white cursor-pointer shrink-0"
                        >
                          {maskLobbyNumbers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{maskLobbyNumbers ? 'Tampilkan' : 'Sensor'}</span>
                        </button>
                      </div>
                      <p className="text-base font-black text-white mt-1">
                        {summaryTargetAccount.fullName}
                      </p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Kartu Reguler · Saldo Awal:{' '}
                        <strong className="text-emerald-300">
                          {formatRupiah(summaryTargetAccount.balance)}
                        </strong>
                      </p>
                    </div>

                    {/* Kotak Salin Nomor Rekening & User ID 16 Digit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Nomor Rekening (10 Digit)
                          </p>
                          <p className="text-sm font-mono tabular-nums font-black text-amber-300 tracking-wider mt-0.5">
                            {formatAccountNumberDisplay(
                              summaryTargetAccount.accountNumber,
                              maskLobbyNumbers
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCredentialValue(
                              'norek',
                              summaryTargetAccount.accountNumber
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedCredentialField === 'norek' ? 'Tersalin!' : 'Salin'}</span>
                        </button>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            User ID 16 Digit
                          </p>
                          <p className="text-xs font-mono tabular-nums font-black text-cyan-300 tracking-wider mt-0.5">
                            {formatUserId16Display(
                              ensureAccountUserId16(summaryTargetAccount),
                              maskLobbyNumbers
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyCredentialValue(
                              'userid16',
                              ensureAccountUserId16(summaryTargetAccount)
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            {copiedCredentialField === 'userid16' ? 'Tersalin!' : 'Salin'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Tombol Salin No. Rek & ID 16 Digit (TANPA menyalin PIN ke clipboard) */}
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCredentialValue(
                          'all_creds',
                          `Nama: ${summaryTargetAccount.fullName}\nNo. Rekening: ${summaryTargetAccount.accountNumber}\nUser ID 16 Digit: ${ensureAccountUserId16(summaryTargetAccount)}`
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-purple-400/40 text-purple-200 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Copy className="w-4 h-4 text-purple-300" />
                      <span>
                        {copiedCredentialField === 'all_creds'
                          ? 'No. Rekening & User ID 16 Digit Tersalin!'
                          : 'Salin No. Rekening & User ID 16 Digit (PIN Tetap Rahasia)'}
                      </span>
                    </button>

                    {/* Status / Tombol Opsional Sambungkan ke Google */}
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>Status Sambungan Google:</span>
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5 break-all">
                          {summaryAccountHasRealGoogle ? (
                            <span className="text-emerald-300 font-bold">
                              Tersambung ke {summaryTargetAccount.googleEmail}
                            </span>
                          ) : (
                            <span className="text-amber-300">
                              Belum disambungkan ke Google (Opsional — bisa disambungkan sekarang atau nanti di Dashboard)
                            </span>
                          )}
                        </p>
                      </div>
                      {!summaryAccountHasRealGoogle && (
                        <button
                          type="button"
                          onClick={() =>
                            handleLinkCreatedSummaryAccountToGoogle(summaryTargetAccount.id)
                          }
                          disabled={isLinkingExistingCreatedAccountGoogle}
                          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition shrink-0 disabled:opacity-60"
                        >
                          {isLinkingExistingCreatedAccountGoogle ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Sambungkan ke Google</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Aksi Aman: Hapus Kredensial dari Layar Lobi & Arahkan Login Manual Ber-PIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNewlyCreatedAccountSummary(null);
                        setCreateAccountFeedbackMsg(null);
                        setLobbyMode('google');
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saya Sudah Catat &amp; Tutup Layar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNewlyCreatedAccountSummary(null);
                        setCreateAccountFeedbackMsg(null);
                        setStdAccountNumber('');
                        setStdUserId16('');
                        setStdCardPin('');
                        setLobbyMode('standard_login');
                        setAuthError(null);
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-sky-500/40 text-sky-300 font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Login Manual (Wajib PIN)</span>
                    </button>
                  </div>
                </div>
              ) : !canCreateLobbyRegularAccountOnThisDevice ? (
                <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-700/80 space-y-3 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 text-amber-300 flex items-center justify-center mx-auto">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-extrabold text-white">
                    Batas Pendaftaran Rekening di Perangkat Ini Tercapai
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Demi privasi dan keamanan pemilik akun, Lobi Daftar tidak menampilkan nama, nomor rekening, atau status kartu siapa pun. Silakan masuk secara aman melalui tab <strong>Login Ke Akun</strong> dengan No. Rekening, User ID 16 Digit, dan PIN Kartu 6 Digit Anda.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLobbyMode('standard_login');
                      setAuthError(null);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Buka Tab Login Ke Akun (Wajib PIN)</span>
                  </button>
                </div>
              ) : (
                /* FORMULIR PENDAFTARAN TAB 2: BUAT AKUN BARU */
                <form onSubmit={handleCreateStandaloneAccountSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>1. Nama Lengkap Sesuai KTP *</span>
                      </label>
                      <input
                        type="text"
                        value={createFullName}
                        onChange={(e) => setCreateFullName(e.target.value)}
                        placeholder="Masukkan Nama Lengkap"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                          <span>2. NIK (16 Digit) *</span>
                        </span>
                        <span className="text-[10px] font-mono text-cyan-300">
                          {createNik.length}/16
                        </span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        value={createNik}
                        onChange={(e) =>
                          setCreateNik(e.target.value.replace(/\D/g, '').slice(0, 16))
                        }
                        placeholder="16 Digit NIK KTP"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono tabular-nums font-bold text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>3. Nomor HP Aktif *</span>
                      </label>
                      <input
                        type="text"
                        inputMode="tel"
                        maxLength={15}
                        value={createPhone}
                        onChange={(e) =>
                          setCreatePhone(e.target.value.replace(/\D/g, '').slice(0, 15))
                        }
                        placeholder="0812xxxxxxxx"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono tabular-nums font-bold text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>4. Buat PIN (6 Digit) *</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCreatePin ? 'text' : 'password'}
                          inputMode="numeric"
                          maxLength={6}
                          value={createPin}
                          onChange={(e) =>
                            setCreatePin(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          placeholder="6 Digit Angka"
                          required
                          className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono tabular-nums font-bold tracking-widest text-white focus:border-purple-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePin((p) => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        >
                          {showCreatePin ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Konfirmasi PIN *</span>
                      </label>
                      <input
                        type={showCreatePin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        value={createConfirmPin}
                        onChange={(e) =>
                          setCreateConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        placeholder="Ulangi 6 Digit PIN"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono tabular-nums font-bold tracking-widest text-white focus:border-purple-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 5. Alamat Domisili 38 Provinsi Indonesia */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
                    <IndonesiaAddressPicker
                      value={createStructuredAddress}
                      formattedAddress={createAddress}
                      onChange={(formatted, nextStruct) => {
                        setCreateAddress(formatted);
                        setCreateStructuredAddress(nextStruct);
                      }}
                      enableGoogleMapsTab={true}
                      label="5. Alamat Domisili 38 Provinsi Indonesia (Provinsi → Desa → Kode Pos → RT/RW) *"
                    />
                  </div>

                  {/* Info Kartu Reguler, Saldo Rp 0, Status Menunggu Persetujuan Admin */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Jenis Kartu Awal</p>
                      <p className="text-xs font-black text-cyan-300 mt-0.5">
                        Kartu Reguler
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Saldo Awal</p>
                      <p className="text-xs font-mono font-black text-emerald-400 mt-0.5">
                        Rp 0 (Otomatis)
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold">Status Aktivasi</p>
                      <p className="text-[11px] font-black text-amber-300 mt-0.5">
                        Persetujuan Admin
                      </p>
                    </div>
                  </div>

                  {/* Opsi Sambungkan ke Google (Opsional) di Dalam Form */}
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-cyan-500/30 flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-cyan-200 flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Sambungkan ke Akun Google (Opsional)</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {createOptionalGoogleEmail ? (
                          <span className="text-emerald-300 font-bold">
                            Terpilih: {createOptionalGoogleEmail} (Siap ditautkan otomatis)
                          </span>
                        ) : (
                          'Anda bisa melewati langkah ini dan menyambungkan Google kapan saja di Dashboard.'
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {createOptionalGoogleEmail && (
                        <button
                          type="button"
                          onClick={() => setCreateOptionalGoogleEmail('')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
                        >
                          Lepas
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleConnectOptionalGoogleInCreateForm}
                        disabled={isLinkingOptionalGoogleInForm}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer transition disabled:opacity-60"
                      >
                        {isLinkingOptionalGoogleInForm ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                        ) : (
                          <Link2 className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>
                          {createOptionalGoogleEmail ? 'Ganti Email Google' : 'Sambungkan Google'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-purple-500/25 transition cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Buat Akun Kartu Reguler Sekarang</span>
                  </button>
                </form>
              )}
            </div>
          ) : lobbyMode === 'standard_login' ? (
            /* FORM LOGIN KE AKUN (NO. REK + USER ID 16 DIGIT + PIN KARTU — SEMUA AKUN KECUALI AKUN OA) */
            <form onSubmit={handleStandardLoginSubmit} className="space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/35 rounded-2xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <LogIn className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-extrabold text-sky-200">
                    Login Ke Akun (Semua Akun Kecuali Akun OA)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Masukkan <strong>Nomor Rekening</strong>, <strong>User ID 16 Digit</strong>, dan{' '}
                  <strong>PIN Kartu 6 Digit</strong> untuk masuk ke Akun hasil tab Buat Akun, Akun Guest, maupun Akun Google. Khusus Akun OA wajib lewat tab <strong>OA</strong>.
                </p>
              </div>

              {renderLoginLock1DayBox(matchedStdAccount)}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  1. Nomor Rekening *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stdAccountNumber}
                  onChange={(e) => setStdAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Masukkan Nomor Rekening (10 Digit)"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tabular-nums font-bold text-white focus:border-sky-400 focus:outline-none tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-sky-400" />
                    2. User ID 16 Digit *
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-sky-300">
                    {stdUserId16.replace(/\D/g, '').length}/16 Digit
                  </span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={stdUserId16
                    .replace(/\D/g, '')
                    .slice(0, 16)
                    .replace(/(\d{4})(?=\d)/g, '$1 ')}
                  onChange={(e) => setStdUserId16(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="XXXX XXXX XXXX XXXX (16 Digit)"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tabular-nums font-bold text-sky-300 focus:border-sky-400 focus:outline-none tracking-widest"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  3. PIN Kartu (6 Digit) *
                </label>
                <div className="relative">
                  <input
                    type={showStdCardPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={6}
                    value={stdCardPin}
                    onChange={(e) => setStdCardPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="••••••"
                    required
                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono tabular-nums font-bold text-white focus:border-emerald-400 focus:outline-none tracking-[0.35em]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStdCardPin((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showStdCardPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isStdSubmitting || getAccountLoginLockInfo(matchedStdAccount).isLocked}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/20 transition cursor-pointer disabled:opacity-60"
              >
                {isStdSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Rekening &amp; PIN...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Masuk Ke Akun Sekarang</span>
                  </>
                )}
              </button>
            </form>
          ) : lobbyMode === 'oa_login' ? (
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
                  Masukkan keempat kredensial Akun OA Anda. Setelah masuk, Anda juga dapat menyambungkan Akun OA ke email Google melalui tombol <strong>"Hubungkan Google"</strong> di bagian atas Navbar.
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
            /* MODE 5: LOGIN LEWAT GUEST (MAKS 1 PER PERANGKAT DI LOBI, TANPA ALAMAT, SALDO AWAL Rp 0) */
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4" />
                    <span>Login Lewat Guest (Maks. 1 Akun Guest di Lobi Awal)</span>
                  </span>
                  {guestLocalAccounts.length > 0 && canCreateLobbyGuestOnThisDevice && (
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
                        ? '+ Buat 1 Guest Baru'
                        : `Pilih Guest Tersimpan (${guestLocalAccounts.length})`}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Akun Guest dibuat cepat <strong>tanpa perlu mengisi alamat</strong> dengan saldo awal otomatis{' '}
                  <strong className="text-emerald-300">Rp 0</strong>. Setiap perangkat hanya dapat membuat maksimal{' '}
                  <strong>1 Akun Guest</strong> di Lobi awal (sedangkan pembuatan dari Panel Admin tidak dibatasi).
                </p>
              </div>

              {!canCreateLobbyGuestOnThisDevice && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 text-[11px] text-amber-200 flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Kuota pembuatan <strong>1 Akun Guest</strong> di Lobi awal untuk perangkat ini sudah terpakai
                    {deviceLobbyGuestAccount ? ` (${deviceLobbyGuestAccount.fullName})` : ''}. Silakan masuk ke Akun Guest Anda di bawah ini atau gunakan <strong>Login Ke Akun</strong>.
                  </span>
                </div>
              )}

              {(guestSubMode === 'choose_existing' || !canCreateLobbyGuestOnThisDevice) &&
              guestLocalAccounts.length > 0 ? (
                <form onSubmit={handleGuestPinLoginSubmit} className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-emerald-300">
                      Pilih Akun Guest Tersimpan:
                    </span>
                    <button
                      type="button"
                      onClick={() => setMaskLobbyNumbers((p) => !p)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-cyan-300 hover:text-white cursor-pointer"
                    >
                      {maskLobbyNumbers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{maskLobbyNumbers ? 'Tampilkan Nomor' : 'Sensor Nomor'}</span>
                    </button>
                  </div>
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
                            <UserId16AboveNameBanner
                              account={gAcc}
                              size="xs"
                              masked={maskLobbyNumbers}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="text-xs font-black text-white flex items-center gap-1.5">
                                <span>{gAcc.fullName}</span>
                                <span className="text-[10px] font-mono text-emerald-300">
                                  · {gAcc.createdByAdmin ? 'Guest Admin' : 'Guest Lobi'}
                                </span>
                              </p>
                              <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                                No. Rek:{' '}
                                <strong className="text-amber-300">
                                  {formatAccountNumberDisplay(gAcc.accountNumber, maskLobbyNumbers)}
                                </strong>{' '}
                                · Saldo:{' '}
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

                  {renderLoginLock1DayBox(selectedGuestAccount)}

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
                        disabled={getAccountLoginLockInfo(selectedGuestAccount).isLocked}
                        className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-center text-base font-mono tabular-nums font-bold tracking-[0.4em] text-white focus:border-emerald-400 focus:outline-none disabled:opacity-50"
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
                    disabled={
                      guestPinInput.length !== 6 ||
                      getAccountLoginLockInfo(selectedGuestAccount).isLocked
                    }
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Lanjutkan Masuk ke Akun Guest Ini</span>
                  </button>

                  {canCreateLobbyGuestOnThisDevice && (
                    <button
                      type="button"
                      onClick={() => {
                        setGuestSubMode('create_new');
                        setAuthError(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Buat 1 Kartu Reguler Guest Baru</span>
                    </button>
                  )}
                </form>
              ) : (
                /* BUAT 1 KARTU REGULER GUEST BARU (TANPA ALAMAT, SALDO AWAL Rp 0) */
                <form onSubmit={handleQuickCreateGuestCardSubmit} className="space-y-3.5">
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Buat Akun Guest Baru (Tanpa Alamat)</span>
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300">
                        Kartu Reguler · Maks 1
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
                            PIN Kartu Guest (6 Digit) *
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
                            className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/50 text-xs font-mono tabular-nums font-black tracking-widest text-emerald-300 focus:border-emerald-400 focus:outline-none"
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

                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Saldo Awal Pembukaan</span>
                      <span className="font-mono tabular-nums font-black text-emerald-400">
                        Rp 0 (Otomatis)
                      </span>
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
                          ? 'Sembunyikan Detail Identitas Opsional (NIK & No. HP)'
                          : 'Atur NIK & No. HP (Opsional — Otomatis Terisi)'}
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
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono tabular-nums text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">
                            No. HP
                          </label>
                          <input
                            type="text"
                            maxLength={15}
                            value={guestPhone}
                            onChange={(e) =>
                              setGuestPhone(e.target.value.replace(/\D/g, '').slice(0, 15))
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono tabular-nums text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition cursor-pointer"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Buka Kartu Reguler Guest &amp; Masuk Sekarang</span>
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
      <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-4 pt-16 sm:pt-4 relative overflow-hidden">
        {renderTopLeftQuickReturnButton()}
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
              Pilih salah satu dari <strong>5 jalur resmi</strong> di bawah ini:
            </p>
          </div>

          {renderPersistentThreeLoginTabs()}

          <div className="space-y-3">
            {/* Tombol Utama 1: Sign in with Google */}
            <button
              type="button"
              onClick={handleGooglePopupSignIn}
              disabled={isSigningIn}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl transition cursor-pointer disabled:opacity-60"
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

            {/* Tombol Utama 2 (TEPAT DI ATAS LOGIN KE AKUN): Buat Akun */}
            <button
              type="button"
              onClick={() => {
                setLobbyMode('create_account');
                setAuthError(null);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-purple-500/20 transition cursor-pointer"
            >
              <UserPlus className="w-5 h-5 text-white" />
              <span>
                2. Buat Akun (Tanpa Wajib Google · Opsional Google)
              </span>
            </button>

            {/* Tombol Utama 3: Login Ke Akun */}
            <button
              type="button"
              onClick={() => {
                setLobbyMode('standard_login');
                setAuthError(null);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 hover:from-indigo-400 hover:to-cyan-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-sky-500/20 transition cursor-pointer"
            >
              <LogIn className="w-5 h-5 text-slate-950" />
              <span>3. Login Ke Akun (No. Rek, User ID &amp; PIN Kartu)</span>
            </button>

            {/* Tombol Utama 4: Login Dengan Akun OA */}
            <button
              type="button"
              onClick={() => {
                setLobbyMode('oa_login');
                setAuthError(null);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5 text-slate-950" />
              <span>4. Login Dengan Akun OA (Buatan Panel Admin)</span>
            </button>

            {/* Tombol Utama 5: Login Lewat Guest */}
            <button
              type="button"
              onClick={() => {
                setLobbyMode('guest_login');
                setGuestSubMode(
                  guestLocalAccounts.length > 0 || !canCreateLobbyGuestOnThisDevice
                    ? 'choose_existing'
                    : 'create_new'
                );
                setAuthError(null);
              }}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/20 transition cursor-pointer"
            >
              <HardDrive className="w-5 h-5 text-slate-950" />
              <span>
                5. Login Lewat Guest (
                {canCreateLobbyGuestOnThisDevice
                  ? 'Maks. 1 Akun · Tanpa Alamat'
                  : `${guestLocalAccounts.length} Tersimpan`}
                )
              </span>
            </button>

            {/* Informasi 5 Fitur Login */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">1. Sign in with Google:</strong> Pendaftaran baru otomatis Kartu Reguler dengan saldo awal <strong>Rp 0</strong> dan alamat resmi wilayah Indonesia.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <UserPlus className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-purple-300">2. Buat Akun:</strong> Daftar akun baru tanpa wajib Google (Nama, NIK, HP, PIN 6 Digit &amp; Alamat 38 Provinsi), Kartu Reguler, Rp 0, dan opsional sambungkan ke Google.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <LogIn className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-sky-300">3. Login Ke Akun:</strong> Masuk dengan <strong>No. Rekening, User ID 16 Digit &amp; PIN Kartu</strong> untuk semua akun kecuali Akun OA.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-300">4. Akun OA:</strong> Khusus Akun OA buatan Panel Admin (4 kredensial termasuk PIN Admin OA).
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300">
                <HardDrive className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-emerald-300">5. Guest:</strong> Maksimal 1 Akun Guest per perangkat di Lobi awal, tanpa perlu alamat, saldo awal Rp 0.
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
      <div className="min-h-screen bg-[#040814] text-slate-100 flex items-center justify-center p-4 pt-16 sm:pt-4 relative overflow-hidden">
        {renderTopLeftQuickReturnButton()}
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>
                  {linkedUserAccounts.length > 1
                    ? `Pilih Akun Rekening yang Ingin Anda Masuki (${linkedUserAccounts.length} Akun Terhubung):`
                    : 'Akun Rekening Terhubung ke Email Google Ini:'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setMaskLobbyNumbers((p) => !p)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-bold text-cyan-300 hover:text-white cursor-pointer shrink-0"
                title="Sensor atau tampilkan Nomor Rekening & ID 16 Digit saat memilih akun"
              >
                {maskLobbyNumbers ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>{maskLobbyNumbers ? 'Tampilkan' : 'Sensor'}</span>
              </button>
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
                      <UserId16AboveNameBanner account={acc} size="xs" masked={maskLobbyNumbers} />
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
                          No. Rek:{' '}
                          <span className="text-cyan-300 font-bold">
                            {formatAccountNumberDisplay(acc.accountNumber, maskLobbyNumbers)}
                          </span>{' '}
                          • Saldo:{' '}
                          <span className="text-emerald-300 font-bold">
                            {acc.cardTier === 'admin' || isUnlimitedNumber(acc.balance)
                              ? '∞'
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
              <strong className="text-cyan-300">
                {formatAccountNumberDisplay(activeTargetAccount.accountNumber, maskLobbyNumbers)}
              </strong>{' '}
              ({tierCfg.name}).
            </p>
            {!activeTargetAccount.isOfficialAdminAccount && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-300">
                <span>Sisa Kesempatan PIN: {remainingPinTries} / 5</span>
                <span className="text-rose-400">• (Salah 5x = Tidak Bisa Login 1 Hari Tanpa Banned)</span>
              </div>
            )}
          </div>

          {renderLoginLock1DayBox(activeTargetAccount)}

          <form onSubmit={handleVerifyExistingCardPin} className="space-y-3.5 mt-3">
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
                disabled={getAccountLoginLockInfo(activeTargetAccount).isLocked}
                className="w-full pl-10 pr-12 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-center text-lg font-mono tracking-[0.5em] text-white focus:border-cyan-400 focus:outline-none disabled:opacity-50"
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
              disabled={
                existingPinInput.length !== 6 ||
                getAccountLoginLockInfo(activeTargetAccount).isLocked
              }
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Verifikasi PIN &amp; Masuk ke &ldquo;{activeTargetAccount.fullName}&rdquo;</span>
            </button>
          </form>

          {/* Tombol Pintas Langsung ke Login Ke Akun, Akun OA & Guest di Bawah Form PIN */}
          <div className="mt-4 pt-3.5 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setLobbyMode('standard_login');
                setAuthError(null);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 hover:from-indigo-400 hover:to-sky-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Ke Akun</span>
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
              <span>Akun OA</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLobbyMode('guest_login');
                setGuestSubMode(
                  guestLocalAccounts.length > 0 || !canCreateLobbyGuestOnThisDevice
                    ? 'choose_existing'
                    : 'create_new'
                );
                setAuthError(null);
              }}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <HardDrive className="w-4 h-4" />
              <span>Login Guest</span>
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
                  forgotPinOwnerVerified ? (
                    <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold">Identitas Pemilik Terverifikasi</span>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotPinOwnerVerified(false);
                            setForgotPinVerifyNik('');
                            setForgotPinVerifySecondary('');
                          }}
                          className="text-[10px] font-bold text-amber-300 hover:text-white cursor-pointer"
                        >
                          Sembunyikan PIN
                        </button>
                      </div>
                      <p>
                        PIN Kartu Anda adalah:{' '}
                        <span className="font-mono font-black text-sm text-emerald-300 tracking-widest">
                          {latestResetReq.revealedPin}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="p-2.5 rounded-xl bg-amber-950/50 border border-amber-500/40 text-[11px] text-amber-200">
                        <strong className="block text-amber-300 mb-0.5">
                          Permohonan Lupa PIN Telah Disetujui Admin (Terkunci Privasi)
                        </strong>
                        Demi mencegah orang asing mengintip PIN Anda di Lobi, masukkan <strong>NIK 16 Digit</strong> dan <strong>Nomor HP atau User ID 16 Digit</strong> akun ini untuk membuka tampilan PIN.
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        value={forgotPinVerifyNik}
                        onChange={(e) => {
                          setForgotPinVerifyNik(e.target.value.replace(/\D/g, '').slice(0, 16));
                          setForgotPinVerifyError(null);
                        }}
                        placeholder="Masukkan NIK 16 Digit pemilik akun..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={16}
                        value={forgotPinVerifySecondary}
                        onChange={(e) => {
                          setForgotPinVerifySecondary(e.target.value.replace(/\D/g, '').slice(0, 16));
                          setForgotPinVerifyError(null);
                        }}
                        placeholder="Masukkan Nomor HP atau User ID 16 Digit..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                      />
                      {forgotPinVerifyError && (
                        <p className="text-[11px] text-rose-300 font-bold">{forgotPinVerifyError}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!activeTargetAccount) return;
                          const cleanNik = forgotPinVerifyNik.replace(/\D/g, '');
                          const cleanSec = forgotPinVerifySecondary.replace(/\D/g, '');
                          const accNik = (activeTargetAccount.nik || '').replace(/\D/g, '');
                          const accPhone = (activeTargetAccount.phone || '').replace(/\D/g, '');
                          const accUid16 = ensureAccountUserId16(activeTargetAccount).replace(/\D/g, '');
                          const nikMatches = cleanNik.length === 16 && cleanNik === accNik;
                          const secMatches =
                            (cleanSec.length >= 9 && cleanSec === accPhone) ||
                            (cleanSec.length === 16 && cleanSec === accUid16);
                          if (nikMatches && secMatches) {
                            setForgotPinOwnerVerified(true);
                            setForgotPinVerifyError(null);
                          } else {
                            setForgotPinVerifyError(
                              'Data verifikasi NIK 16 Digit atau Nomor HP/User ID 16 Digit tidak cocok dengan pemilik akun.'
                            );
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer"
                      >
                        Verifikasi Pemilik &amp; Tampilkan PIN Sementara
                      </button>
                    </div>
                  )
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
      <div className="min-h-screen bg-[#040814] text-slate-100 py-8 pt-16 sm:pt-8 px-4 flex items-center justify-center relative overflow-hidden">
        {renderTopLeftQuickReturnButton()}
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
    <div className="min-h-screen bg-[#040814] text-slate-100 py-8 pt-16 sm:pt-8 px-4 flex items-center justify-center relative overflow-hidden">
      {renderTopLeftQuickReturnButton()}
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
                Saldo Awal Pembukaan
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/35 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-xs text-slate-300">
                  <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Otomatis</span>
                </span>
                <span className="text-sm font-mono tabular-nums font-black text-emerald-400">
                  Rp 0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Saldo didapat setelah kartu aktif lewat Kerja, Transfer masuk, atau Admin.
              </p>
            </div>
          </div>

          <IndonesiaAddressPicker
            value={structuredAddress}
            formattedAddress={address}
            onChange={(formatted, struct) => {
              setAddress(formatted);
              setStructuredAddress(struct);
            }}
            enableGoogleMapsTab={true}
            label="Alamat Domisili Resmi (Provinsi → Desa → Kode Pos → RT/RW)"
          />

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
