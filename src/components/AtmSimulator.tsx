/**
 * Bank Nusantara Interactive ATM Machine Simulator
 * Updated with:
 * - Strict PIN Privacy (PIN tidak pernah dikasih tahu otomatis di layar ATM)
 * - Tombol "Lupa PIN?" -> Dikirim ke Tinjauan Admin -> Setelah disetujui Admin, PIN diberitahukan
 * - Animasi Mekanik Realistis (Animasi Masuk Kartu, Keluar Kartu, Hitung & Keluar Uang Tunai, Masuk Uang Setor Tunai, Cetak Struk)
 */
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Printer,
  DollarSign,
  CheckCircle,
  Volume2,
  VolumeX,
  Shield,
  KeyRound,
  RotateCw,
  LogOut,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah, playAtmSound, CARD_TIER_CONFIGS, SUPPORTED_BANKS } from '../utils/bankUtils';
import { Transaction } from '../types/bank';

type AtmScreen =
  | 'INSERT_CARD'
  | 'CARD_INSERTING_ANIM'
  | 'LANGUAGE'
  | 'ENTER_PIN'
  | 'MAIN_MENU'
  | 'CEK_SALDO'
  | 'TARIK_TUNAI_PRESET'
  | 'TARIK_TUNAI_CUSTOM'
  | 'SETOR_TUNAI'
  | 'TRANSFER_DEST_ACCOUNT'
  | 'TRANSFER_AMOUNT'
  | 'TRANSFER_CONFIRM'
  | 'TRANSFER_STATUS'
  | 'GANTI_PIN_OLD'
  | 'GANTI_PIN_NEW'
  | 'GANTI_PIN_CONFIRM'
  | 'MUTASI_REKENING'
  | 'CEK_NOMOR_REKENING'
  | 'GANTI_NOMOR_REKENING'
  | 'CETAK_ULANG_STRUK'
  | 'PROCESSING'
  | 'CASH_DISPENSED'
  | 'RECEIPT_VIEW'
  | 'CARD_EJECTED';

type HardwareAnimationType =
  | null
  | 'inserting_card'
  | 'ejecting_card'
  | 'dispensing_cash'
  | 'accepting_cash'
  | 'printing_receipt';

