/**
 * Bank Nusantara Customer Online Banking Dashboard
 * Handles Section 1, 7, 8 (Features), 9 (Security), and 10 (Pinjaman Online)
 */
import React, { useState } from 'react';
import {
  CreditCard,
  Send,
  History,
  FileBarChart,
  ShieldCheck,
  BadgeDollarSign,
  CalendarClock,
  Star,
  Search,
  Lock,
  Unlock,
  Phone,
  KeyRound,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  PlusCircle,
  Calculator,
  ChevronRight,
  TrendingUp,
  Sliders,
  Filter,
  MessageSquare,
  Briefcase,
  Crown,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CardVisualizer } from './CardVisualizer';
import { NusantaraChat } from './NusantaraChat';
import { PinPromptModal } from './PinPromptModal';
import { AdminPinModal } from './AdminPinModal';
import { DigitalBankingFeatures } from './DigitalBankingFeatures';
import { JobVacancyView } from './JobVacancyView';
import { VerifiedBadge } from './VerifiedBadge';
import { CompleteSettingsView } from './CompleteSettingsView';
import { TabEmasView } from './TabEmasView';
import { TransferBebasPanel } from './TransferBebasPanel';
import {
  formatRupiah,
  formatIndoDate,
  CARD_TIER_CONFIGS,
  LOAN_TIER_CONFIGS,
  SUPPORTED_BANKS,
} from '../utils/bankUtils';
import { CardTier, LoanType } from '../types/bank';

export const CustomerDashboard: React.FC = () => {
  const {
    currentAccount,
    currentAccountTransactions,
    currentAccountLoans,
    currentAccountScheduled,
    pendingBuyerApprovalTransactions,
    buyerApproveTransaction,
    buyerApproveAllTransactions,
    favorites,
    transferMoney,
    applyLoan,
    payLoanInstallment,
    toggleCardFreezeWithPin,
    switchCardWithAdminCode,
    updatePhone,
    changePin,
    addFavorite,
    deleteFavorite,
    addScheduledPayment,
    toggleScheduledPayment,
    deleteScheduledPayment,
    lookupAccount,
    featureConfigs,
    setIsTutorialModalOpen,
    setIsAiBotModalOpen,
  } = useBank();

  // Active sub-tab in dashboard
  const [activeTab, setActiveTab] = useState<
    | 'ringkasan'
    | 'pekerjaan'
    | 'layanan'
    | 'chat'
    | 'transfer'
    | 'emas'
    | 'pinjaman'
    | 'mutasi'
    | 'keamanan'
    | 'jadwal'
  >('ringkasan');
  const [transferMode, setTransferMode] = useState<'reguler' | 'bebas'>('reguler');
  const [showCardPinModal, setShowCardPinModal] = useState<boolean>(false);
  const [pendingTierSwitch, setPendingTierSwitch] = useState<CardTier | null>(null);

  // --- Transfer Tab State ---
  const [destBank, setDestBank] = useState<string>('Bank Nusantara');
  const [destAccount, setDestAccount] = useState<string>('');
  const [recipientLookup, setRecipientLookup] = useState<{ found: boolean; name?: string } | null>(null);
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferPin, setTransferPin] = useState<string>('');
  const [showTransferConfirmModal, setShowTransferConfirmModal] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string>('');
  const [saveAsFav, setSaveAsFav] = useState<boolean>(false);

  // --- Loan Tab State ---
  const [selectedLoanType, setSelectedLoanType] = useState<LoanType>('menengah');
  const [loanAmount, setLoanAmount] = useState<number>(10_000_000);
  const [loanTenor, setLoanTenor] = useState<number>(12);
  const [loanIncome, setLoanIncome] = useState<string>('8000000');
  const [loanJob, setLoanJob] = useState<string>('');
  const [loanPurpose, setLoanPurpose] = useState<string>('');
  const [loanSubmitting, setLoanSubmitting] = useState<boolean>(false);

  // --- Mutasi Search & Filter State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dashboardNotice, setDashboardNotice] = useState<string | null>(null);

  // --- Phone Change State (Section 8) ---
  const [showPhoneModal, setShowPhoneModal] = useState<boolean>(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);

  // --- Change PIN State ---
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');

  // --- Scheduled Payment Modal State ---
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [schTitle, setSchTitle] = useState<string>('');
  const [schAccount, setSchAccount] = useState<string>('');
  const [schName, setSchName] = useState<string>('');
  const [schAmount, setSchAmount] = useState<string>('');
  const [schDay, setSchDay] = useState<number>(25);

  if (!currentAccount) {
    return (
      <div className="p-8 text-center text-slate-300">
        <p>Silakan pilih atau daftarkan rekening Bank Nusantara terlebih dahulu.</p>
      </div>
    );
  }

  const tierConfig = CARD_TIER_CONFIGS[currentAccount.cardTier] || CARD_TIER_CONFIGS.regular;

  // Handle Account lookup live
  const handleLookupCheck = () => {
    if (!destAccount || destAccount.length < 8) return;
    const res = lookupAccount(destAccount, destBank === 'Bank Nusantara' ? 'BNUS' : destBank);
    setRecipientLookup(res);
  };

  const handleStartTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) {
      setTransferError('Jumlah transfer tidak valid');
      return;
    }
    if (!recipientLookup?.found) {
      setTransferError('Silakan verifikasi nomor rekening tujuan terlebih dahulu');
      return;
    }
    setShowTransferConfirmModal(true);
  };

  const handleConfirmTransferSubmit = () => {
    if (transferPin.length !== 6) {
      setTransferError('Masukkan 6 digit PIN Anda');
      return;
    }

    const amt = parseInt(transferAmount, 10);
    const res = transferMoney({
      recipientAccount: destAccount,
      recipientBank: destBank,
      amount: amt,
      note: transferNote,
      pin: transferPin,
    });

    if (res.success) {
      if (saveAsFav && recipientLookup?.name) {
        addFavorite(destAccount, recipientLookup.name, destBank, transferNote);
      }
      setShowTransferConfirmModal(false);
      setTransferAmount('');
      setTransferNote('');
      setTransferPin('');
      setDestAccount('');
      setRecipientLookup(null);
      setActiveTab('mutasi');
    } else {
      setTransferError(res.message);
    }
  };

  // Loan calculator
  const activeLoanConfig = LOAN_TIER_CONFIGS[selectedLoanType];
  const totalLoanInterest = loanAmount * activeLoanConfig.interestRateMonthly * loanTenor;
  const totalRepaymentCalc = loanAmount + totalLoanInterest;
  const monthlyInstallmentCalc = Math.round(totalRepaymentCalc / loanTenor);

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoanSubmitting(true);
    const incomeNum = parseInt(loanIncome, 10) || 0;

    const res = applyLoan({
      loanType: selectedLoanType,
      amount: loanAmount,
      tenorMonths: loanTenor,
      monthlyIncome: incomeNum,
      jobTitle: loanJob || 'Karyawan / Wiraswasta',
      purpose: loanPurpose || 'Kebutuhan Pribadi & Usaha',
    });

    setLoanSubmitting(false);
    setDashboardNotice(res.message);
    if (res.success) {
      setLoanPurpose('');
      setLoanJob('');
    }
    setTimeout(() => setDashboardNotice(null), 5000);
  };

  // Filtered transactions for Mutasi (Section 8)
  const filteredTransactions = currentAccountTransactions.filter((tx) => {
    const q = (searchQuery || '').toLowerCase();
    const titleStr = (tx.title || tx.description || '').toLowerCase();
    const refStr = (tx.referenceNo || '').toLowerCase();
    const recStr = (tx.recipientName || '').toLowerCase();
    const sndStr = (tx.senderName || '').toLowerCase();
    const matchesSearch =
      titleStr.includes(q) ||
      refStr.includes(q) ||
      recStr.includes(q) ||
      sndStr.includes(q);

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'tarik' && tx.type === 'tarik') return true;
    if (filterType === 'setor' && tx.type === 'setor') return true;
    if (
      filterType === 'transfer' &&
      (tx.type === 'transfer_out' ||
        tx.type === 'transfer_in' ||
        tx.type === 'transfer_bebas_out' ||
        tx.type === 'transfer_bebas_in')
    )
      return true;
    if (filterType === 'emas' && (tx.type === 'beli_emas' || tx.type === 'jual_emas' || tx.category === 'emas'))
      return true;
    if (filterType === 'pinjaman' && (tx.type === 'pinjaman_disburse' || tx.type === 'pinjaman_bayar')) return true;

    return false;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* TOP USER WELCOME & QUICK STATS */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-5 sm:p-7 border border-blue-900/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400">
              Nasabah Bank Nusantara
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Terverifikasi OJK
            </span>
            {currentAccount.isVerified && (
              <VerifiedBadge size="sm" showText text={currentAccount.verifiedLabel || 'Terverifikasi Centang Biru'} label={currentAccount.verifiedLabel} />
            )}
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Selamat Datang, {currentAccount.fullName}
            </h1>
            {currentAccount.isVerified && (
              <VerifiedBadge size="md" label={currentAccount.verifiedLabel} />
            )}
          </div>
          <p className="text-xs text-slate-300">
            No. Rekening:{' '}
            <strong className="font-mono text-amber-300 tracking-wider">
              {currentAccount.accountNumber}
            </strong>{' '}
            • Terdaftar sejak {new Date(currentAccount.createdAt).getFullYear()}
          </p>
        </div>

        {/* Balance Card Highlight */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md min-w-[260px] text-right">
          <span className="text-xs text-slate-400 block mb-0.5">
            Total Saldo Rekening {currentAccount.cardTier === 'admin' && '• KARTU ADMIN (∞)'}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono tracking-tight">
            {formatRupiah(currentAccount.balance)}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2 text-[11px] text-slate-400">
            <span>Batas Tarik Harian:</span>
            <strong className="text-white font-mono">{formatRupiah(tierConfig.dailyWithdrawalLimit)}</strong>
          </div>
        </div>
      </div>

      {/* BANNER STATUS TUTORIAL KARTU BARU (WAJIB DISETUJUI ADMIN DULU BARU ADA TUTORIALNYA) */}
      {currentAccount.cardStatus === 'pending' ? (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/80 border-2 border-amber-500/60 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase tracking-wider">
              ⏳ MENUNGGU PERSETUJUAN ADMIN • TUTORIAL BELUM TERBUKA
            </span>
            <h3 className="text-sm sm:text-base font-black text-white">
              Pembuatan Kartu Baru Harus Disetujui Admin Dulu Baru Ada Tutorialnya!
            </h3>
            <p className="text-xs text-slate-300">
              Setujui pembuatan kartu ini di Panel Admin (PIN: <strong>159357</strong>) atau klik tombol di samping agar kartu Anda aktif dan langsung membuka Tutorial Lengkap seluruh tombol aplikasi.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTutorialModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-lg"
          >
            🔒 Lihat Status Persetujuan &amp; Tutorial
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/40 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black uppercase">
                ✅ KARTU DISETUJUI ADMIN • TUTORIAL LENGKAP TERBUKA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase">
                🤖 BOT AI SUARA (GEMINI 1.5 FLASH)
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-black text-white pt-1">
              Ingin Penjelasan Lengkap Semua Tombol atau Tanya Jawab Pakai Suara?
            </h3>
            <p className="text-[11px] text-slate-300">
              Panduan interaktif aplikasi siap membantu Anda kapan saja dan juga tersedia di tombol paling bawah halaman.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsTutorialModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow"
            >
              🎓 Buka Tutorial Lengkap
            </button>
            <button
              type="button"
              onClick={() => setIsAiBotModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer shadow"
            >
              🤖 Tanya Bot AI &amp; Voice Chat
            </button>
          </div>
        </div>
      )}

      {dashboardNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dashboardNotice}</span>
          </div>
          <button
            onClick={() => setDashboardNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================================
          BANNER PERSETUJUAN PEMBELI (UNTUK PEMBELIAN AIR/PDAM, TAGIHAN, MAKANAN, DLL YANG TIDAK PAKAI KODE)
         ========================================================================= */}
      {pendingBuyerApprovalTransactions.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-400/70 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-sm sm:text-base">
                    Konfirmasi Persetujuan Pembeli ({pendingBuyerApprovalTransactions.length} Pesanan Siap)
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                    SIAP DISETUJUI PEMBELI
                  </span>
                </div>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Pembelian Air (PDAM), tagihan, dan layanan non-kode yang telah selesai diproses memerlukan <strong>Persetujuan Pembeli</strong> Anda (bukan kode tukar).
                </p>
              </div>
            </div>
            {pendingBuyerApprovalTransactions.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const res = buyerApproveAllTransactions();
                  setDashboardNotice(res.message);
                  setTimeout(() => setDashboardNotice(null), 5000);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-lg"
              >
                ✓ Setujui Semua ({pendingBuyerApprovalTransactions.length})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingBuyerApprovalTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-white block">
                    {(tx.title || tx.description || 'Transaksi').replace('(Menunggu Persetujuan Pembeli)', '').trim()}
                  </span>
                  <span className="text-[11px] font-mono text-amber-300 block mt-0.5">
                    Nominal: {formatRupiah(tx.amount)} • Tujuan/ID: {tx.recipientAccount || '-'}
                  </span>
                  <span className="text-[10px] text-emerald-300 block mt-0.5">
                    ✓ Proses selesai — Menunggu Persetujuan Pembeli Anda
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const res = buyerApproveTransaction(tx.id);
                    setDashboardNotice(res.message);
                    setTimeout(() => setDashboardNotice(null), 5000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs cursor-pointer shrink-0 shadow-md"
                >
                  ✅ Setujui Pesanan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'ringkasan'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>Kartu & Ringkasan</span>
        </button>

        <button
          onClick={() => setActiveTab('pekerjaan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'pekerjaan'
              ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-500/10 border border-emerald-500/30'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>💼 Lowongan Pekerjaan &amp; Suit Level (Lv.{currentAccount.jobLevel || 1})</span>
        </button>

        <button
          onClick={() => setActiveTab('layanan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'layanan'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30'
              : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Layanan Digital, Redeem &amp; Pulsa</span>
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'chat'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <span>Chat Antar Nomor (PayChat)</span>
        </button>

        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'transfer'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-400" />
          <span>Transfer &amp; Transfer Bebas</span>
        </button>

        <button
          onClick={() => setActiveTab('emas')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'emas'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-500/10 border border-amber-500/35'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>Emas 24K</span>
        </button>

        <button
          onClick={() => setActiveTab('pinjaman')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'pinjaman'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BadgeDollarSign className="w-4 h-4 text-amber-400" />
          <span>Pinjaman Online</span>
        </button>

        <button
          onClick={() => setActiveTab('mutasi')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'mutasi'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <History className="w-4 h-4 text-blue-400" />
          <span>Mutasi & Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'jadwal'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <CalendarClock className="w-4 h-4 text-purple-400" />
          <span>Jadwal Pembayaran</span>
        </button>

        <button
          onClick={() => setActiveTab('keamanan')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'keamanan'
              ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30'
              : 'text-cyan-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>⚙️ Pengaturan Lengkap & Fitur Dihapus</span>
        </button>
      </div>

      {/* =========================================================================
          TAB PEKERJAAN: LOWONGAN PEKERJAAN, SISTEM LEVEL & SUIT KOMPUTER MEDIUM
         ========================================================================= */}
      {activeTab === 'pekerjaan' && <JobVacancyView />}

      {/* =========================================================================
          TAB 1: RINGKASAN & KARTU (Section 1, 3, 4)
         ========================================================================= */}
      {activeTab === 'ringkasan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Card Visualizer (Takes 5 cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Kartu ATM Bank Nusantara</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Status:{' '}
                <strong
                  className={`uppercase px-2 py-0.5 rounded ${
                    currentAccount.cardStatus === 'banned'
                      ? 'bg-rose-600 text-white'
                      : currentAccount.cardStatus === 'active'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {currentAccount.cardStatus === 'banned' ? '🚫 BANNED' : currentAccount.cardStatus}
                </strong>
              </span>
            </div>

            <CardVisualizer account={currentAccount} showInspector={true} />
          </div>

          {/* Quick Actions & Specifications (Takes 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card Tier Specifications (Section 1) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Keterangan Jenis Kartu Anda ({tierConfig.nameIndo})</span>
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierConfig.badgeColor}`}>
                  Warna: {tierConfig.colorName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase block">Batas Tarik Harian</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {formatRupiah(tierConfig.dailyWithdrawalLimit)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase block">Biaya Bulanan</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatRupiah(tierConfig.monthlyFee)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase block">Masa Berlaku</span>
                  <span className="font-mono font-bold text-blue-300 text-sm">
                    {tierConfig.validityYears} Tahun
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase block">Cocok Untuk</span>
                  <span className="font-semibold text-emerald-300 text-xs">
                    {tierConfig.idealFor}
                  </span>
                </div>
              </div>

              {/* Compare & Direct Switch with Admin Code */}
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="text-xs text-slate-300 font-semibold">
                    Ganti Kartu ke Kartu Lain Tanpa Membuat Kartu Baru:
                  </span>
                  <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    Cukup Masukkan Kode Admin (Bukan Kode Kartu)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px]">
                  {Object.values(CARD_TIER_CONFIGS).map((c, idx) => {
                    const isCurrent = c.tier === currentAccount.cardTier;
                    const isAdminTier = c.tier === 'admin';
                    return (
                      <div
                        key={c.tier}
                        className={`p-3 rounded-xl border transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'border-amber-400 bg-amber-500/10'
                            : isAdminTier
                            ? 'border-fuchsia-500/60 bg-purple-950/40 hover:border-fuchsia-400'
                            : 'border-slate-800 bg-slate-950/60 hover:border-amber-500/40'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white block">
                              Kartu #{idx + 1}: {c.nameIndo}
                            </span>
                            {isAdminTier && (
                              <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-fuchsia-500 text-slate-950">
                                ∞ INFINITY
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 block text-[10px] mt-0.5">
                            Tarik: {formatRupiah(c.dailyWithdrawalLimit)}/hr
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            Biaya: {formatRupiah(c.monthlyFee)}/bln
                          </span>
                          <span className="text-amber-300 block text-[10px] mt-1 font-semibold">
                            {c.idealFor}
                          </span>
                        </div>
                        {isCurrent ? (
                          <span className="mt-2 py-1 text-center rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                            ✓ Kartu Aktif Saat Ini
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingTierSwitch(c.tier)}
                            className={`mt-2 py-1.5 px-2 rounded-lg font-bold text-[10px] cursor-pointer transition-all ${
                              isAdminTier
                                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-500 hover:from-fuchsia-400 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            Ganti ke Kartu Ini (Kode Admin)
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Favorites Payees */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Rekening Favorit Tersimpan</span>
                </h3>
                <button
                  onClick={() => setActiveTab('transfer')}
                  className="text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  Transfer Cepat ➔
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {favorites.slice(0, 3).map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => {
                      setDestAccount(fav.accountNumber);
                      setDestBank(fav.bankName);
                      setActiveTab('transfer');
                    }}
                    className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <span className="font-bold text-white text-xs block truncate">{fav.ownerName}</span>
                    <span className="text-[11px] font-mono text-amber-300">{fav.accountNumber}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{fav.bankName}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: 20+ LAYANAN DIGITAL & UPGRADE KARTU
         ========================================================================= */}
      {activeTab === 'layanan' && (
        <DigitalBankingFeatures onNavigateToTab={(tab) => setActiveTab(tab as any)} />
      )}

      {/* =========================================================================
          TAB: CHAT ANTAR NOMOR (NUSANTARA PAYCHAT)
         ========================================================================= */}
      {activeTab === 'chat' && <NusantaraChat />}

      {/* =========================================================================
          TAB EMAS MEWAH 24K REAL-TIME
         ========================================================================= */}
      {activeTab === 'emas' && <TabEmasView />}

      {/* =========================================================================
          TAB 2: FITUR TRANSFER (MODE REGULER & MODE TRANSFER BEBAS 5%)
         ========================================================================= */}
      {activeTab === 'transfer' && (
        <div className="space-y-5">
          {/* Segmented Mode Switcher inside Transfer Tab */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/90 border border-slate-800 p-3">
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTransferMode('reguler')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  transferMode === 'reguler'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Transfer Reguler (Antar Rekening)
              </button>
              <button
                type="button"
                onClick={() => setTransferMode('bebas')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  transferMode === 'bebas'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                Transfer Bebas 5% (Uang, Coin &amp; Emas)
              </button>
            </div>
            <span className="text-xs text-slate-400">
              {transferMode === 'bebas'
                ? 'Kirim Uang, Coin Spin, Emas 24K, atau ketiganya sekaligus · Admin 5%'
                : 'Transfer perbankan reguler antar rekening Bank Nusantara & Bank Lain'}
            </span>
          </div>

          {transferMode === 'bebas' ? (
            <TransferBebasPanel onNavigateToMutasi={() => setActiveTab('mutasi')} />
          ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-400" />
                  <span>Transfer Antar Rekening & Bank Lain</span>
                </h2>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  Antar Bank Nusantara Gratis Rp 0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Langkah 1 hingga 8: Masukkan nomor tujuan yang diacak sistem, cek nama penerima, nominal, dan konfirmasi PIN Anda.
              </p>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleStartTransfer} className="space-y-4 text-xs">
              {/* Step 2: Bank Selection */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Langkah 2 — Pilih Jenis / Bank Tujuan:
                </label>
                <select
                  value={destBank}
                  onChange={(e) => {
                    setDestBank(e.target.value);
                    setRecipientLookup(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                >
                  {SUPPORTED_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.icon} {b.name} • {b.fee === 0 ? 'Bebas Biaya (Rp 0)' : `Biaya ${formatRupiah(b.fee)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Destination Account Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Langkah 3 — Nomor Rekening Tujuan (10 Digit Unik):
                  </label>
                  <button
                    type="button"
                    onClick={handleLookupCheck}
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    🔍 Cek Nama Pemilik
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destAccount}
                    onChange={(e) => {
                      setDestAccount(e.target.value);
                      setRecipientLookup(null);
                    }}
                    placeholder="Contoh: 1029384756"
                    maxLength={16}
                    className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCheck}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Periksa
                  </button>
                </div>
              </div>

              {/* Step 4: System displays Recipient Name */}
              {recipientLookup && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    recipientLookup.found
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">
                      Langkah 4 — Hasil Validasi Pemilik Rekening:
                    </span>
                    {recipientLookup.found ? (
                      <div className="font-bold text-sm text-emerald-300 mt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{recipientLookup.name}</span>
                      </div>
                    ) : (
                      <div className="font-semibold text-rose-300 mt-0.5">
                        Rekening tidak ditemukan! Pastikan 10 digit nomor rekening benar.
                      </div>
                    )}
                  </div>
                  {recipientLookup.found && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      Valid
                    </span>
                  )}
                </div>
              )}

              {/* Step 5: Transfer Amount */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Langkah 5 — Masukkan Jumlah Uang (Nominal):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="100.000"
                    min="10000"
                    step="10000"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 pl-10 font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 mt-1.5">
                  {[100_000, 250_000, 500_000, 1_000_000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt.toString())}
                      className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-mono cursor-pointer"
                    >
                      +{formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Catatan Transaksi (Opsional):
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Contoh: Bayar sewa, tagihan listrik, dll."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Save payee as favorite toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={saveAsFav}
                  onChange={(e) => setSaveAsFav(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Simpan nomor rekening ini ke daftar Rekening Favorit</span>
              </label>

              {/* Step 6 Button: Konfirmasi dengan menekan tombol Ya/Benar */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Langkah 6: Konfirmasi Rincian Transfer ➔</span>
              </button>
            </form>
          </div>

          {/* Right Column: Important Transfer Rules (Section 7) & Quick Payees */}
          <div className="lg:col-span-5 space-y-5">
            {/* Hal Penting tentang Transfer (Bab 7) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Hal Penting tentang Transfer (Bab 7)</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✅</span>
                  <span>
                    <strong>Nomor rekening tujuan harus benar</strong>, karena setiap nomor itu unik dan diacak sistem secara otomatis.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✅</span>
                  <span>
                    <strong>Cek nama penerima:</strong> Sebelum mengirim, sistem selalu memverifikasi dan menampilkan nama pemilik rekening.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                  <span>
                    <strong>Jika nomor salah</strong>, uang bisa masuk ke rekening orang lain. Periksa kembali sebelum konfirmasi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold shrink-0">⏱️</span>
                  <span>
                    <strong>Langsung Masuk:</strong> Transfer antar rekening Bank Nusantara diproses seketika tanpa jeda waktu.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold shrink-0">📋</span>
                  <span>
                    <strong>Riwayat tercatat:</strong> Semua mutasi transfer tersimpan aman dan struk dapat dicetak ulang kapan saja.
                  </span>
                </li>
              </ul>
            </div>

            {/* Saved Payees */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Daftar Rekening Favorit</span>
                </h3>
              </div>
              <div className="space-y-2">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{fav.ownerName}</span>
                      <span className="font-mono text-amber-300 text-[11px]">{fav.accountNumber}</span>
                      <span className="text-[10px] text-slate-400 block">{fav.bankName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setDestAccount(fav.accountNumber);
                          setDestBank(fav.bankName);
                          lookupAccount(fav.accountNumber, fav.bankName === 'Bank Nusantara' ? 'BNUS' : fav.bankName);
                          setRecipientLookup({ found: true, name: fav.ownerName });
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Pilih
                      </button>
                      <button
                        onClick={() => deleteFavorite(fav.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus favorit"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
          )}
        </div>
      )}

      {/* TRANSFER CONFIRMATION MODAL (Step 6, 7, 8) */}
      {showTransferConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg text-white">Konfirmasi Rincian Transfer</h3>
              <p className="text-xs text-slate-400 mt-1">Langkah 6 & 7: Periksa kembali detail dan masukkan PIN Anda</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Penerima:</span>
                <span className="font-bold text-emerald-400">{recipientLookup?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">No. Rekening Tujuan:</span>
                <span className="font-mono font-bold text-amber-300">{destAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Tujuan:</span>
                <span>{destBank}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Nominal Transfer:</span>
                <span className="font-mono font-bold text-white">
                  {formatRupiah(parseInt(transferAmount, 10) || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Biaya Administrasi:</span>
                <span className="font-mono text-emerald-400">
                  {destBank.includes('Nusantara') ? 'Rp 0 (Bebas Biaya)' : 'Rp 6.500'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Langkah 7: Masukkan 6 Digit Kode PIN Anda:
              </label>
              <input
                type="password"
                maxLength={6}
                value={transferPin}
                onChange={(e) => setTransferPin(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-xl p-3 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-amber-400"
              />
            </div>

            {transferError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                {transferError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmTransferSubmit}
                disabled={transferPin.length !== 6}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                Langkah 8: Kirim Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowTransferConfirmModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: LAYANAN PINJAMAN ONLINE (Section 10)
         ========================================================================= */}
      {activeTab === 'pinjaman' && (
        <div className="space-y-6">
          {/* Header banner */}
          <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 rounded-3xl p-6 border border-cyan-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">
                  Layanan Resmi Bab 10
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                  Persetujuan Cepat 1x24 Jam
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Pinjaman Online Bank Nusantara
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                Layanan pinjaman uang tunai resmi tanpa perlu datang ke kantor cabang. Jika disetujui Admin, dana langsung dicairkan otomatis ke nomor rekening Anda.
              </p>
            </div>

            {/* Requirements Box (Section 10) */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-2xl text-xs text-slate-300 space-y-1">
              <span className="font-bold text-amber-300 block text-[11px] uppercase">
                Syarat Pengajuan (Bab 10):
              </span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Usia minimal 21 tahun & Identitas sah (KTP)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Rekening aktif Bank Nusantara & Penghasilan tetap</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Riwayat pembayaran lancar</span>
              </div>
            </div>
          </div>

          {/* 3 Loan Tier Cards Selector (Section 10) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.values(LOAN_TIER_CONFIGS).map((tier) => (
              <div
                key={tier.type}
                onClick={() => {
                  setSelectedLoanType(tier.type);
                  setLoanAmount(tier.minAmount);
                  setLoanTenor(tier.minTenor);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  selectedLoanType === tier.type
                    ? 'bg-slate-900 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {selectedLoanType === tier.type && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 font-bold text-[10px] px-3 py-0.5 rounded-bl-lg">
                    Dipilih
                  </div>
                )}
                <h3 className="font-bold text-white text-base">{tier.title}</h3>
                <span className="text-xs text-slate-400 block mt-0.5">{tier.idealFor}</span>

                <div className="my-3 space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plafon:</span>
                    <span className="font-mono font-bold text-amber-300">
                      {formatRupiah(tier.minAmount)} - {formatRupiah(tier.maxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jangka Waktu:</span>
                    <span className="font-semibold text-white">
                      {tier.minTenor} s/d {tier.maxTenor} Bulan
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bunga:</span>
                    <span className="font-bold text-emerald-400">
                      {(tier.interestRateMonthly * 100).toFixed(1)}% per bulan
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Loan Calculator & Application Form */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form & Sliders */}
            <form
              onSubmit={handleLoanSubmit}
              className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs"
            >
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>Kalkulator & Formulir Pengajuan ({activeLoanConfig.title})</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Langkah 3 & 4: Tentukan nominal, jangka waktu, dan data pekerjaan Anda.
                </p>
              </div>

              {/* Amount Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Nominal Pinjaman:</label>
                  <span className="text-base font-mono font-bold text-amber-300">
                    {formatRupiah(loanAmount)}
                  </span>
                </div>
                <input
                  type="range"
                  min={activeLoanConfig.minAmount}
                  max={activeLoanConfig.maxAmount}
                  step={500_000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{formatRupiah(activeLoanConfig.minAmount)}</span>
                  <span>{formatRupiah(activeLoanConfig.maxAmount)}</span>
                </div>
              </div>

              {/* Tenor Selector */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-300 font-semibold">Jangka Waktu (Tenor):</label>
                  <span className="font-bold text-white text-sm">{loanTenor} Bulan</span>
                </div>
                <input
                  type="range"
                  min={activeLoanConfig.minTenor}
                  max={activeLoanConfig.maxTenor}
                  step={selectedLoanType === 'kecil' ? 1 : selectedLoanType === 'menengah' ? 3 : 6}
                  value={loanTenor}
                  onChange={(e) => setLoanTenor(parseInt(e.target.value, 10))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{activeLoanConfig.minTenor} Bulan</span>
                  <span>{activeLoanConfig.maxTenor} Bulan</span>
                </div>
              </div>

              {/* Applicant Info Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Pekerjaan / Jabatan:</label>
                  <input
                    type="text"
                    required
                    value={loanJob}
                    onChange={(e) => setLoanJob(e.target.value)}
                    placeholder="Contoh: Manajer Operasional / Wiraswasta"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Penghasilan Tetap Bulanan:</label>
                  <input
                    type="number"
                    required
                    value={loanIncome}
                    onChange={(e) => setLoanIncome(e.target.value)}
                    placeholder="Contoh: 10000000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tujuan Penggunaan Dana:</label>
                <input
                  type="text"
                  required
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="Contoh: Renovasi tempat usaha, biaya pendidikan, ekspansi bisnis"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={loanSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <BadgeDollarSign className="w-4 h-4" />
                <span>Kirim Permohonan Pinjaman ke Admin (Langkah 5)</span>
              </button>
            </form>

            {/* Right Summary & Active Loans */}
            <div className="lg:col-span-5 space-y-5">
              {/* Calculation Summary Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3 text-xs">
                <h4 className="font-bold text-white text-sm">Simulasi Angsuran Pinjaman:</h4>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plafon Pokok:</span>
                    <span className="font-mono font-bold text-white">{formatRupiah(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Bunga ({loanTenor} bln):</span>
                    <span className="font-mono text-amber-300">{formatRupiah(totalLoanInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Pengembalian:</span>
                    <span className="font-mono font-bold text-white">{formatRupiah(totalRepaymentCalc)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-sm">
                    <span className="text-slate-300 font-semibold">Angsuran / Bulan:</span>
                    <span className="font-mono font-extrabold text-emerald-400">
                      {formatRupiah(monthlyInstallmentCalc)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active & Pending Loans List */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <h4 className="font-bold text-white text-sm">Daftar Pinjaman Anda:</h4>
                {currentAccountLoans.length === 0 ? (
                  <p className="text-xs text-slate-400">Belum ada pengajuan pinjaman aktif.</p>
                ) : (
                  <div className="space-y-2">
                    {currentAccountLoans.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white uppercase text-[11px]">
                            {l.loanType} • {formatRupiah(l.amount)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              l.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : l.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {l.status === 'approved'
                              ? 'Disetujui & Cair'
                              : l.status === 'pending'
                              ? '⏳ Sedang Diproses'
                              : 'Ditolak'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Angsuran: <strong className="text-white font-mono">{formatRupiah(l.monthlyInstallment)}/bln</strong> • Sisa:{' '}
                          <span className="text-amber-300 font-semibold">
                            {l.remainingInstallments ?? l.tenorMonths} bulan
                          </span>
                        </div>
                        {l.status === 'approved' && (l.remainingInstallments ?? 1) > 0 && (
                          <button
                            onClick={() => payLoanInstallment(l.id)}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            Bayar Angsuran Bulan Ini ({formatRupiah(l.monthlyInstallment)})
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MUTASI REKENING & LAPORAN BULANAN (Section 6 & 8)
         ========================================================================= */}
      {activeTab === 'mutasi' && (
        <div className="space-y-6">
          {/* Monthly Analytics Bar (Section 8: Laporan Bulanan) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <FileBarChart className="w-5 h-5 text-blue-400" />
                  <span>Laporan Keuangan & Mutasi Rekening (Bab 8)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Ringkasan seluruh pemasukan, pengeluaran, penarikan ATM, dan transfer periode Oktober 2026.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl px-2.5 py-1.5 text-xs"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="tarik">Tarik Tunai</option>
                  <option value="setor">Setor Tunai</option>
                  <option value="transfer">Transfer &amp; Transfer Bebas</option>
                  <option value="emas">Transaksi Emas 24K</option>
                  <option value="pinjaman">Pinjaman</option>
                </select>
              </div>
            </div>

            {/* Income vs Expense Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Total Dana Masuk (Bulan Ini)</span>
                </div>
                <div className="font-mono text-xl font-bold text-emerald-300 mt-1">
                  {formatRupiah(
                    currentAccountTransactions
                      .filter(
                        (tx) =>
                          tx.type === 'setor' ||
                          tx.type === 'transfer_in' ||
                          tx.type === 'transfer_bebas_in' ||
                          tx.type === 'jual_emas' ||
                          tx.type === 'pinjaman_disburse'
                      )
                      .reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Total Dana Keluar (Bulan Ini)</span>
                </div>
                <div className="font-mono text-xl font-bold text-rose-300 mt-1">
                  {formatRupiah(
                    currentAccountTransactions
                      .filter(
                        (tx) =>
                          tx.type === 'tarik' ||
                          tx.type === 'transfer_out' ||
                          tx.type === 'transfer_bebas_out' ||
                          tx.type === 'beli_emas' ||
                          tx.type === 'biaya_admin' ||
                          tx.type === 'pinjaman_bayar'
                      )
                      .reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Frekuensi Transaksi</span>
                </div>
                <div className="font-mono text-xl font-bold text-blue-300 mt-1">
                  {currentAccountTransactions.length} Transaksi
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-2 pt-2">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada transaksi yang cocok dengan pencarian.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          tx.type === 'setor' || tx.type === 'transfer_in' || tx.type === 'pinjaman_disburse' || tx.type === 'redeem_code'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {tx.type === 'setor' || tx.type === 'transfer_in' || tx.type === 'pinjaman_disburse' || tx.type === 'redeem_code' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-white block text-sm">
                          {tx.title || tx.description || 'Transaksi Bank Nusantara'}
                        </span>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>{formatIndoDate(tx.timestamp || (tx as any).date || new Date().toISOString())}</span>
                          <span>•</span>
                          <span className="font-mono">Ref: {tx.referenceNo || (tx as any).referenceCode || '-'}</span>
                          {tx.recipientBank && <span>• Bank: {tx.recipientBank}</span>}
                        </div>

                        {/* Status Kode Tukar: Hanya untuk Pulsa / Token Listrik / Voucher Game */}
                        {tx.generatedCode && tx.status === 'pending' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-semibold mt-1">
                            <Lock className="w-3.5 h-3.5 shrink-0" />
                            <span>⏳ Pesanan Sedang Diproses — Kode akan muncul setelah proses selesai</span>
                          </div>
                        )}
                        {tx.generatedCode && tx.status === 'success' && (
                          <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-[11px] mt-1">
                            <span className="text-slate-300">🔓 Kode Resmi Anda:</span>
                            <strong className="font-mono text-amber-300 tracking-wider">{tx.generatedCode}</strong>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard?.writeText(tx.generatedCode!)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Salin Kode
                            </button>
                          </div>
                        )}

                        {/* Status Persetujuan Pembeli untuk Pembelian Non-Kode (Beli Air/PDAM, Tagihan, Makanan, dll.) */}
                        {tx.requiresBuyerApproval && !tx.generatedCode && tx.status === 'pending' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-semibold mt-1">
                            <span>⏳ Pesanan Sedang Diproses</span>
                          </div>
                        )}
                        {tx.requiresBuyerApproval && !tx.generatedCode && tx.buyerApprovalStatus === 'waiting_buyer' && (
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold">
                              📦 Proses Selesai — Menunggu Persetujuan Pembeli
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const res = buyerApproveTransaction(tx.id);
                                setDashboardNotice(res.message);
                                setTimeout(() => setDashboardNotice(null), 5000);
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer shadow"
                            >
                              ✅ Setujui Pesanan (Persetujuan Pembeli)
                            </button>
                          </div>
                        )}
                        {tx.requiresBuyerApproval && !tx.generatedCode && tx.buyerApprovalStatus === 'approved' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>✅ Telah Disetujui Pembeli (Selesai)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div
                        className={`font-mono font-bold text-sm ${
                          tx.type === 'setor' || tx.type === 'transfer_in' || tx.type === 'pinjaman_disburse' || tx.type === 'redeem_code'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.type === 'setor' || tx.type === 'transfer_in' || tx.type === 'pinjaman_disburse' || tx.type === 'redeem_code'
                          ? `+${formatRupiah(tx.amount)}`
                          : `-${formatRupiah(tx.amount)}`}
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          tx.status === 'success'
                            ? tx.buyerApprovalStatus === 'waiting_buyer'
                              ? 'text-cyan-400'
                              : 'text-emerald-400'
                            : tx.status === 'pending'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.status === 'success'
                          ? tx.buyerApprovalStatus === 'waiting_buyer'
                            ? '📦 Menunggu Persetujuan Pembeli'
                            : tx.buyerApprovalStatus === 'approved'
                            ? '✅ Disetujui Pembeli & Selesai'
                            : 'Berhasil / Selesai'
                          : tx.status === 'pending'
                          ? '⏳ Sedang Diproses'
                          : '✕ Dibatalkan (Refund)'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: JADWAL PEMBAYARAN BERKALA (Section 8)
         ========================================================================= */}
      {activeTab === 'jadwal' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-purple-400" />
                  <span>Jadwalkan Pembayaran Berkala (Bab 8)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Atur agar uang otomatis ditransfer setiap bulan ke nomor rekening tujuan (misal: bayar sewa, sekolah, uang saku).
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Jadwal Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {currentAccountScheduled.map((sch) => (
                <div
                  key={sch.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block text-sm">{sch.title}</span>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      Penerima: {sch.recipientName} ({sch.recipientAccount})
                    </span>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-300">{formatRupiah(sch.amount)}</span>
                      <span className="text-slate-400">• Setiap Tgl {sch.dayOfMonth}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => toggleScheduledPayment(sch.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer ${
                        sch.active
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {sch.active ? 'Aktif' : 'Dijeda'}
                    </button>
                    <button
                      onClick={() => deleteScheduledPayment(sch.id)}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: PUSAT PENGATURAN LENGKAP & FITUR DIHAPUS
         ========================================================================= */}
      {activeTab === 'keamanan' && <CompleteSettingsView />}

      {/* MODAL GANTI NOMOR HP (Section 8 with OTP simulation) */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-white">Ubah Nomor HP Terdaftar</h3>
            <p className="text-slate-400 text-xs">
              Sesuai Bab 8, kode verifikasi (OTP) akan dikirimkan untuk memastikan keamanan akun.
            </p>

            {!otpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nomor HP Baru:</label>
                  <input
                    type="text"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setOtpSent(true)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl cursor-pointer"
                >
                  Kirim Kode OTP Verifikasi ➔
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 bg-blue-950/60 border border-blue-500/40 rounded-lg text-[11px] text-blue-200">
                  Kode OTP simulasi Anda adalah: <strong className="font-mono text-amber-300">8899</strong>
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Masukkan 4 Digit OTP:</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="8899"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center tracking-widest text-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (otpInput === '8899') {
                      updatePhone(currentAccount.id, newPhoneNumber);
                      setShowPhoneModal(false);
                    } else {
                      alert('Kode OTP salah! Coba ketik 8899');
                    }
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl cursor-pointer"
                >
                  Verifikasi & Simpan Nomor HP
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowPhoneModal(false)}
              className="w-full py-2 bg-slate-800 text-slate-400 font-semibold rounded-xl cursor-pointer mt-1"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* MODAL GANTI PIN */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-white">Ganti Kode PIN (6 Digit)</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">PIN Lama:</label>
                <input
                  type="password"
                  maxLength={6}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center text-base"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">PIN Baru (6 Digit):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center text-base"
                />
              </div>
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Konfirmasi PIN Baru:</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-center text-base"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (newPin !== confirmPin) {
                    alert('Konfirmasi PIN baru tidak cocok!');
                    return;
                  }
                  const res = changePin(currentAccount.id, oldPin, newPin);
                  if (res.success) {
                    setShowPinModal(false);
                    setOldPin('');
                    setNewPin('');
                    setConfirmPin('');
                  } else {
                    alert(res.message);
                  }
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl cursor-pointer"
              >
                Simpan PIN Baru
              </button>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH JADWAL PEMBAYARAN */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-white">Jadwalkan Pembayaran Berkala Baru</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Judul / Keperluan:</label>
                <input
                  type="text"
                  value={schTitle}
                  onChange={(e) => setSchTitle(e.target.value)}
                  placeholder="Contoh: Bayar Uang Kost, Kursus, Sekolah"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">No. Rekening Tujuan:</label>
                  <input
                    type="text"
                    value={schAccount}
                    onChange={(e) => setSchAccount(e.target.value)}
                    placeholder="1029384756"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nama Penerima:</label>
                  <input
                    type="text"
                    value={schName}
                    onChange={(e) => setSchName(e.target.value)}
                    placeholder="Nama Pemilik"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nominal (Rp):</label>
                  <input
                    type="number"
                    value={schAmount}
                    onChange={(e) => setSchAmount(e.target.value)}
                    placeholder="1000000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Setiap Tanggal (1-28):</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={schDay}
                    onChange={(e) => setSchDay(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const amt = parseInt(schAmount, 10) || 0;
                  if (!schTitle || !schAccount || amt <= 0) {
                    alert('Harap lengkapi semua kolom.');
                    return;
                  }
                  addScheduledPayment({
                    title: schTitle,
                    recipientAccount: schAccount,
                    recipientName: schName || 'Penerima Terjadwal',
                    recipientBank: 'Bank Nusantara',
                    amount: amt,
                    dayOfMonth: schDay,
                    nextExecutionDate: `2026-11-${String(schDay).padStart(2, '0')}`,
                    category: 'Rutin',
                  });
                  setShowScheduleModal(false);
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl cursor-pointer"
              >
                Simpan Jadwal Transfer
              </button>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECURE CARD PIN PROMPT FOR CARD LOCK / UNLOCK */}
      <PinPromptModal
        isOpen={showCardPinModal}
        title={currentAccount.cardStatus === 'frozen' ? 'Buka Blokir Kartu ATM Debit' : 'Kunci Kartu ATM Debit Sementara'}
        description={
          currentAccount.cardStatus === 'frozen'
            ? 'Masukkan 6 digit PIN kartu Anda untuk membuka kembali blokir kartu ATM Mandiri Debit.'
            : 'Masukkan 6 digit PIN kartu Anda untuk mengunci kartu sementara demi keamanan.'
        }
        targetAccountName={currentAccount.fullName}
        cardNumberSnippet={currentAccount.cardNumber}
        expectedPin={currentAccount.pin}
        onSuccess={() => {
          toggleCardFreezeWithPin(currentAccount.id, currentAccount.pin);
          setShowCardPinModal(false);
        }}
        onCancel={() => setShowCardPinModal(false)}
      />

      {/* ADMIN CODE MODAL FOR DIRECT CARD TIER SWITCH */}
      <AdminPinModal
        isOpen={Boolean(pendingTierSwitch)}
        title="Masukkan Kode Admin untuk Ganti Kartu"
        subtitle="GANTI KARTU TANPA BUAT KARTU BARU"
        description={`Untuk mengganti kartu Anda menjadi ${
          pendingTierSwitch ? CARD_TIER_CONFIGS[pendingTierSwitch].nameIndo : ''
        } tanpa harus membuat kartu baru, cukup masukkan 6 digit Kode Admin (Bukan Kode Kartu).`}
        onSuccess={() => {
          if (pendingTierSwitch) {
            switchCardWithAdminCode({
              adminCode: '159357',
              targetCardTier: pendingTierSwitch,
            });
            setPendingTierSwitch(null);
          }
        }}
        onCancel={() => setPendingTierSwitch(null)}
      />
    </div>
  );
};