export const AtmSimulator: React.FC = () => {
  const {
    currentAccount,
    accounts,
    withdrawCash,
    depositCash,
    transferMoney,
    regenerateAccountNumberWithPin,
    changePin,
    reprintReceipts,
    lookupAccount,
    pinResetRequests,
    requestPinReset,
  } = useBank();

  const [screen, setScreen] = useState<AtmScreen>('INSERT_CARD');
  const [, setLanguage] = useState<'id' | 'en'>('id');
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');

  // Transfer state
  const [transferTargetBank, setTransferTargetBank] = useState<string>('Bank Nusantara');
  const [transferTargetAccount, setTransferTargetAccount] = useState<string>('');
  const [transferRecipientName, setTransferRecipientName] = useState<string>('');
  const [transferAmountInput, setTransferAmountInput] = useState<string>('');
  const [transferPinInput, setTransferPinInput] = useState<string>('');

  // Change PIN state
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmNewPinInput, setConfirmNewPinInput] = useState<string>('');

  // Physical states & mechanical animations
  const [cardInserted, setCardInserted] = useState<boolean>(false);
  const [hardwareAnim, setHardwareAnim] = useState<HardwareAnimationType>(null);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [dispensedCashAmount, setDispensedCashAmount] = useState<number>(0);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [isCashSlotOpen, setIsCashSlotOpen] = useState<boolean>(false);
  const [isReceiptPrinting, setIsReceiptPrinting] = useState<boolean>(false);
  const [screenMessage, setScreenMessage] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [forgotPinNotice, setForgotPinNotice] = useState<string>('');

  // Find latest PIN reset request for currentAccount
  const myPinResetRequest = currentAccount
    ? pinResetRequests.find((r) => r.accountId === currentAccount.id)
    : undefined;

  // Auto eject reset if needed
  useEffect(() => {
    if (screen === 'CARD_EJECTED') {
      setHardwareAnim('ejecting_card');
      const timer = setTimeout(() => {
        setHardwareAnim(null);
        setCardInserted(false);
        setPinInput('');
        setScreen('INSERT_CARD');
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const triggerBeep = () => {
    if (soundEnabled) playAtmSound('beep');
  };

  // Animated Card Insertion
  const handleInsertCard = () => {
    if (!currentAccount) return;
    if (currentAccount.cardStatus === 'banned') {
      if (soundEnabled) playAtmSound('alert');
      setScreenMessage(
        `🚫 KARTU DI-BANNED (${
          currentAccount.banInfo?.durationType === 'permanent'
            ? 'PERMANEN — Tidak Dapat Ditinjau Lagi'
            : `Durasi: ${currentAccount.banInfo?.durationLabel}`
        }). Tinjauan Alasan: ${
          currentAccount.banInfo?.reason || 'Tidak ada alasan spesifik (Opsional oleh Admin)'
        }`
      );
      return;
    }
    if (currentAccount.cardStatus === 'pending') {
      setScreenMessage('Kartu Anda sedang diproses oleh sistem bank. Harap menunggu hingga kartu selesai diproses.');
      return;
    }
    if (currentAccount.cardStatus === 'rejected') {
      setScreenMessage('Kartu ini telah ditolak. Silakan ajukan pendaftaran kartu baru.');
      return;
    }

    if (soundEnabled) playAtmSound('card');
    setHardwareAnim('inserting_card');
    setScreen('CARD_INSERTING_ANIM');

    setTimeout(() => {
      setCardInserted(true);
      setHardwareAnim(null);
      setScreen('LANGUAGE');
    }, 1600);
  };

  const handleSelectLanguage = (lang: 'id' | 'en') => {
    triggerBeep();
    setLanguage(lang);
    setPinInput('');
    setPinError('');
    setForgotPinNotice('');
    setScreen('ENTER_PIN');
  };

  const handleForgotPinClick = () => {
    if (!currentAccount) return;
    triggerBeep();
    const res = requestPinReset(
      currentAccount.id,
      'Nasabah menekan tombol Lupa PIN di Mesin ATM dan meminta tinjauan Admin untuk melihat PIN kartu.'
    );
    setForgotPinNotice(res.message);
  };

  const handleKeypadPress = (digit: string) => {
    triggerBeep();
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 180);

    if (screen === 'ENTER_PIN') {
      if (pinInput.length < 6) {
        const next = pinInput + digit;
        setPinInput(next);
        if (next.length === 6) {
          verifyAtmPin(next);
        }
      }
    } else if (screen === 'TARIK_TUNAI_CUSTOM') {
      if (customAmount.length < 9) {
        setCustomAmount((prev) => prev + digit);
      }
    } else if (screen === 'SETOR_TUNAI') {
      if (depositAmount.length < 9) {
        setDepositAmount((prev) => prev + digit);
      }
    } else if (screen === 'TRANSFER_DEST_ACCOUNT') {
      if (transferTargetAccount.length < 12) {
        setTransferTargetAccount((prev) => prev + digit);
      }
    } else if (screen === 'TRANSFER_AMOUNT') {
      if (transferAmountInput.length < 9) {
        setTransferAmountInput((prev) => prev + digit);
      }
    } else if (screen === 'TRANSFER_CONFIRM') {
      if (transferPinInput.length < 6) {
        setTransferPinInput((prev) => prev + digit);
      }
    } else if (screen === 'GANTI_PIN_OLD') {
      if (oldPinInput.length < 6) setOldPinInput((prev) => prev + digit);
    } else if (screen === 'GANTI_PIN_NEW') {
      if (newPinInput.length < 6) setNewPinInput((prev) => prev + digit);
    } else if (screen === 'GANTI_PIN_CONFIRM') {
      if (confirmNewPinInput.length < 6) setConfirmNewPinInput((prev) => prev + digit);
    }
  };

  const handleKeypadClear = () => {
    triggerBeep();
    if (screen === 'ENTER_PIN') setPinInput('');
    if (screen === 'TARIK_TUNAI_CUSTOM') setCustomAmount('');
    if (screen === 'SETOR_TUNAI') setDepositAmount('');
    if (screen === 'TRANSFER_DEST_ACCOUNT') setTransferTargetAccount('');
    if (screen === 'TRANSFER_AMOUNT') setTransferAmountInput('');
    if (screen === 'TRANSFER_CONFIRM') setTransferPinInput('');
    if (screen === 'GANTI_PIN_OLD') setOldPinInput('');
    if (screen === 'GANTI_PIN_NEW') setNewPinInput('');
    if (screen === 'GANTI_PIN_CONFIRM') setConfirmNewPinInput('');
  };

  const handleKeypadCancel = () => {
    triggerBeep();
    ejectCard();
  };

  const verifyAtmPin = (pin: string) => {
    if (!currentAccount) return;
    if (currentAccount.pin === pin) {
      if (soundEnabled) playAtmSound('success');
      setPinError('');
      setForgotPinNotice('');
      setScreen('MAIN_MENU');
    } else {
      if (soundEnabled) playAtmSound('alert');
      setPinError('PIN yang Anda masukkan SALAH! Jika lupa PIN, klik tombol "Lupa PIN?" di bawah untuk memproses pemulihan PIN.');
      setPinInput('');
    }
  };

  const ejectCard = () => {
    if (soundEnabled) playAtmSound('card');
    setScreen('CARD_EJECTED');
  };

  // Perform preset withdrawal with animation
  const handlePresetWithdraw = (amount: number) => {
    if (!currentAccount) return;
    triggerBeep();
    setHardwareAnim('dispensing_cash');
    setScreen('PROCESSING');

    setTimeout(() => {
      const res = withdrawCash(amount, currentAccount.pin);
      if (res.success) {
        setDispensedCashAmount(amount);
        setIsCashSlotOpen(true);
        setActiveReceipt(res.transaction || null);
        setScreen('CASH_DISPENSED');
      } else {
        setHardwareAnim(null);
        setScreenMessage(res.message);
        setScreen('MAIN_MENU');
      }
    }, 1500);
  };

  // Perform custom withdrawal with animation
  const handleCustomWithdrawSubmit = () => {
    const val = parseInt(customAmount, 10);
    if (!val || val <= 0) return;
    triggerBeep();
    setHardwareAnim('dispensing_cash');
    setScreen('PROCESSING');

    setTimeout(() => {
      if (!currentAccount) return;
      const res = withdrawCash(val, currentAccount.pin);
      if (res.success) {
        setDispensedCashAmount(val);
        setIsCashSlotOpen(true);
        setActiveReceipt(res.transaction || null);
        setScreen('CASH_DISPENSED');
      } else {
        setHardwareAnim(null);
        setScreenMessage(res.message);
        setScreen('MAIN_MENU');
      }
    }, 1500);
  };

  // Setor tunai with cash-in animation
  const handleDepositSubmit = () => {
    const val = parseInt(depositAmount, 10);
    if (!val || val <= 0) return;
    triggerBeep();
    setHardwareAnim('accepting_cash');
    setScreen('PROCESSING');

    setTimeout(() => {
      setHardwareAnim(null);
      const res = depositCash(val, 'Setoran Tunai Mesin ATM Nusantara');
      if (res.success) {
        setActiveReceipt(res.transaction || null);
        setScreenMessage(res.message);
        setScreen('RECEIPT_VIEW');
      } else {
        setScreenMessage(res.message);
        setScreen('MAIN_MENU');
      }
    }, 1700);
  };

  // Transfer steps
  const handleCheckTransferAccount = () => {
    if (!transferTargetAccount) return;
    triggerBeep();
    const lookup = lookupAccount(transferTargetAccount, transferTargetBank === 'Bank Nusantara' ? 'BNUS' : transferTargetBank);
    if (lookup.found && lookup.name) {
      setTransferRecipientName(lookup.name);
      setScreen('TRANSFER_AMOUNT');
    } else {
      setScreenMessage('Nomor rekening tidak ditemukan! Pastikan 10 digit nomor rekening sudah benar.');
    }
  };

  const handleTransferAmountConfirm = () => {
    const amt = parseInt(transferAmountInput, 10);
    if (!amt || amt < 10000) {
      setScreenMessage('Jumlah transfer minimal Rp 10.000');
      return;
    }
    triggerBeep();
    setTransferPinInput('');
    setScreen('TRANSFER_CONFIRM');
  };

  const handleExecuteTransfer = () => {
    if (!currentAccount) return;
    if (transferPinInput.length !== 6) return;
    triggerBeep();
    setScreen('PROCESSING');

    setTimeout(() => {
      const amt = parseInt(transferAmountInput, 10);
      const res = transferMoney({
        recipientAccount: transferTargetAccount,
        recipientBank: transferTargetBank,
        amount: amt,
        pin: transferPinInput,
        note: 'Transfer via ATM Nusantara',
      });

      if (res.success) {
        setActiveReceipt(res.transaction || null);
        setScreenMessage(res.message);
        setScreen('RECEIPT_VIEW');
      } else {
        setScreenMessage(res.message);
        setScreen('MAIN_MENU');
      }
    }, 1200);
  };

  // Ganti PIN
  const handleConfirmChangePin = () => {
    if (!currentAccount) return;
    if (newPinInput !== confirmNewPinInput) {
      setScreenMessage('Konfirmasi PIN baru tidak cocok! Silakan ulangi.');
      setNewPinInput('');
      setConfirmNewPinInput('');
      setScreen('GANTI_PIN_NEW');
      return;
    }
    triggerBeep();
    const res = changePin(currentAccount.id, oldPinInput, newPinInput);
    setScreenMessage(res.message);
    setScreen('MAIN_MENU');
  };

  // Take cash
  const handleTakeCash = () => {
    if (soundEnabled) playAtmSound('cash');
    setIsCashSlotOpen(false);
    setHardwareAnim(null);
    setDispensedCashAmount(0);
    setScreen('RECEIPT_VIEW');
  };

  // Print receipt animation
  const handlePrintReceipt = (tx: Transaction | null) => {
    if (soundEnabled) playAtmSound('cash');
    setIsReceiptPrinting(true);
    setHardwareAnim('printing_receipt');
    setActiveReceipt(tx);
    setTimeout(() => {
      setIsReceiptPrinting(false);
      setHardwareAnim(null);
    }, 1800);
  };

  const tierConfig = currentAccount ? CARD_TIER_CONFIGS[currentAccount.cardTier] : CARD_TIER_CONFIGS.regular;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* ATM HEADER / LOCATION BADGE */}
      <div className="w-full flex items-center justify-between mb-3 px-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-wider text-slate-300 uppercase">
            ATM Nusantara Unit #JKT-042 • Enkripsi PIN Aman & Animasi Mekanik Aktif
          </span>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700 cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{soundEnabled ? 'Suara Mesin: Aktif' : 'Mute'}</span>
        </button>
      </div>

      {/* ATM MACHINE HOUSING / PHYSICAL CASING */}
      <div className="w-full bg-gradient-to-b from-slate-800 via-slate-900 to-zinc-950 border-4 border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-black/90 relative overflow-hidden">
        {/* Top Bank Marquee Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-xl p-3 sm:p-4 mb-4 border border-blue-500/40 shadow-inner flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold font-mono text-lg shadow-md">
              🏛️
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base sm:text-lg tracking-wider font-mono">
                BANK NUSANTARA
              </h2>
              <p className="text-blue-200 text-[10px] tracking-widest uppercase">
                Anjungan Tunai Mandiri & Setor Tunai (CRM) 24 Jam
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-amber-300 font-mono block">
              Batas Tarik Harian: {formatRupiah(tierConfig.dailyWithdrawalLimit)}
            </span>
            <span className="text-[9px] text-white/70">
              Transfer Sesama Bank Nusantara: <strong className="text-emerald-400">Rp 0 (Instan Tanpa Admin)</strong>
            </span>
          </div>
        </div>

        {/* MAIN INTERFACE: LEFT SCREEN & RIGHT PHYSICAL SLOTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* THE DIGITAL ATM SCREEN (Takes 8 cols on LG) */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="relative bg-[#02182b] border-4 border-slate-700 rounded-2xl p-4 sm:p-5 text-white min-h-[460px] shadow-2xl overflow-hidden flex flex-col justify-between font-sans">
              {/* Screen subtle CRT scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent pointer-events-none opacity-40 bg-[length:100%_4px]" />

              {/* Top Screen Status Bar */}
              <div className="relative z-10 flex items-center justify-between border-b border-blue-800/80 pb-2 text-[11px] text-blue-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>BANK NUSANTARA ATM OS v4.5</span>
                </span>
                <span>{new Date().toLocaleTimeString('id-ID')} WIB</span>
              </div>

              {/* SCREEN CONTENT SWITCHER */}
              <div className="relative z-10 py-3 flex-1 flex flex-col justify-center">
                {/* 1. INSERT CARD SCREEN */}
                {screen === 'INSERT_CARD' && (
                  <div className="text-center space-y-4 my-auto">
                    <div className="relative w-24 h-20 mx-auto flex items-center justify-center">
                      <div className="w-20 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 border-2 border-amber-400 shadow-lg shadow-amber-500/20 flex items-center justify-between px-2.5 animate-bounce">
                        <div className="w-4 h-3 rounded-sm bg-amber-300" />
                        <span className="text-[9px] font-mono font-bold text-white">DEBIT</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                        SELAMAT DATANG DI BANK NUSANTARA
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-sm mx-auto">
                        Silakan masukkan kartu ATM Anda ke lubang kartu beranimasi untuk memulai transaksi.
                      </p>
                    </div>

                    {screenMessage && (
                      <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 max-w-md mx-auto">
                        {screenMessage}
                      </div>
                    )}

                    {currentAccount && (
                      <div className="pt-2">
                        <button
                          onClick={handleInsertCard}
                          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-amber-500/30 transition-all hover:scale-105 cursor-pointer flex items-center gap-2 mx-auto"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Masukkan Kartu {currentAccount.fullName.split(' ')[0]} (Klik Di Sini)</span>
                        </button>
                        <p className="text-[10px] text-blue-300/80 mt-2">
                          Kartu akan ditarik masuk secara mekanis dan memindai Chip EMV Anda.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 1B. CARD INSERTING MECHANICAL ANIMATION SCREEN */}
                {screen === 'CARD_INSERTING_ANIM' && (
                  <div className="text-center space-y-4 my-auto py-6">
                    <div className="relative w-48 h-28 mx-auto bg-slate-950/90 rounded-2xl border-2 border-emerald-500/60 p-3 flex flex-col items-center justify-end overflow-hidden shadow-inner">
                      {/* Slot Mouth */}
                      <div className="w-36 h-3 bg-emerald-500/30 border-2 border-emerald-400 rounded-full mb-1 shadow-lg shadow-emerald-400/50" />
                      {/* Sliding Card */}
                      <div className="w-28 h-16 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 border-2 border-amber-300 p-2 flex flex-col justify-between animate-pulse -translate-y-4 transition-transform duration-700 shadow-2xl">
                        <div className="flex justify-between items-center">
                          <div className="w-4 h-3 bg-amber-300 rounded-sm" />
                          <span className="text-[8px] font-mono text-white font-bold">NUSANTARA</span>
                        </div>
                        <span className="text-[8px] font-mono text-amber-200 tracking-widest">
                          •••• {currentAccount?.cardNumber.slice(-4)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm sm:text-base font-bold text-emerald-400 uppercase tracking-wider animate-pulse">
                        ⚙️ MENARIK KARTU & MEMBACA CHIP EMV...
                      </h4>
                      <p className="text-xs text-blue-200 font-mono">
                        Motor pembaca kartu sedang memverifikasi keaslian kartu {currentAccount?.fullName}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. LANGUAGE SELECTION */}
                {screen === 'LANGUAGE' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono mb-1">
                        ✓ Kartu Terbaca: {currentAccount?.cardNumber}
                      </span>
                      <h3 className="text-lg font-bold text-white">PILIH BAHASA / SELECT LANGUAGE</h3>
                      <p className="text-xs text-blue-200 mt-0.5">Langkah 2: Pilih bahasa yang ingin digunakan</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto pt-2">
                      <button
                        onClick={() => handleSelectLanguage('id')}
                        className="p-4 rounded-xl bg-blue-900/70 hover:bg-blue-800 border-2 border-blue-500 text-left font-bold text-sm transition-all cursor-pointer group"
                      >
                        <span className="text-amber-300 block text-xs">Bahasa Indonesia</span>
                        <span className="text-white text-base">INDONESIA ➔</span>
                      </button>
                      <button
                        onClick={() => handleSelectLanguage('en')}
                        className="p-4 rounded-xl bg-slate-900/70 hover:bg-slate-800 border-2 border-slate-600 text-left font-bold text-sm transition-all cursor-pointer group"
                      >
                        <span className="text-slate-400 block text-xs">English Language</span>
                        <span className="text-white text-base">ENGLISH ➔</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. ENTER PIN (STRICTLY HIDDEN PIN + LUPA PIN ADMIN REVIEW BUTTON) */}
                {screen === 'ENTER_PIN' && (
                  <div className="space-y-3.5 text-center max-w-md mx-auto">
                    <div>
                      <h3 className="text-lg font-bold text-white">MASUKKAN 6 DIGIT PIN KARTU ANDA</h3>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Demi keamanan, PIN tidak ditampilkan di layar. Ketik 6 digit PIN pada keypad di bawah/kanan.
                      </p>
                    </div>

                    {/* PIN Display Asterisks */}
                    <div className="flex justify-center items-center gap-2.5 py-1.5">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`w-9 h-11 rounded-lg border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all ${
                            idx < pinInput.length
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300 scale-110 shadow-md shadow-amber-500/20'
                              : 'border-blue-700 bg-blue-950/60 text-blue-500'
                          }`}
                        >
                          {idx < pinInput.length ? '●' : ''}
                        </div>
                      ))}
                    </div>

                    {pinError && (
                      <p className="text-xs text-rose-300 bg-rose-950/80 p-2.5 rounded-xl border border-rose-500/50 font-semibold">
                        {pinError}
                      </p>
                    )}

                    {/* LUPA PIN SECTION & ADMIN REVIEW STATUS */}
                    <div className="p-3 rounded-xl bg-blue-950/90 border border-blue-700/70 space-y-2 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Kelupaan PIN Kartu ATM?</span>
                        </div>
                          <button
                          type="button"
                          onClick={handleForgotPinClick}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] cursor-pointer transition-all shadow-md"
                        >
                          🔑 Lupa PIN? Proses Pemulihan PIN
                        </button>
                      </div>

                      {forgotPinNotice && (
                        <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-500/40 text-[11px] text-blue-100">
                          {forgotPinNotice}
                        </div>
                      )}

                      {myPinResetRequest && myPinResetRequest.status === 'pending' && (
                        <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-[11px] text-amber-200 flex items-start gap-2">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                          <div>
                            <strong className="text-amber-300 block">⏳ Sedang Diproses:</strong>
                            Permohonan pemulihan Lupa PIN Anda sedang diproses oleh sistem bank. Setelah selesai diproses, PIN kartu Anda akan langsung muncul di kotak ini!
                          </div>
                        </div>
                      )}

                      {myPinResetRequest && myPinResetRequest.status === 'approved' && myPinResetRequest.revealedPin && (
                        <div className="p-3 rounded-xl bg-emerald-950/90 border-2 border-emerald-400 text-xs space-y-2 shadow-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-300 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span>Disetujui Admin! Ini PIN Kartu Anda:</span>
                            </span>
                            <span className="font-mono text-lg font-black text-amber-300 tracking-widest bg-black/40 px-2.5 py-0.5 rounded border border-amber-400/40">
                              {myPinResetRequest.revealedPin}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => verifyAtmPin(myPinResetRequest.revealedPin!)}
                            className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-[11px] cursor-pointer"
                          >
                            Masukkan PIN Ini Otomatis & Masuk ke Menu ATM ➔
                          </button>
                        </div>
                      )}

                      {myPinResetRequest && myPinResetRequest.status === 'rejected' && (
                        <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-[11px] text-rose-200">
                          Permohonan Lupa PIN ditolak Admin: {myPinResetRequest.adminNotes}
                        </div>
                      )}
                    </div>

                    {/* Security Tip */}
                    <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/50 text-[10px] text-blue-300 text-left flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Keamanan ATM:</strong> PIN akun tidak ditampilkan secara terbuka. Gunakan fitur Lupa PIN di atas jika Anda lupa kode PIN.
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. MAIN MENU */}
                {screen === 'MAIN_MENU' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-blue-800/60 pb-2">
                      <div>
                        <span className="text-xs text-blue-300">Nasabah Terverifikasi:</span>
                        <h4 className="font-bold text-white text-sm">{currentAccount?.fullName}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-blue-300">No. Rekening:</span>
                        <span className="font-mono text-xs font-bold text-amber-300 block">
                          {currentAccount?.accountNumber}
                        </span>
                      </div>
                    </div>

                    {screenMessage && (
                      <div className="p-2.5 bg-blue-900/70 border border-amber-400/50 rounded-xl text-xs text-amber-200 flex items-center justify-between">
                        <span>{screenMessage}</span>
                        <button onClick={() => setScreenMessage('')} className="text-[10px] underline ml-2 cursor-pointer">
                          Tutup
                        </button>
                      </div>
                    )}

                    {/* Feature Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('CEK_SALDO');
                        }}
                        className="p-2.5 rounded-xl bg-blue-900/70 hover:bg-blue-800 border border-blue-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>1. Cek Saldo</span>
                        <span className="text-amber-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('TARIK_TUNAI_PRESET');
                        }}
                        className="p-2.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 border border-emerald-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>2. Tarik Tunai</span>
                        <span className="text-emerald-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setDepositAmount('');
                          setScreen('SETOR_TUNAI');
                        }}
                        className="p-2.5 rounded-xl bg-blue-900/70 hover:bg-blue-800 border border-blue-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>3. Setor Tunai (CRM)</span>
                        <span className="text-amber-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setTransferTargetAccount('');
                          setTransferAmountInput('');
                          setScreen('TRANSFER_DEST_ACCOUNT');
                        }}
                        className="p-2.5 rounded-xl bg-indigo-900/70 hover:bg-indigo-800 border border-indigo-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>4. Transfer Instan</span>
                        <span className="text-indigo-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MUTASI_REKENING');
                        }}
                        className="p-2.5 rounded-xl bg-blue-900/70 hover:bg-blue-800 border border-blue-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>5. Mutasi Rekening</span>
                        <span className="text-amber-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('CEK_NOMOR_REKENING');
                        }}
                        className="p-2.5 rounded-xl bg-blue-900/70 hover:bg-blue-800 border border-blue-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>6. Cek No. Rekening</span>
                        <span className="text-amber-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setOldPinInput('');
                          setNewPinInput('');
                          setScreen('GANTI_PIN_OLD');
                        }}
                        className="p-2.5 rounded-xl bg-blue-900/70 hover:bg-blue-800 border border-blue-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>7. Ganti PIN</span>
                        <span className="text-amber-300">➔</span>
                      </button>

                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('CETAK_ULANG_STRUK');
                        }}
                        className="p-2.5 rounded-xl bg-blue-900/70 hover:bg-blue-800 border border-blue-600 text-left font-bold transition-all flex items-center justify-between cursor-pointer"
                      >
                        <span>8. Cetak Ulang Struk</span>
                        <span className="text-amber-300">➔</span>
                      </button>
                    </div>

                    <div className="pt-1 flex justify-between items-center text-[11px]">
                      <button
                        onClick={ejectCard}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar & Ambil Kartu</span>
                      </button>
                      <span className="text-blue-300 font-mono">Pilih menu di layar</span>
                    </div>
                  </div>
                )}

                {/* 5. CEK SALDO */}
                {screen === 'CEK_SALDO' && (
                  <div className="space-y-4 text-center max-w-sm mx-auto">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">
                      INFORMASI SALDO REKENING ANDA
                    </h3>
                    <div className="p-4 rounded-2xl bg-blue-950/80 border border-blue-500/50 shadow-inner">
                      <span className="text-xs text-blue-300 block mb-1">Total Saldo Efektif:</span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">
                        {formatRupiah(currentAccount?.balance || 0)}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-800/60 text-[11px] text-blue-200 flex justify-between">
                        <span>No. Rekening:</span>
                        <span className="font-mono font-bold">{currentAccount?.accountNumber}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('TARIK_TUNAI_PRESET');
                        }}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Tarik Tunai
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="flex-1 py-2 rounded-xl bg-blue-900/80 hover:bg-blue-800 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Menu Utama
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. TARIK TUNAI PRESETS */}
                {screen === 'TARIK_TUNAI_PRESET' && (
                  <div className="space-y-3">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white uppercase">PILIH JUMLAH PENARIKAN TUNAI</h3>
                      <p className="text-[11px] text-blue-300">
                        Sisa limit harian {tierConfig.nameIndo}:{' '}
                        <strong className="text-amber-300">
                          {formatRupiah(Math.max(0, tierConfig.dailyWithdrawalLimit - (currentAccount?.dailyWithdrawnToday || 0)))}
                        </strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[100_000, 200_000, 500_000, 1_000_000, 1_500_000, 2_000_000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => handlePresetWithdraw(amt)}
                          className="p-3 rounded-xl bg-blue-900/80 hover:bg-blue-800 border border-blue-600 font-mono font-bold text-amber-200 text-left transition-all hover:scale-[1.02] cursor-pointer"
                        >
                          {formatRupiah(amt)}
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => {
                          triggerBeep();
                          setCustomAmount('');
                          setScreen('TARIK_TUNAI_CUSTOM');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-amber-300 border border-slate-600 font-semibold cursor-pointer"
                      >
                        Ketik Jumlah Lain ➔
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="text-xs text-blue-300 hover:text-white cursor-pointer"
                      >
                        Kembali ke Menu
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. TARIK TUNAI CUSTOM */}
                {screen === 'TARIK_TUNAI_CUSTOM' && (
                  <div className="space-y-4 text-center max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-white uppercase">MASUKKAN JUMLAH PENARIKAN</h3>
                    <p className="text-[11px] text-blue-300">Harus kelipatan Rp 50.000 atau Rp 100.000</p>

                    <div className="p-3 rounded-xl bg-blue-950 border border-blue-500 font-mono text-xl font-bold text-amber-300">
                      {customAmount ? formatRupiah(parseInt(customAmount, 10)) : 'Rp 0'}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCustomWithdrawSubmit}
                        disabled={!customAmount || parseInt(customAmount, 10) <= 0}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Benar / Tarik
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('TARIK_TUNAI_PRESET');
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* 8. SETOR TUNAI */}
                {screen === 'SETOR_TUNAI' && (
                  <div className="space-y-3 text-center max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-white uppercase">SETOR TUNAI OTOMATIS (CRM)</h3>
                    <p className="text-[11px] text-blue-300">
                      Masukkan uang kertas pecahan Rp 50.000 atau Rp 100.000 ke mulut kompartemen uang.
                    </p>

                    <div className="p-3 rounded-xl bg-blue-950 border border-blue-500 font-mono text-xl font-bold text-amber-300">
                      {depositAmount ? formatRupiah(parseInt(depositAmount, 10)) : 'Rp 0'}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[500_000, 1_000_000, 2_500_000].map((quick) => (
                        <button
                          key={quick}
                          onClick={() => {
                            triggerBeep();
                            setDepositAmount(quick.toString());
                          }}
                          className="py-1.5 px-2 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded border border-blue-700 text-[11px] font-mono cursor-pointer"
                        >
                          +{formatRupiah(quick)}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleDepositSubmit}
                        disabled={!depositAmount || parseInt(depositAmount, 10) <= 0}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Masukkan Uang & Setor ➔
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Kembali
                      </button>
                    </div>
                  </div>
                )}

                {/* 9. TRANSFER DESTINATION ACCOUNT */}
                {screen === 'TRANSFER_DEST_ACCOUNT' && (
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white uppercase">TRANSFER INSTAN ANTAR REKENING</h3>
                      <p className="text-[11px] text-emerald-300">
                        Transfer langsung masuk tanpa perlu menunggu persetujuan Admin!
                      </p>
                    </div>

                    <div>
                      <label className="text-[11px] text-blue-300 block mb-1">Bank Tujuan:</label>
                      <select
                        value={transferTargetBank}
                        onChange={(e) => setTransferTargetBank(e.target.value)}
                        className="w-full bg-blue-950 border border-blue-600 text-white rounded-lg p-2 text-xs"
                      >
                        {SUPPORTED_BANKS.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.icon} {b.name} (Biaya: {b.fee === 0 ? 'Gratis' : formatRupiah(b.fee)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-blue-300 block mb-1">
                        Nomor Rekening Tujuan (10 Digit):
                      </label>
                      <div className="p-2.5 rounded-lg bg-blue-950 border border-blue-500 font-mono text-base font-bold text-amber-300">
                        {transferTargetAccount || 'Ketik nomor rekening...'}
                      </div>
                      <p className="text-[10px] text-blue-300/80 mt-1">
                        Contoh rekening cepat Bank Nusantara:{' '}
                        {accounts
                          .filter((a) => a.id !== currentAccount?.id && a.cardStatus === 'active')
                          .slice(0, 2)
                          .map((a) => (
                            <button
                              key={a.id}
                              onClick={() => setTransferTargetAccount(a.accountNumber)}
                              className="text-amber-300 underline font-mono mr-2 cursor-pointer"
                            >
                              {a.accountNumber} ({a.fullName.split(' ')[0]})
                            </button>
                          ))}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleCheckTransferAccount}
                        disabled={transferTargetAccount.length < 8}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Lanjutkan ➔
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Menu
                      </button>
                    </div>
                  </div>
                )}

                {/* 10. TRANSFER AMOUNT */}
                {screen === 'TRANSFER_AMOUNT' && (
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white uppercase">MASUKKAN NOMINAL TRANSFER</h3>
                      <p className="text-xs text-amber-300 font-semibold">
                        Penerima: {transferRecipientName} ({transferTargetAccount})
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-950 border border-blue-500 font-mono text-xl font-bold text-amber-300 text-center">
                      {transferAmountInput ? formatRupiah(parseInt(transferAmountInput, 10)) : 'Rp 0'}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[100_000, 250_000, 500_000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => {
                            triggerBeep();
                            setTransferAmountInput(amt.toString());
                          }}
                          className="py-1.5 px-2 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded border border-blue-700 text-[11px] font-mono cursor-pointer"
                        >
                          +{formatRupiah(amt)}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleTransferAmountConfirm}
                        disabled={!transferAmountInput || parseInt(transferAmountInput, 10) <= 0}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Benar / Konfirmasi ➔
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('TRANSFER_DEST_ACCOUNT');
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* 11. TRANSFER CONFIRM WITH PIN */}
                {screen === 'TRANSFER_CONFIRM' && (
                  <div className="space-y-3 max-w-md mx-auto">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-white uppercase">KONFIRMASI RINCIAN TRANSFER</h3>
                      <p className="text-[11px] text-blue-300">
                        Periksa dengan teliti nama penerima sebelum memasukkan PIN
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-600 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-300">Bank Tujuan:</span>
                        <span className="font-semibold text-white">{transferTargetBank}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-300">No. Rekening Tujuan:</span>
                        <span className="font-mono font-bold text-amber-300">{transferTargetAccount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-300">Nama Penerima:</span>
                        <span className="font-bold text-emerald-300">{transferRecipientName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-300">Jumlah Transfer:</span>
                        <span className="font-mono font-bold text-white">
                          {formatRupiah(parseInt(transferAmountInput, 10) || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-blue-800/80 pt-1">
                        <span className="text-blue-300">Biaya Administrasi:</span>
                        <span className="font-mono text-emerald-400">
                          {transferTargetBank.includes('Nusantara') ? 'Rp 0 (Bebas Biaya)' : 'Rp 6.500'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-blue-300 block mb-1 text-center">
                        Masukkan 6 Digit PIN Kartu Anda:
                      </label>
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map((idx) => (
                          <div
                            key={idx}
                            className={`w-8 h-9 rounded border flex items-center justify-center font-bold text-xl ${
                              idx < transferPinInput.length
                                ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                                : 'border-blue-700 bg-blue-950/60 text-blue-500'
                            }`}
                          >
                            {idx < transferPinInput.length ? '●' : ''}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleExecuteTransfer}
                        disabled={transferPinInput.length !== 6}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Ya, Kirim Sekarang
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* 12. CEK NOMOR REKENING */}
                {screen === 'CEK_NOMOR_REKENING' && (
                  <div className="space-y-4 text-center max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-white uppercase">NOMOR REKENING ANDA</h3>
                    <div className="p-4 rounded-xl bg-blue-950 border border-blue-500">
                      <span className="text-xs text-blue-300 block mb-1">Nomor Rekening Aktif:</span>
                      <div className="font-mono text-2xl font-bold text-amber-300 tracking-wider">
                        {currentAccount?.accountNumber}
                      </div>
                      <p className="text-[11px] text-blue-300 mt-2 leading-relaxed">
                        Sistem Bank Nusantara mengacak sendiri nomor rekening 10 digit secara otomatis dan unik.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          if (!currentAccount) return;
                          triggerBeep();
                          regenerateAccountNumberWithPin(currentAccount.id, currentAccount.pin);
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Minta Sistem Acak Nomor Baru Sekarang</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Kembali ke Menu Utama
                      </button>
                    </div>
                  </div>
                )}

                {/* 13. MUTASI REKENING */}
                {screen === 'MUTASI_REKENING' && (
                  <div className="space-y-2.5 max-w-md mx-auto">
                    <div className="flex items-center justify-between border-b border-blue-800/80 pb-1.5">
                      <h3 className="text-xs font-bold text-white uppercase">MUTASI 5 TRANSAKSI TERAKHIR</h3>
                      <button
                        onClick={() => handlePrintReceipt(reprintReceipts[0] || null)}
                        className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Cetak Struk Mutasi</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {reprintReceipts.slice(0, 5).map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2 rounded bg-blue-950/80 border border-blue-800/60 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block text-[11px] truncate max-w-[180px]">
                              {tx.title}
                            </span>
                            <span className="text-[10px] text-blue-300">
                              {new Date(tx.timestamp).toLocaleDateString('id-ID')} • Ref: {tx.referenceNo}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs ${
                              tx.type === 'setor' || tx.type === 'transfer_in' || tx.type === 'redeem_code'
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            {tx.type === 'setor' || tx.type === 'transfer_in' || tx.type === 'redeem_code'
                              ? `+${formatRupiah(tx.amount)}`
                              : `-${formatRupiah(tx.amount)}`}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        triggerBeep();
                        setScreen('MAIN_MENU');
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer mt-2"
                    >
                      Kembali ke Menu
                    </button>
                  </div>
                )}

                {/* 14. GANTI PIN */}
                {screen === 'GANTI_PIN_OLD' && (
                  <div className="space-y-3 text-center max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-white uppercase">MASUKKAN PIN LAMA ANDA</h3>
                    <div className="flex justify-center gap-2 py-2">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`w-8 h-10 rounded border flex items-center justify-center font-bold text-xl ${
                            idx < oldPinInput.length
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                              : 'border-blue-700 bg-blue-950'
                          }`}
                        >
                          {idx < oldPinInput.length ? '●' : ''}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (oldPinInput === currentAccount?.pin) {
                            triggerBeep();
                            setScreen('GANTI_PIN_NEW');
                          } else {
                            setScreenMessage('PIN lama salah!');
                            setOldPinInput('');
                          }
                        }}
                        disabled={oldPinInput.length !== 6}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Lanjut ➔
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="flex-1 py-2 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {screen === 'GANTI_PIN_NEW' && (
                  <div className="space-y-3 text-center max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-white uppercase">MASUKKAN PIN BARU (6 DIGIT)</h3>
                    <div className="flex justify-center gap-2 py-2">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`w-8 h-10 rounded border flex items-center justify-center font-bold text-xl ${
                            idx < newPinInput.length
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                              : 'border-blue-700 bg-blue-950'
                          }`}
                        >
                          {idx < newPinInput.length ? '●' : ''}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        triggerBeep();
                        setConfirmNewPinInput('');
                        setScreen('GANTI_PIN_CONFIRM');
                      }}
                      disabled={newPinInput.length !== 6}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Konfirmasi PIN Baru ➔
                    </button>
                  </div>
                )}

                {screen === 'GANTI_PIN_CONFIRM' && (
                  <div className="space-y-3 text-center max-w-sm mx-auto">
                    <h3 className="text-sm font-bold text-white uppercase">KETIK ULANG PIN BARU ANDA</h3>
                    <div className="flex justify-center gap-2 py-2">
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <div
                          key={idx}
                          className={`w-8 h-10 rounded border flex items-center justify-center font-bold text-xl ${
                            idx < confirmNewPinInput.length
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                              : 'border-blue-700 bg-blue-950'
                          }`}
                        >
                          {idx < confirmNewPinInput.length ? '●' : ''}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleConfirmChangePin}
                      disabled={confirmNewPinInput.length !== 6}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Simpan PIN Baru
                    </button>
                  </div>
                )}

                {/* 15. CETAK ULANG STRUK */}
                {screen === 'CETAK_ULANG_STRUK' && (
                  <div className="space-y-2.5 max-w-md mx-auto">
                    <h3 className="text-xs font-bold text-white uppercase border-b border-blue-800 pb-1.5">
                      PILIH TRANSAKSI UNTUK DICETAK ULANG STRUKNYA:
                    </h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {reprintReceipts.map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2 rounded bg-blue-950/80 border border-blue-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white block text-[11px] truncate max-w-[200px]">
                              {tx.title}
                            </span>
                            <span className="text-[10px] text-blue-300 font-mono">
                              Ref: {tx.referenceNo} • {formatRupiah(tx.amount)}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePrintReceipt(tx)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        triggerBeep();
                        setScreen('MAIN_MENU');
                      }}
                      className="w-full py-2 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Kembali ke Menu
                    </button>
                  </div>
                )}

                {/* 16. PROCESSING ANIMATION WITH HARDWARE GRAPHICS */}
                {screen === 'PROCESSING' && (
                  <div className="text-center space-y-4 my-auto py-4">
                    {hardwareAnim === 'dispensing_cash' ? (
                      <div className="space-y-3">
                        <div className="w-40 h-20 mx-auto rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 flex flex-col items-center justify-center relative overflow-hidden shadow-lg shadow-emerald-500/20">
                          <div className="w-28 h-10 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-lg border border-emerald-200 flex items-center justify-center font-mono font-black text-white text-xs animate-bounce">
                            💵 RP 100.000
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-emerald-300 uppercase tracking-wider animate-pulse">
                          ⚙️ MENGHITUNG LEMBAR UANG TUNAI DI BRANKAS ATM...
                        </h4>
                      </div>
                    ) : hardwareAnim === 'accepting_cash' ? (
                      <div className="space-y-3">
                        <div className="w-40 h-20 mx-auto rounded-2xl bg-blue-950/90 border-2 border-amber-400 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
                          <div className="w-28 h-10 bg-gradient-to-r from-rose-600 to-amber-500 rounded-lg border border-amber-200 flex items-center justify-center font-mono font-black text-white text-xs animate-pulse">
                            📥 SCAN UANG ASLI
                          </div>
                        </div>
                        <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider animate-pulse">
                          ⚙️ MENARIK & MEMVERIFIKASI UANG SETORAN TUNAI...
                        </h4>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                          TRANSAKSI ANDA SEDANG DIPROSES...
                        </h4>
                      </>
                    )}
                    <p className="text-xs text-blue-300 font-mono">Harap menunggu sebentar, jangan tinggalkan mesin ATM</p>
                  </div>
                )}

                {/* 17. CASH DISPENSED */}
                {screen === 'CASH_DISPENSED' && (
                  <div className="text-center space-y-3 my-auto">
                    <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-emerald-300 animate-bounce shadow-lg shadow-emerald-500/30">
                      <DollarSign className="w-9 h-9" />
                    </div>
                    <h3 className="text-base font-bold text-emerald-400 uppercase">
                      💵 UANG TUNAI KELUAR DARI SHUTTER DISPENSER!
                    </h3>
                    <p className="text-xs text-white">
                      Saldo rekening Anda telah dikurangi. Silakan ambil uang tunai sebesar{' '}
                      <strong className="text-amber-300 font-mono text-sm">
                        {formatRupiah(dispensedCashAmount)}
                      </strong>{' '}
                      di lubang pengeluaran uang beranimasi di sebelah kanan.
                    </p>
                    <button
                      onClick={handleTakeCash}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all hover:scale-105 cursor-pointer shadow-lg"
                    >
                      Ambil Uang Tunai & Lanjutkan ➔
                    </button>
                  </div>
                )}

                {/* 18. RECEIPT VIEW */}
                {screen === 'RECEIPT_VIEW' && (
                  <div className="space-y-3 text-center max-w-sm mx-auto">
                    <div className="w-10 h-10 bg-blue-500/20 border border-blue-400 rounded-full flex items-center justify-center mx-auto text-amber-300">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white uppercase">TRANSAKSI TELAH SELESAI</h3>
                    {screenMessage && (
                      <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200">
                        {screenMessage}
                      </div>
                    )}
                    <p className="text-xs text-blue-200">
                      Apakah Anda ingin mencetak struk bukti transaksi ini atau melakukan transaksi lain?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePrintReceipt(activeReceipt)}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Struk ATM</span>
                      </button>
                      <button
                        onClick={() => {
                          triggerBeep();
                          setScreen('MAIN_MENU');
                        }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Menu Lainnya
                      </button>
                    </div>
                    <button
                      onClick={ejectCard}
                      className="text-xs text-rose-400 hover:underline cursor-pointer block mx-auto pt-1"
                    >
                      Selesai & Keluarkan Kartu
                    </button>
                  </div>
                )}

                {/* 19. CARD EJECTED ANIMATION */}
                {screen === 'CARD_EJECTED' && (
                  <div className="text-center space-y-3 my-auto">
                    <div className="w-20 h-14 bg-gradient-to-r from-amber-500 to-yellow-600 border-2 border-white rounded-xl flex items-center justify-center mx-auto text-slate-950 animate-bounce shadow-xl">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-amber-300 uppercase">
                      ⚙️ MOTOR MENGELUARKAN KARTU ATM ANDA...
                    </h3>
                    <p className="text-xs text-white max-w-xs mx-auto">
                      Silakan ambil kembali kartu ATM, uang tunai, dan struk bukti transaksi Anda. Terima kasih telah menggunakan Bank Nusantara!
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Screen System Footer */}
              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-blue-800/80 text-[10px] text-blue-400">
                <span>Layanan Nasabah 24 Jam: 1500-888</span>
                <span>Proteksi PIN Terenkripsi OJK</span>
              </div>
            </div>
          </div>

          {/* PHYSICAL MACHINE SLOTS & KEYPAD WITH ANIMATIONS (Takes 4 cols on LG) */}
          <div className="lg:col-span-4 flex flex-col justify-between space-y-3.5">
            {/* 1. PHYSICAL CARD INSERTION SLOT WITH SLIDING CARD ANIMATION */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border-2 border-slate-700 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-semibold">
                <span>1. Mulut Pembaca Kartu ATM</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    hardwareAnim === 'inserting_card' || hardwareAnim === 'ejecting_card'
                      ? 'bg-amber-400 animate-ping'
                      : cardInserted
                      ? 'bg-emerald-400 animate-pulse'
                      : 'bg-blue-400'
                  }`}
                />
              </div>

              <div
                onClick={cardInserted ? ejectCard : handleInsertCard}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                  cardInserted
                    ? 'bg-emerald-950/50 border-emerald-400 text-emerald-200 shadow-inner'
                    : 'bg-black/80 border-slate-600 text-slate-300 hover:border-amber-400 hover:text-amber-300'
                }`}
              >
                {/* Slot Bezel Line */}
                <div className="w-44 h-2 bg-slate-950 border border-emerald-500/60 rounded-full mb-1 shadow-md shadow-emerald-500/30" />

                {hardwareAnim === 'inserting_card' ? (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 animate-bounce">
                    <ArrowUp className="w-4 h-4 text-emerald-400" />
                    <span>Kartu Sedang Masuk...</span>
                  </div>
                ) : hardwareAnim === 'ejecting_card' ? (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 animate-bounce">
                    <ArrowDown className="w-4 h-4 text-amber-400" />
                    <span>Kartu Sedang Keluar...</span>
                  </div>
                ) : cardInserted ? (
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Kartu di Dalam (Klik Keluarkan)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 animate-pulse">
                    <CreditCard className="w-4 h-4" />
                    <span>Klik Masukkan Kartu ATM</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. RECEIPT PRINTER SLOT WITH PAPER ROLL ANIMATION */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border-2 border-slate-700 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span className="flex items-center gap-1">
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>2. Printer Struk Thermal</span>
                </span>
                {isReceiptPrinting && <span className="text-[10px] text-amber-400 animate-ping font-mono">Mencetak...</span>}
              </div>
              <div className="h-10 bg-black rounded-lg border border-slate-600 flex items-center justify-center relative overflow-visible">
                <div className="w-40 h-1.5 bg-slate-800 rounded" />
                {(isReceiptPrinting || activeReceipt) && (
                  <button
                    onClick={() => setActiveReceipt(activeReceipt)}
                    className={`absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-100 text-slate-900 text-[10px] font-mono font-bold rounded-b-lg shadow-xl border-t-4 border-amber-500 cursor-pointer whitespace-nowrap transition-all ${
                      isReceiptPrinting ? 'animate-bounce scale-110' : 'hover:scale-105'
                    }`}
                  >
                    🧾 {isReceiptPrinting ? 'Kertas Struk Keluar...' : 'Klik Lihat Struk ATM'}
                  </button>
                )}
              </div>
            </div>

            {/* 3. CASH DISPENSER & CDM SLOT WITH BANKNOTE ANIMATION */}
            <div className="p-3 bg-slate-900/90 rounded-2xl border-2 border-slate-700 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1 font-semibold">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>3. Dispenser & Setor Uang</span>
                </span>
                {(isCashSlotOpen || hardwareAnim === 'dispensing_cash' || hardwareAnim === 'accepting_cash') && (
                  <span className="text-[10px] text-emerald-400 animate-pulse font-bold">Shutter Terbuka</span>
                )}
              </div>
              <div
                onClick={isCashSlotOpen ? handleTakeCash : undefined}
                className={`h-14 rounded-xl border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                  isCashSlotOpen || hardwareAnim === 'dispensing_cash'
                    ? 'bg-emerald-950/90 border-emerald-400 cursor-pointer shadow-lg shadow-emerald-500/30'
                    : hardwareAnim === 'accepting_cash'
                    ? 'bg-amber-950/90 border-amber-400 shadow-lg shadow-amber-500/30'
                    : 'bg-black/90 border-slate-700'
                }`}
              >
                {isCashSlotOpen ? (
                  <div className="text-xs font-mono font-bold text-emerald-300 animate-bounce flex items-center gap-1.5">
                    <span>💵</span>
                    <span>Ambil Uang ({formatRupiah(dispensedCashAmount)})</span>
                  </div>
                ) : hardwareAnim === 'dispensing_cash' ? (
                  <div className="text-xs font-mono font-bold text-emerald-300 animate-pulse">
                    ⚙️ Mengeluarkan Lembaran Uang...
                  </div>
                ) : hardwareAnim === 'accepting_cash' ? (
                  <div className="text-xs font-mono font-bold text-amber-300 animate-bounce">
                    📥 Menarik Uang Kertas ke Brankas...
                  </div>
                ) : (
                  <div className="w-48 h-2 bg-slate-800 rounded-full border border-slate-700" />
                )}
              </div>
            </div>

            {/* 4. TACTILE KEYPAD (PIN Pad) WITH KEY PRESS ANIMATION */}
            <div className="p-3 bg-slate-950/90 rounded-2xl border-2 border-slate-700 shadow-inner">
              <div className="text-[10px] text-slate-400 text-center font-mono uppercase mb-2">
                KEYPAD PIN FISIK BERANIMASI
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleKeypadPress(digit)}
                    className={`h-10 font-mono font-bold text-base rounded-lg border shadow cursor-pointer transition-all ${
                      pressedKey === digit
                        ? 'bg-amber-400 text-slate-950 border-amber-300 scale-90 shadow-inner'
                        : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-slate-600 active:scale-95'
                    }`}
                  >
                    {digit}
                  </button>
                ))}
                {/* Bottom Row */}
                <button
                  onClick={handleKeypadClear}
                  className="h-10 bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer uppercase transition-all"
                >
                  Koreksi
                </button>
                <button
                  onClick={() => handleKeypadPress('0')}
                  className={`h-10 font-mono font-bold text-base rounded-lg border shadow cursor-pointer transition-all ${
                    pressedKey === '0'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 scale-90'
                      : 'bg-gradient-to-b from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white border-slate-600'
                  }`}
                >
                  0
                </button>
                <button
                  onClick={handleKeypadCancel}
                  className="h-10 bg-rose-700 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-lg shadow cursor-pointer uppercase transition-all"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL THERMAL RECEIPT PREVIEW */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl font-mono text-xs border border-slate-300 relative">
            <div className="text-center pb-3 border-b-2 border-dashed border-slate-400">
              <h3 className="font-extrabold text-base tracking-wider">BANK NUSANTARA</h3>
              <p className="text-[10px] text-slate-600">STRUK BUKTI TRANSAKSI ATM</p>
              <p className="text-[10px] text-slate-500">Unit: #JKT-042 • Cabang Sudirman</p>
            </div>

            <div className="py-3 space-y-1.5 border-b-2 border-dashed border-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>TANGGAL:</span>
                <span>{new Date(activeReceipt.timestamp).toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>JAM:</span>
                <span>{new Date(activeReceipt.timestamp).toLocaleTimeString('id-ID')} WIB</span>
              </div>
              <div className="flex justify-between">
                <span>NO. REFERENSI:</span>
                <span className="font-bold">{activeReceipt.referenceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>NO. REKENING:</span>
                <span className="font-bold">{activeReceipt.recipientAccount || currentAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>NAMA:</span>
                <span className="font-bold uppercase truncate max-w-[150px]">
                  {activeReceipt.recipientName || currentAccount?.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>JENIS TRANSAKSI:</span>
                <span className="font-bold uppercase">{activeReceipt.title}</span>
              </div>
              <div className="flex justify-between">
                <span>STATUS:</span>
                <span className="font-bold uppercase text-emerald-700">
                  {activeReceipt.status === 'success' ? 'BERHASIL / LUNAS' : 'SEDANG DIPROSES ⏳'}
                </span>
              </div>
              {activeReceipt.generatedCode && (
                <div className="flex justify-between pt-1 border-t border-dashed border-slate-300">
                  <span>KODE TUKAR:</span>
                  <span className="font-bold">
                    {activeReceipt.status === 'success'
                      ? activeReceipt.generatedCode
                      : 'DISEMBUNYIKAN (SEDANG DIPROSES)'}
                  </span>
                </div>
              )}
            </div>

            <div className="py-3 border-b-2 border-dashed border-slate-400 text-center">
              <span className="text-[10px] text-slate-500 uppercase block">JUMLAH TRANSAKSI</span>
              <span className="text-lg font-black tracking-wider text-slate-900">
                {formatRupiah(activeReceipt.amount)}
              </span>
            </div>

            <div className="py-2 text-[10px] text-slate-500 text-center leading-relaxed">
              SIMPAN STRUK INI SEBAGAI BUKTI PEMBAYARAN / TRANSAKSI YANG SAH. TERIMA KASIH.
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Struk</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs cursor-pointer"
              >
                Tutup Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
