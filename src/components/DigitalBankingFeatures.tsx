/**
 * Bank Nusantara — 60+ Layanan Perbankan Digital Interaktif
 * Terintegrasi penuh dengan:
 * 1. Tukar Kode Redeem (Klaim hadiah saldo yang dibuat di Panel Admin dengan kuota orang & batas waktu aktif)
 * 2. Tukar Kode Pulsa & Tukar Kode Token Listrik (Menggunakan kode yang sudah dibeli nasabah)
 * 3. Masukkan & Lacak Resi Pengiriman + Tebus COD
 * 4. Pemotongan Saldo Langsung saat Beli Barang + Modal Pemberitahuan Menunggu Persetujuan Admin
 * 5. Sinkronisasi Otorisasi PIN Admin (159357) & Persetujuan Admin untuk seluruh 60+ Fitur
 */
import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Smartphone,
  Droplets,
  HeartHandshake,
  Wallet,
  QrCode,
  DollarSign,
  PiggyBank,
  FileText,
  Globe,
  Sliders,
  Lock,
  Unlock,
  Receipt,
  Calculator,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  X,
  Copy,
  Check,
  AlertCircle,
  Download,
  Gift,
  Package,
  Search,
  Clock,
  ShieldAlert,
  Plane,
  Gamepad2,
  GraduationCap,
  Heart,
  TrendingUp,
  Building2,
  CreditCard,
  Plus,
  BookOpen,
} from 'lucide-react';
import { useBank, PayBillResult } from '../context/BankContext';
import {
  CARD_TIER_CONFIGS,
  formatRupiah,
  isUnlimitedNumber,
  playAtmSound,
  getFeatureUltraDetailedExplanation,
} from '../utils/bankUtils';
import { CardTier, FeatureSecurityConfig } from '../types/bank';
import { PinPromptModal } from './PinPromptModal';
import { AdminPinModal } from './AdminPinModal';

interface DigitalBankingFeaturesProps {
  onNavigateToTab?: (tab: string) => void;
  onOpenUpgradeModal?: () => void;
}

export const DigitalBankingFeatures: React.FC<DigitalBankingFeaturesProps> = () => {
  const {
    currentAccount,
    applyCardUpgrade,
    payBill,
    pockets,
    addPocket,
    depositToPocket,
    withdrawFromPocket,
    openDeposito,
    createCardlessToken,
    updateCardSpendingLimit,
    toggleInternationalUsage,
    toggleCardFreezeWithPin,
    featureConfigs,
    getFeatureConfig,
    redeemCodes,
    claimRedeemCode,
    currentAccountPurchasedCodes,
    redeemPurchasedCode,
    resiList,
    addResiRecord,
    payResiCod,
    pendingBuyerApprovalTransactions,
    buyerApproveTransaction,
    buyerApproveAllTransactions,
  } = useBank();

  // Search & Category filter for 60+ features
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Active modal state
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedGenericFeature, setSelectedGenericFeature] = useState<FeatureSecurityConfig | null>(null);
  const [detailExplanationFeature, setDetailExplanationFeature] = useState<FeatureSecurityConfig | null>(null);

  // Admin PIN Gate when a feature has `requireAdminPin: true` set in Admin Panel
  const [pendingFeatureForAdminPin, setPendingFeatureForAdminPin] = useState<FeatureSecurityConfig | null>(null);

  // Prominent Purchase Receipt & Admin Approval Notice Modal
  const [lastPurchaseReceipt, setLastPurchaseReceipt] = useState<{
    title: string;
    customerId: string;
    result: PayBillResult;
  } | null>(null);

  // 1. Redeem Code state
  const [redeemInput, setRedeemInput] = useState<string>('');
  const [redeemSuccessData, setRedeemSuccessData] = useState<{
    code: string;
    rewardAmount: number;
    newBalance: number;
  } | null>(null);

  // 2. Tukar Pulsa & Tukar Token Listrik state
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [voucherTargetInput, setVoucherTargetInput] = useState<string>(currentAccount?.phone || '081289102345');
  const [tokenCodeInput, setTokenCodeInput] = useState<string>('');
  const [tokenMeterInput, setTokenMeterInput] = useState<string>('542109847163');
  const [redeemVoucherResult, setRedeemVoucherResult] = useState<string | null>(null);

  // 3. Masukkan & Lacak Resi state
  const [resiSearchInput, setResiSearchInput] = useState<string>('');
  const [showAddResiForm, setShowAddResiForm] = useState<boolean>(false);
  const [newResiNumber, setNewResiNumber] = useState<string>('SCP778192031');
  const [newResiCourier, setNewResiCourier] = useState<string>('SiCepat Halu');
  const [newResiSender, setNewResiSender] = useState<string>('Gadget Store Surabaya');
  const [newResiOrigin, setNewResiOrigin] = useState<string>('Surabaya');
  const [newResiDest, setNewResiDest] = useState<string>('Jakarta Selatan');
  const [newResiCod, setNewResiCod] = useState<string>('125000');

  // 4. Upgrade form state
  const [requestedTier, setRequestedTier] = useState<CardTier>('gold');
  const [upgradeIncome, setUpgradeIncome] = useState<string>('12000000');
  const [upgradeReason, setUpgradeReason] = useState<string>(
    'Memerlukan batas tarik tunai harian lebih tinggi untuk kelancaran transaksi usaha dan belanja bulanan.'
  );

  // 5. PLN state
  const [plnType, setPlnType] = useState<'token' | 'pascabayar'>('token');
  const [plnMeterId, setPlnMeterId] = useState<string>('542109847163');
  const [plnNominal, setPlnNominal] = useState<number>(100_000);

  // 6. Pulsa state
  const [pulsaOperator, setPulsaOperator] = useState<string>('Telkomsel');
  const [pulsaPhone, setPulsaPhone] = useState<string>(currentAccount?.phone || '081289102345');
  const [pulsaNominal, setPulsaNominal] = useState<number>(50_000);

  // 7. Generic Paid Feature state (for any of the 50+ paid features)
  const [genericTargetId, setGenericTargetId] = useState<string>('88019283741');
  const [genericAmount, setGenericAmount] = useState<number>(100_000);
  const [genericNote, setGenericNote] = useState<string>('');

  // 8. Cardless cash state
  const [cardlessNominal, setCardlessNominal] = useState<number>(200_000);
  const [cardlessPin, setCardlessPin] = useState<string>('');
  const [generatedCardlessToken, setGeneratedCardlessToken] = useState<string | null>(null);

  // 9. Deposito state
  const [depoPrincipal, setDepoPrincipal] = useState<number>(10_000_000);
  const [depoTenor, setDepoTenor] = useState<number>(6);

  // 10. Pocket state
  const [pocketTitle, setPocketTitle] = useState<string>('Tabungan Liburan Akhir Tahun');
  const [pocketTarget, setPocketTarget] = useState<number>(15_000_000);
  const [selectedPocketId, setSelectedPocketId] = useState<string | null>(null);
  const [pocketTransferAmt, setPocketTransferAmt] = useState<number>(500_000);

  // 11. Split bill state
  const [splitTotal, setSplitTotal] = useState<number>(360_000);
  const [splitPeople, setSplitPeople] = useState<number>(3);
  const [splitDesc, setSplitDesc] = useState<string>('Makan Malam Bersama Teman');

  // 12. Valas state
  const [valasCurrency, setValasCurrency] = useState<'USD' | 'SGD' | 'JPY' | 'EUR' | 'SAR'>('USD');
  const [valasAmount, setValasAmount] = useState<number>(100);

  // 13. Spending Limit & Freeze state
  const [tempLimit, setTempLimit] = useState<number>(currentAccount?.customSpendingLimit || 5_000_000);
  const [showLimitPinModal, setShowLimitPinModal] = useState<boolean>(false);
  const [showFreezePinModal, setShowFreezePinModal] = useState<boolean>(false);

  // 14. CS state
  const [csSubject, setCsSubject] = useState<string>('Pertanyaan Transaksi & Limit Kartu');
  const [csMessage, setCsMessage] = useState<string>('');
  const [csSent, setCsSent] = useState<boolean>(false);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!currentAccount) return null;

  const showNotification = (msg: string, isError = false) => {
    setFeedback({ type: isError ? 'error' : 'success', message: msg });
    playAtmSound(isError ? 'alert' : 'success');
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Open feature handler with Admin PIN check if configured in Admin Panel!
  const handleOpenFeature = (feat: FeatureSecurityConfig) => {
    const latestCfg = getFeatureConfig(feat.id) || feat;
    if (latestCfg.requireAdminPin) {
      setPendingFeatureForAdminPin(latestCfg);
      return;
    }
    launchFeatureModal(latestCfg);
  };

  const launchFeatureModal = (feat: FeatureSecurityConfig) => {
    if (feat.id === 'freeze') {
      setShowFreezePinModal(true);
      return;
    }
    const specialIds = [
      'redeem_code',
      'tukar_pulsa',
      'tukar_token',
      'lacak_resi',
      'upgrade',
      'pln',
      'pulsa',
      'cardless',
      'deposito',
      'pocket',
      'splitbill',
      'valas',
      'limits',
      'statement',
      'cs',
    ];
    if (specialIds.includes(feat.id)) {
      setRedeemVoucherResult(null);
      setRedeemSuccessData(null);
      setActiveModal(feat.id);
    } else {
      // Open universal interactive payment/purchase modal for any of the 50+ features
      setSelectedGenericFeature(feat);
      setGenericAmount(feat.defaultAmount || 100_000);
      setGenericTargetId(`ID-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setGenericNote(`Pembelian / Pembayaran ${feat.title}`);
      setActiveModal('generic_paid_feature');
    }
  };

  // SubmitPLN
  const handlePlnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = `PLN ${plnType === 'token' ? 'Token Prabayar' : 'Tagihan'} (${plnMeterId})`;
    const res = payBill('tagihan_listrik', title, plnNominal, plnMeterId, 'tagihan', 'pln');
    if (res.success) {
      setActiveModal(null);
      setLastPurchaseReceipt({
        title,
        customerId: plnMeterId,
        result: res,
      });
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Pulsa
  const handlePulsaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = `Voucher Pulsa ${pulsaOperator} Rp ${pulsaNominal.toLocaleString('id-ID')} (${pulsaPhone})`;
    const res = payBill('tagihan_pulsa', title, pulsaNominal, `${pulsaOperator} - ${pulsaPhone}`, 'tagihan', 'pulsa');
    if (res.success) {
      setActiveModal(null);
      setLastPurchaseReceipt({
        title,
        customerId: `${pulsaOperator} - ${pulsaPhone}`,
        result: res,
      });
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Generic 50+ Paid Feature
  const handleGenericFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGenericFeature) return;
    const title = `${selectedGenericFeature.title} (${genericTargetId})`;
    const res = payBill(
      'belanja_fitur',
      title,
      genericAmount,
      genericTargetId,
      'tagihan',
      selectedGenericFeature.id
    );
    if (res.success) {
      setActiveModal(null);
      setLastPurchaseReceipt({
        title,
        customerId: genericTargetId,
        result: res,
      });
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Redeem Code
  const handleClaimRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = claimRedeemCode(redeemInput);
    if (res.success && res.rewardAmount && res.newBalance) {
      setRedeemSuccessData({
        code: redeemInput.toUpperCase(),
        rewardAmount: res.rewardAmount,
        newBalance: res.newBalance,
      });
      setRedeemInput('');
      showNotification(res.message);
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Tukar Kode Pulsa
  const handleRedeemPulsaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = redeemPurchasedCode(voucherCodeInput, voucherTargetInput);
    if (res.success) {
      setRedeemVoucherResult(res.message);
      setVoucherCodeInput('');
      showNotification(res.message);
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Tukar Kode Token Listrik
  const handleRedeemTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = redeemPurchasedCode(tokenCodeInput, `Meteran PLN ${tokenMeterInput}`);
    if (res.success) {
      setRedeemVoucherResult(res.message);
      setTokenCodeInput('');
      showNotification(res.message);
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Add Resi
  const handleAddResiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addResiRecord({
      resiNumber: newResiNumber,
      courier: newResiCourier,
      sender: newResiSender,
      recipient: currentAccount.fullName,
      origin: newResiOrigin,
      destination: newResiDest,
      shippingFee: 20_000,
      codAmount: parseInt(newResiCod, 10) || 0,
    });
    if (res.success) {
      showNotification(res.message);
      setShowAddResiForm(false);
    } else {
      showNotification(res.message, true);
    }
  };

  // Submit Upgrade Kartu
  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inc = parseInt(upgradeIncome, 10) || 0;
    const res = applyCardUpgrade({
      requestedTier,
      monthlyIncome: inc,
      reason: upgradeReason,
    });
    showNotification(res.message, !res.success);
    if (res.success) setActiveModal(null);
  };

  // Valas Exchange Rates
  const VALAS_RATES: Record<string, { buy: number; sell: number; name: string }> = {
    USD: { buy: 15850, sell: 15950, name: 'US Dollar (Amerika Serikat)' },
    SGD: { buy: 11820, sell: 11920, name: 'Singapore Dollar' },
    JPY: { buy: 104.5, sell: 105.8, name: 'Japanese Yen (per 1 JPY)' },
    EUR: { buy: 17200, sell: 17350, name: 'Euro (Eropa)' },
    SAR: { buy: 4220, sell: 4260, name: 'Saudi Riyal (Umroh/Haji)' },
  };

  const getCategoryIcon = (feat: FeatureSecurityConfig) => {
    if (feat.id === 'redeem_code') return Gift;
    if (feat.id === 'tukar_pulsa' || feat.id === 'pulsa') return Smartphone;
    if (feat.id === 'tukar_token' || feat.id === 'pln') return Zap;
    if (feat.id === 'lacak_resi') return Package;
    if (feat.id === 'pdam') return Droplets;
    if (feat.id === 'bpjs') return HeartHandshake;
    if (feat.id === 'qris') return QrCode;
    if (feat.category === 'E-Wallet & QRIS') return Wallet;
    if (feat.category === 'Travel & Tiket') return Plane;
    if (feat.category === 'Hiburan & Gaya Hidup') return Gamepad2;
    if (feat.category === 'Pendidikan & Cicilan') return GraduationCap;
    if (feat.category === 'Zakat & Sosial') return Heart;
    if (feat.category === 'Investasi & Proteksi') return TrendingUp;
    if (feat.category === 'Pajak & Negara') return Building2;
    return Sparkles;
  };

  const categories = ['Semua', ...Array.from(new Set(featureConfigs.map((f) => f.category)))];
  const filteredFeatures = featureConfigs.filter((f) => {
    if (f.id === 'transfer') return false; // Transfer has its own main tab
    const matchesCat = selectedCategory === 'Semua' || f.category === selectedCategory;
    const matchesSearch =
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const myPulsaVouchers = currentAccountPurchasedCodes.filter((c) => c.type === 'pulsa');
  const myTokenVouchers = currentAccountPurchasedCodes.filter((c) => c.type === 'token_listrik');

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-xl transition-all ${
            feedback.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner with Active Pulsa & Meteran PLN kWh Counters */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-blue-950/70 rounded-3xl p-6 border border-amber-500/30 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              PORTAL {featureConfigs.length}+ LAYANAN DIGITAL & KODE VOUCHER
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
              Sistem Real-Time
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
            Pusat {featureConfigs.length}+ Fitur Perbankan, Tukar Kode Redeem, Pulsa, Token & Resi
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1">
            Setiap pembelian menggunakan uang akan <strong>langsung memotong saldo rekening Anda</strong> dan segera diproses oleh sistem. Pembelian non-kode (seperti Air/PDAM, tagihan, makanan, dll.) menggunakan <strong>Persetujuan Pembeli</strong> setelah selesai diproses.
          </p>
        </div>

        {/* Active Balances from Redeemed Codes */}
        <div className="grid grid-cols-3 gap-2.5 w-full lg:w-auto shrink-0 text-xs">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Saldo Rekening</span>
            <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm block mt-0.5">
              {formatRupiah(currentAccount.balance)}
            </span>
          </div>
          <div
            onClick={() => handleOpenFeature(getFeatureConfig('tukar_pulsa')!)}
            className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-center cursor-pointer hover:scale-105 transition-all"
          >
            <span className="text-[10px] text-blue-300 block">Pulsa HP Aktif</span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm block mt-0.5">
              {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.pulsaBalance)
                ? '∞ (Tidak Terbatas)'
                : formatRupiah(currentAccount.pulsaBalance || 0)}
            </span>
          </div>
          <div
            onClick={() => handleOpenFeature(getFeatureConfig('tukar_token')!)}
            className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-center cursor-pointer hover:scale-105 transition-all"
          >
            <span className="text-[10px] text-amber-300 block">Meteran Listrik</span>
            <span className="font-mono font-bold text-amber-300 text-xs sm:text-sm block mt-0.5">
              {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.plnKwhBalance)
                ? '∞ kWh'
                : `${currentAccount.plnKwhBalance || 42.5} kWh`}
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BANNER PERSETUJUAN PEMBELI (UNTUK PEMBELIAN AIR/PDAM & FITUR NON-KODE LAINNYA)
         ========================================================================= */}
      {pendingBuyerApprovalTransactions.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-2 border-emerald-400/70 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-sm sm:text-base">
                  Pesanan Selesai Diproses — Menunggu Persetujuan Pembeli ({pendingBuyerApprovalTransactions.length})
                </h3>
                <p className="text-xs text-emerald-200/90 mt-0.5">
                  Pembelian Air (PDAM) dan layanan yang tidak memakai kode tukar memerlukan <strong>Persetujuan Pembeli</strong> Anda di bawah ini.
                </p>
              </div>
            </div>
            {pendingBuyerApprovalTransactions.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  const res = buyerApproveAllTransactions();
                  showNotification(res.message);
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
                    {tx.title.replace('(Menunggu Persetujuan Pembeli)', '').trim()}
                  </span>
                  <span className="text-[11px] font-mono text-amber-300 block mt-0.5">
                    Nominal: {formatRupiah(tx.amount)} • ID/Tujuan: {tx.recipientAccount || '-'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const res = buyerApproveTransaction(tx.id);
                    showNotification(res.message);
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

      {/* 4 HIGHLIGHTED QUICK-ACCESS CARDS (Tukar Kode Redeem, Tukar Kode Pulsa/Voucher, Tukar Kode Token, Masukkan Resi) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => handleOpenFeature(getFeatureConfig('redeem_code')!)}
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-yellow-600/20 border-2 border-amber-400/60 hover:border-amber-300 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Input Kode Rahasia
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">🎁 Tukar Kode Redeem</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Ketik manual kode redeem resmi untuk klaim hadiah saldo (daftar kode aktif dirahasiakan).
          </p>
        </button>

        <button
          onClick={() => handleOpenFeature(getFeatureConfig('tukar_pulsa')!)}
          className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 via-slate-900 to-cyan-600/20 border-2 border-blue-400/60 hover:border-blue-300 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/40">
              Input Kode Manual
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">📱 Tukar Kode Pulsa & Voucher</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Masukkan kode voucher pulsa, game, atau paket yang sudah Anda beli (daftar kode disembunyikan).
          </p>
        </button>

        <button
          onClick={() => handleOpenFeature(getFeatureConfig('tukar_token')!)}
          className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-teal-600/20 border-2 border-emerald-400/60 hover:border-emerald-300 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              Input 20 Digit
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">⚡ Tukar Token Listrik</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Ketik manual 20 digit kode token PLN yang sudah Anda beli ke meteran (kode aktif disembunyikan).
          </p>
        </button>

        <button
          onClick={() => handleOpenFeature(getFeatureConfig('lacak_resi')!)}
          className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 via-slate-900 to-indigo-600/20 border-2 border-purple-400/60 hover:border-purple-300 text-left transition-all hover:scale-[1.02] cursor-pointer shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold shadow">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
              {resiList.length} Resi Terlacak
            </span>
          </div>
          <h3 className="font-bold text-white text-sm">📦 Masukkan & Cek Resi</h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Masukkan nomor resi paket ekspedisi dan bayar tagihan COD/Ongkir.
          </p>
        </button>
      </div>

      {/* SEARCH BAR & CATEGORY TABS FOR 60+ FEATURES */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dari 60+ fitur layanan (misal: Pulsa, PLN, Resi, Redeem, PDAM, Pesawat, Game, Zakat, Emas)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <span className="text-xs font-mono text-amber-300 font-bold shrink-0">
            Menampilkan {filteredFeatures.length} Fitur
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 60+ FEATURES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filteredFeatures.map((item) => {
          const Icon = getCategoryIcon(item);
          return (
            <div
              key={item.id}
              onClick={() => handleOpenFeature(item)}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 transition-all hover:scale-[1.02] cursor-pointer flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 text-amber-300 flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {item.requireAdminPin && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> PIN Otorisasi
                      </span>
                    )}
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/15 text-blue-300 border-blue-500/30">
                      ⚡ Layanan Digital
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-cyan-400 block mb-0.5">{item.category}</span>
                <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-blue-400 font-semibold group-hover:text-amber-300">
                  <span>{item.defaultAmount ? `Mulai ${formatRupiah(item.defaultAmount)}` : 'Buka Fitur'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailExplanationFeature(item);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-500/50 text-[10px] font-bold text-indigo-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>📚 Penjelasan Lengkap 100x Lipat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          PROMINENT MODAL: BUKTI POTONG SALDO & PEMBERITAHUAN PERSETUJUAN ADMIN
          (Muncul setiap kali nasabah membeli barang/layanan agar jelas saldo berkurang!)
         ========================================================================= */}
      {lastPurchaseReceipt && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Rincian Potong Saldo & Status</h3>
                  <p className="text-[11px] text-amber-300 font-mono">
                    Ref: {lastPurchaseReceipt.result.transaction?.referenceNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLastPurchaseReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Balance Deduction Breakdown Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="text-slate-400 text-[11px] font-semibold border-b border-slate-800 pb-2">
                Item Pembelian: <strong className="text-white block text-xs mt-0.5">{lastPurchaseReceipt.title}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Saldo Awal Sebelum Beli:</span>
                <span className="font-mono">{formatRupiah(lastPurchaseReceipt.result.previousBalance || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-rose-400 font-bold">
                <span>Nominal Saldo Terpotong:</span>
                <span className="font-mono text-sm">
                  - {formatRupiah(lastPurchaseReceipt.result.amountDeducted || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-800 pt-2 text-emerald-400 font-black text-sm">
                <span>Sisa Saldo Anda Sekarang:</span>
                <span className="font-mono">{formatRupiah(lastPurchaseReceipt.result.newBalance || 0)}</span>
              </div>
            </div>

            {/* Status Pemrosesan (TANPA memberi tahu membutuhkan persetujuan Admin) */}
            {lastPurchaseReceipt.result.requiresApproval ? (
              <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400/60 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                  <Clock className="w-5 h-5 animate-spin shrink-0" />
                  <span>⏳ TRANSAKSI SEDANG DIPROSES!</span>
                </div>
                <p className="text-amber-100 text-[11px] leading-relaxed">
                  Pembayaran Anda telah diterima dan saldo rekening Anda telah dikurangi sebesar{' '}
                  <strong>{formatRupiah(lastPurchaseReceipt.result.amountDeducted || 0)}</strong>. Saat ini pesanan Anda{' '}
                  <strong>sedang diproses oleh sistem</strong>.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Pembayaran Berhasil Diproses!</strong> Transaksi Anda telah selesai diverifikasi oleh sistem.
                </span>
              </div>
            )}

            {/* JIKA PRODUK NON-KODE (SEPERTI BELI AIR / PDAM, TAGIHAN, MAKANAN, DLL): JANGAN ADA KODE, PAKAI PERSETUJUAN PEMBELI! */}
            {lastPurchaseReceipt.result.requiresBuyerApproval && !lastPurchaseReceipt.result.hasPendingCode && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500/50 space-y-2.5 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-300 font-black text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>✅ TANPA KODE TUKAR — MENGGUNAKAN PERSETUJUAN PEMBELI</span>
                </div>
                {lastPurchaseReceipt.result.requiresApproval ? (
                  <p className="text-[11px] text-slate-200 leading-relaxed">
                    Layanan <strong>{lastPurchaseReceipt.title}</strong> ini tidak ditukar menggunakan kode. Saat ini pesanan sedang diproses. Setelah proses selesai, tombol <strong className="text-emerald-300">"Setujui Pesanan (Persetujuan Pembeli)"</strong> akan muncul di halaman ini dan di Mutasi Rekening Anda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-200 leading-relaxed">
                      Layanan <strong>{lastPurchaseReceipt.title}</strong> siap dikonfirmasi! Silakan berikan <strong>Persetujuan Pembeli</strong> Anda di bawah ini untuk menyelesaikan transaksi:
                    </p>
                    {lastPurchaseReceipt.result.transaction && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = buyerApproveTransaction(lastPurchaseReceipt.result.transaction!.id);
                          showNotification(res.message);
                          setLastPurchaseReceipt(null);
                        }}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg"
                      >
                        ✅ Setujui Pesanan Sekarang (Persetujuan Pembeli)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* JIKA PRODUK KODE TUKAR (PULSA / TOKEN LISTRIK / VOUCHER GAME) DAN SEDANG DIPROSES: SEMBUNYIKAN KODE DULU */}
            {lastPurchaseReceipt.result.requiresApproval && lastPurchaseReceipt.result.hasPendingCode && (
              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/50 space-y-2 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>⏳ KODE TUKAR SEDANG DIPROSES</span>
                </div>
                <div className="font-mono text-sm font-black text-slate-500 tracking-widest bg-black/60 p-2.5 rounded-xl border border-slate-800 select-none">
                  •••• - •••• - •••• - •••• (SEDANG DIPROSES)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Kode tukar (Pulsa / Token Listrik / Voucher) belum ditampilkan selama transaksi masih sedang diproses. Setelah proses selesai, kode resmi Anda akan langsung muncul di <strong>Notifikasi</strong> &amp; <strong>Mutasi Rekening</strong>.
                </p>
              </div>
            )}

            {/* If Purchased Code was generated AND does NOT require approval (Auto-approved) */}
            {!lastPurchaseReceipt.result.requiresApproval &&
              (lastPurchaseReceipt.result.voucherCode || lastPurchaseReceipt.result.tokenNumber) && (
                <div className="p-4 rounded-2xl bg-blue-950/80 border-2 border-blue-400 space-y-2.5 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-300 block">
                    {lastPurchaseReceipt.result.tokenNumber
                      ? '⚡ 20 DIGIT KODE TOKEN LISTRIK YANG ANDA BELI (SIMPAN KODE INI!):'
                      : '📱 16 DIGIT KODE VOUCHER YANG ANDA BELI (SIMPAN KODE INI!):'}
                  </span>
                  <div className="font-mono text-base sm:text-lg font-black text-amber-300 tracking-widest bg-black/50 p-2.5 rounded-xl border border-amber-400/40">
                    {lastPurchaseReceipt.result.tokenNumber || lastPurchaseReceipt.result.voucherCode}
                  </div>
                  <p className="text-[10px] text-amber-200">
                    ⚠️ Salin atau catat kode di atas sekarang! Demi keamanan, daftar kode aktif tidak akan ditampilkan pada layar penukaran kode.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleCopy(
                          (lastPurchaseReceipt.result.tokenNumber || lastPurchaseReceipt.result.voucherCode)!
                        )
                      }
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                    <button
                      onClick={() => {
                        const code = (lastPurchaseReceipt.result.tokenNumber ||
                          lastPurchaseReceipt.result.voucherCode)!;
                        const isToken = Boolean(lastPurchaseReceipt.result.tokenNumber);
                        setLastPurchaseReceipt(null);
                        if (isToken) {
                          setTokenCodeInput(code);
                          setActiveModal('tukar_token');
                        } else {
                          setVoucherCodeInput(code);
                          setActiveModal('tukar_pulsa');
                        }
                      }}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                    >
                      Tukarkan Kode Sekarang ➔
                    </button>
                  </div>
                </div>
              )}

            <button
              onClick={() => setLastPurchaseReceipt(null)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-bold rounded-xl cursor-pointer"
            >
              Mengerti & Tutup Bukti Pembelian
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: TUKAR KODE REDEEM (DIBUAT DI PANEL ADMIN — TANPA BOCORAN KODE AKTIF)
         ========================================================================= */}
      {activeModal === 'redeem_code' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Tukar Kode Redeem Hadiah Saldo</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {redeemSuccessData ? (
              <div className="p-5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-black text-lg text-white">Klaim Kode Redeem Berhasil! 🎉</h4>
                <p className="text-emerald-200">
                  Kode <strong className="font-mono text-amber-300">{redeemSuccessData.code}</strong> berhasil ditukarkan.
                </p>
                <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/40">
                  <span className="text-slate-400 block">Saldo Gratis Diterima:</span>
                  <span className="font-mono text-2xl font-black text-amber-300">
                    + {formatRupiah(redeemSuccessData.rewardAmount)}
                  </span>
                  <span className="text-emerald-300 block mt-1 font-mono">
                    Saldo Rekening Baru: {formatRupiah(redeemSuccessData.newBalance)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setRedeemSuccessData(null);
                    setActiveModal(null);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <>
                <form onSubmit={handleClaimRedeemSubmit} className="space-y-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Masukkan Kode Redeem Resmi:
                    </label>
                    <input
                      type="text"
                      required
                      value={redeemInput}
                      onChange={(e) => setRedeemInput(e.target.value.toUpperCase())}
                      placeholder="Ketik kode redeem rahasia Anda di sini..."
                      className="w-full bg-slate-950 border-2 border-amber-500/50 rounded-xl p-3 text-center font-mono text-base font-black text-amber-300 uppercase tracking-widest focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg"
                  >
                    🎁 Tukarkan Kode & Klaim Saldo Sekarang
                  </button>
                </form>

                {/* Informasi Keamanan — Daftar Kode Aktif Tidak Ditampilkan */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-slate-400">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong className="text-slate-200">Kerahasiaan Kode Redeem:</strong> Daftar kode redeem yang masih aktif tidak diberitahukan di halaman ini. Anda wajib mengetikkan sendiri kode redeem yang diberikan oleh Admin.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: TUKAR KODE VOUCHER PULSA & VOUCHER LAINNYA (TANPA BOCORAN KODE AKTIF)
         ========================================================================= */}
      {activeModal === 'tukar_pulsa' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">
                  Tukar Kode Pulsa & Voucher Lainnya (Pakai Kode yang Sudah Dibeli)
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {redeemVoucherResult && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{redeemVoucherResult}</span>
              </div>
            )}

            <form onSubmit={handleRedeemPulsaSubmit} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Masukkan 16 Digit Kode Voucher Pulsa / Kode Tukar Lainnya:
                </label>
                <input
                  type="text"
                  required
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  placeholder="Ketik 16 digit kode voucher yang Anda miliki..."
                  className="w-full bg-slate-950 border border-blue-500/60 rounded-xl p-3 font-mono text-sm font-bold text-amber-300 tracking-wider text-center"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nomor HP / ID Akun Tujuan Penukaran:
                </label>
                <input
                  type="text"
                  required
                  value={voucherTargetInput}
                  onChange={(e) => setVoucherTargetInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer shadow-lg"
              >
                📱 Tukarkan Kode Sekarang
              </button>
            </form>

            {/* Informasi Keamanan — Daftar Kode Voucher Aktif Tidak Ditampilkan */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-slate-400">
                <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong className="text-slate-200">Kerahasiaan Kode Voucher:</strong> Daftar kode aktif tidak ditampilkan di sini. Selain itu, kode yang baru dibeli akan muncul di <strong>Notifikasi</strong> atau <strong>Mutasi Rekening</strong> setelah pesanan selesai diproses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('pulsa')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] cursor-pointer"
              >
                + Beli Kode Voucher Pulsa Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: TUKAR KODE TOKEN LISTRIK PLN (TANPA BOCORAN KODE AKTIF)
         ========================================================================= */}
      {activeModal === 'tukar_token' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">
                  Masukkan Kode Token Listrik ke Meteran PLN
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated PLN LCD Meter Screen */}
            <div className="p-4 rounded-2xl bg-emerald-950 border-4 border-slate-700 font-mono space-y-1 shadow-inner">
              <div className="flex justify-between text-[10px] text-emerald-400">
                <span>METERAN PRABAYAR PLN • ID: {tokenMeterInput}</span>
                <span>STATUS: AKTIF</span>
              </div>
              <div className="text-2xl font-black text-amber-300 tracking-wider">
                SISA DAYA: {currentAccount.plnKwhBalance || 42.5} kWh
              </div>
              <div className="text-xs text-emerald-200 truncate">
                INPUT STROOM: {tokenCodeInput || '____-____-____-____-____'}
              </div>
            </div>

            {redeemVoucherResult && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-200 font-bold">
                {redeemVoucherResult}
              </div>
            )}

            <form onSubmit={handleRedeemTokenSubmit} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Masukkan 20 Digit Kode Stroom Token yang Sudah Anda Beli:
                </label>
                <input
                  type="text"
                  required
                  value={tokenCodeInput}
                  onChange={(e) => setTokenCodeInput(e.target.value)}
                  placeholder="Ketik 20 digit kode stroom token Anda..."
                  className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl p-3 font-mono text-sm font-bold text-amber-300 tracking-widest text-center"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  ID Pelanggan / Nomor Meteran PLN:
                </label>
                <input
                  type="text"
                  required
                  value={tokenMeterInput}
                  onChange={(e) => setTokenMeterInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg"
              >
                ⚡ Tekan ENTER (Masukkan Token ke Meteran)
              </button>
            </form>

            {/* Informasi Keamanan — Daftar Kode Token Aktif Tidak Ditampilkan */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-2.5 text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong className="text-slate-200">Kerahasiaan Kode Token:</strong> Daftar token aktif tidak ditampilkan di layar ini, dan token yang baru dibeli akan muncul di <strong>Notifikasi</strong> atau <strong>Mutasi Rekening</strong> setelah pesanan selesai diproses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('pln')}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] cursor-pointer"
              >
                + Beli Kode Token Listrik Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: MASUKKAN & LACAK RESI PENGIRIMAN + BAYAR COD
         ========================================================================= */}
      {activeModal === 'lacak_resi' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">
                  Masukkan & Lacak Nomor Resi Ekspedisi + Bayar COD
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={resiSearchInput}
                onChange={(e) => setResiSearchInput(e.target.value)}
                placeholder="Cari nomor resi atau nama kurir (misal: JNE8829104492)..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowAddResiForm(!showAddResiForm)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Masukkan Resi Baru</span>
              </button>
            </div>

            {showAddResiForm && (
              <form onSubmit={handleAddResiSubmit} className="p-4 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-3">
                <h4 className="font-bold text-purple-300">Tambah / Masukkan Nomor Resi Baru</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-400 block mb-1">Nomor Resi:</label>
                    <input
                      type="text"
                      required
                      value={newResiNumber}
                      onChange={(e) => setNewResiNumber(e.target.value.toUpperCase())}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Ekspedisi Kurir:</label>
                    <select
                      value={newResiCourier}
                      onChange={(e) => setNewResiCourier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option>JNE Express Reguler</option>
                      <option>J&T Express EZ</option>
                      <option>SiCepat Halu</option>
                      <option>AnterAja Reguler</option>
                      <option>Shopee Express (SPX)</option>
                      <option>Pos Indonesia Kilat</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Nama Pengirim / Toko:</label>
                    <input
                      type="text"
                      required
                      value={newResiSender}
                      onChange={(e) => setNewResiSender(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Tagihan COD (Rp):</label>
                    <input
                      type="number"
                      value={newResiCod}
                      onChange={(e) => setNewResiCod(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Kota Asal:</label>
                    <input
                      type="text"
                      value={newResiOrigin}
                      onChange={(e) => setNewResiOrigin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Kota Tujuan:</label>
                    <input
                      type="text"
                      value={newResiDest}
                      onChange={(e) => setNewResiDest(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl cursor-pointer">
                  Simpan & Lacak Nomor Resi Ini
                </button>
              </form>
            )}

            <div className="space-y-3">
              {resiList
                .filter(
                  (r) =>
                    r.resiNumber.toLowerCase().includes(resiSearchInput.toLowerCase()) ||
                    r.courier.toLowerCase().includes(resiSearchInput.toLowerCase())
                )
                .map((resi) => (
                  <div key={resi.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-300 text-sm">{resi.resiNumber}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                            {resi.courier}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                            {resi.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Dari: <strong className="text-white">{resi.sender}</strong> ({resi.origin} ➔ {resi.destination})
                        </span>
                      </div>

                      {!resi.paidViaBank ? (
                        <button
                          onClick={() => {
                            const res = payResiCod(resi.id);
                            if (res.success) {
                              setActiveModal(null);
                              setLastPurchaseReceipt({
                                title: `Tebus Resi & COD ${resi.courier} (${resi.resiNumber})`,
                                customerId: resi.resiNumber,
                                result: res,
                              });
                            } else {
                              showNotification(res.message, true);
                            }
                          }}
                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shrink-0"
                        >
                          Bayar COD & Ongkir ({formatRupiah((resi.codAmount || 0) + resi.shippingFee)})
                        </button>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                          ✓ COD Lunas via Bank
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 pl-2 border-l-2 border-purple-500/40">
                      {resi.history.map((h, i) => (
                        <div key={i} className="text-[11px]">
                          <span className="text-purple-300 font-mono">{h.time}</span> —{' '}
                          <strong className="text-white">{h.location}:</strong>{' '}
                          <span className="text-slate-300">{h.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: BELI TOKEN & BAYAR LISTRIK PLN
         ========================================================================= */}
      {activeModal === 'pln' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="font-bold text-base text-white">Beli Kode Token & Tagihan Listrik PLN</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePlnSubmit} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPlnType('token')}
                  className={`flex-1 py-2 rounded-xl font-bold cursor-pointer border ${
                    plnType === 'token' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Token Listrik Prabayar
                </button>
                <button
                  type="button"
                  onClick={() => setPlnType('pascabayar')}
                  className={`flex-1 py-2 rounded-xl font-bold cursor-pointer border ${
                    plnType === 'pascabayar' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  Tagihan Pascabayar
                </button>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nomor Meter / ID Pelanggan PLN:</label>
                <input
                  type="text"
                  required
                  value={plnMeterId}
                  onChange={(e) => setPlnMeterId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Pilih Nominal Token (Rp):</label>
                <div className="grid grid-cols-3 gap-2">
                  {[20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setPlnNominal(nom)}
                      className={`p-2.5 rounded-xl font-mono font-bold border cursor-pointer ${
                        plnNominal === nom ? 'border-amber-400 bg-amber-500/20 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      {formatRupiah(nom)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-lg"
              >
                Beli Token Sekarang ({formatRupiah(plnNominal)}) ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 6: BELI PULSA & PAKET DATA
         ========================================================================= */}
      {activeModal === 'pulsa' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Beli Kode Voucher Pulsa & Paket Data</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePulsaSubmit} className="space-y-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Operator Seluler:</label>
                <select
                  value={pulsaOperator}
                  onChange={(e) => setPulsaOperator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option>Telkomsel</option>
                  <option>Indosat Ooredoo (IM3)</option>
                  <option>XL Axiata</option>
                  <option>Tri (3)</option>
                  <option>Smartfren</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nomor HP Tujuan:</label>
                <input
                  type="text"
                  required
                  value={pulsaPhone}
                  onChange={(e) => setPulsaPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Pilih Nominal Pulsa:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[25_000, 50_000, 100_000, 150_000, 200_000, 500_000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setPulsaNominal(nom)}
                      className={`p-2.5 rounded-xl font-mono font-bold border cursor-pointer ${
                        pulsaNominal === nom ? 'border-blue-400 bg-blue-500/20 text-blue-300' : 'border-slate-800 bg-slate-950 text-slate-300'
                      }`}
                    >
                      {formatRupiah(nom)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl cursor-pointer shadow-lg"
              >
                Beli Kode Voucher Pulsa ({formatRupiah(pulsaNominal)}) ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 7: UNIVERSAL INTERACTIVE PURCHASE MODAL FOR ALL 50+ PAID FEATURES
         ========================================================================= */}
      {activeModal === 'generic_paid_feature' && selectedGenericFeature && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">{selectedGenericFeature.category}</span>
                <h3 className="font-bold text-base text-white">{selectedGenericFeature.title}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              {selectedGenericFeature.description}
            </p>

            {/* Info pemrosesan tanpa memberitahu wajib persetujuan admin */}
            <div className="p-2.5 rounded-xl border bg-blue-500/10 border-blue-500/30 text-blue-200 text-[11px] flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-blue-400" />
              <span>
                Pembayaran langsung memotong saldo rekening Anda dan pesanan segera diproses oleh sistem. Untuk layanan non-kode (seperti Air/PDAM, tagihan, makanan, dll.), konfirmasi menggunakan <strong>Persetujuan Pembeli</strong> setelah diproses.
              </span>
            </div>

            <form onSubmit={handleGenericFeatureSubmit} className="space-y-3.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nomor Pelanggan / Tujuan / Kode Booking:
                </label>
                <input
                  type="text"
                  required
                  value={genericTargetId}
                  onChange={(e) => setGenericTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nominal Pembayaran / Pembelian (Rp):
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={genericAmount}
                  onChange={(e) => setGenericAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-sm"
                />
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {[50_000, 150_000, 500_000].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setGenericAmount(q)}
                      className="py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-mono text-[10px] text-slate-200 cursor-pointer"
                    >
                      {formatRupiah(q)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Catatan Tambahan:</label>
                <input
                  type="text"
                  value={genericNote}
                  onChange={(e) => setGenericNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg"
              >
                Bayar Sekarang ({formatRupiah(genericAmount)}) ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          OTHER SPECIALIZED MODALS (UPGRADE, CARDLESS, DEPOSITO, POCKET, SPLITBILL, VALAS, LIMITS, STATEMENT, CS)
         ========================================================================= */}
      {activeModal === 'upgrade' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Ajukan Upgrade Jenis Kartu</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpgradeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {Object.values(CARD_TIER_CONFIGS)
                  .filter((cfg) => cfg.tier !== 'regular')
                  .map((cfg) => (
                    <div
                      key={cfg.tier}
                      onClick={() => setRequestedTier(cfg.tier)}
                      className={`p-3 rounded-xl border cursor-pointer ${
                        requestedTier === cfg.tier
                          ? 'border-amber-400 bg-amber-500/15'
                          : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      <span className="font-bold text-white block">{cfg.nameIndo}</span>
                      <span className="text-amber-300 font-mono text-[11px]">
                        Limit: {formatRupiah(cfg.dailyWithdrawalLimit)}/hr
                      </span>
                    </div>
                  ))}
              </div>
              <input
                type="number"
                value={upgradeIncome}
                onChange={(e) => setUpgradeIncome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                placeholder="Penghasilan Bulanan"
              />
              <textarea
                rows={2}
                value={upgradeReason}
                onChange={(e) => setUpgradeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
              <button type="submit" className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">
                Kirim Pengajuan Upgrade Kartu ➔
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'cardless' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Tarik Tunai Tanpa Kartu (Cardless)</h3>
              <button onClick={() => { setActiveModal(null); setGeneratedCardlessToken(null); }} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {generatedCardlessToken === 'PENDING_ADMIN' ? (
              <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/50 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-xs uppercase">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>⏳ PERMINTAAN SEDANG DIPROSES</span>
                </div>
                <div className="font-mono text-base font-black text-slate-500 tracking-widest bg-black/60 p-2.5 rounded-xl border border-slate-800">
                  •••••• (SEDANG DIPROSES)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Saldo sebesar <strong className="text-amber-300">{formatRupiah(cardlessNominal)}</strong> telah dipotong dan permintaan kode tarik tunai Anda saat ini <strong>sedang diproses</strong>. Kode akan otomatis muncul di Notifikasi &amp; Mutasi Rekening Anda setelah proses selesai.
                </p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    setGeneratedCardlessToken(null);
                    setCardlessPin('');
                  }}
                  className="w-full py-2.5 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Mengerti &amp; Tutup
                </button>
              </div>
            ) : generatedCardlessToken ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-3">
                <span className="text-slate-400 block">6 Digit Kode Tarik Tunai ATM:</span>
                <div className="font-mono text-3xl font-black text-amber-300 tracking-widest">{generatedCardlessToken}</div>
                <button onClick={() => { setActiveModal(null); setGeneratedCardlessToken(null); setCardlessPin(''); }} className="w-full py-2.5 bg-emerald-600 font-bold rounded-xl cursor-pointer">
                  Selesai
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = createCardlessToken(cardlessNominal, cardlessPin);
                  if (res.success) {
                    if (res.requiresApproval) {
                      setGeneratedCardlessToken('PENDING_ADMIN');
                    } else if (res.token) {
                      setGeneratedCardlessToken(res.token.tokenCode);
                    }
                  } else {
                    showNotification(res.message, true);
                  }
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  {[100_000, 200_000, 500_000].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCardlessNominal(n)}
                      className={`p-2.5 rounded-xl font-mono font-bold border cursor-pointer ${
                        cardlessNominal === n ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300' : 'border-slate-800 bg-slate-950'
                      }`}
                    >
                      {formatRupiah(n)}
                    </button>
                  ))}
                </div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Masukkan 6 Digit PIN Kartu Anda"
                  value={cardlessPin}
                  onChange={(e) => setCardlessPin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-center font-mono text-white"
                />
                <button type="submit" className="w-full py-3 bg-emerald-600 font-bold rounded-xl cursor-pointer">
                  Buat Kode Tarik Tunai
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeModal === 'deposito' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Buka Deposito Berjangka Online</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = openDeposito(depoPrincipal, depoTenor);
                showNotification(res.message, !res.success);
                if (res.success) setActiveModal(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-300 block mb-1">Nominal Pokok Deposito (Min Rp 5.000.000):</label>
                <input
                  type="number"
                  min={5000000}
                  step={1000000}
                  value={depoPrincipal}
                  onChange={(e) => setDepoPrincipal(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold"
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDepoTenor(m)}
                    className={`p-2 rounded-xl font-bold border cursor-pointer ${
                      depoTenor === m ? 'border-indigo-400 bg-indigo-500/20 text-indigo-300' : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    {m} Bln
                  </button>
                ))}
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl cursor-pointer">
                Tempatkan Deposito Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'pocket' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Kantong Impian (Celengan)</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {pockets.map((pkt) => (
                <div key={pkt.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{pkt.title}</span>
                    <span className="text-amber-300 font-mono">
                      {formatRupiah(pkt.currentAmount)} / {formatRupiah(pkt.targetAmount)}
                    </span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        const res = depositToPocket(pkt.id, 250_000);
                        showNotification(res.message, !res.success);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 rounded-lg font-bold cursor-pointer"
                    >
                      + Nabung 250rb
                    </button>
                    <button
                      onClick={() => {
                        const res = withdrawFromPocket(pkt.id, 250_000);
                        showNotification(res.message, !res.success);
                      }}
                      className="px-2.5 py-1 bg-slate-800 rounded-lg font-bold cursor-pointer"
                    >
                      Tarik
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addPocket({
                  title: pocketTitle,
                  targetAmount: pocketTarget,
                  color: 'from-amber-600 to-yellow-600',
                  icon: 'PiggyBank',
                });
                showNotification('Celengan baru berhasil dibuat!');
              }}
              className="pt-3 border-t border-slate-800 flex gap-2"
            >
              <input
                type="text"
                required
                value={pocketTitle}
                onChange={(e) => setPocketTitle(e.target.value)}
                placeholder="Nama Target Tabungan"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
              />
              <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">
                + Buat
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'splitbill' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Split Bill (Kalkulator Patungan)</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={splitDesc}
                onChange={(e) => setSplitDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={splitTotal}
                  onChange={(e) => setSplitTotal(parseInt(e.target.value, 10) || 0)}
                  className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono"
                />
                <input
                  type="number"
                  min={2}
                  value={splitPeople}
                  onChange={(e) => setSplitPeople(Math.max(1, parseInt(e.target.value, 10) || 2))}
                  className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 text-center">
                <span className="text-slate-400 block">Tagihan Per Orang ({splitPeople} Orang):</span>
                <span className="font-mono text-2xl font-black text-cyan-300">
                  {formatRupiah(Math.ceil(splitTotal / splitPeople))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'valas' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Kurs & Pembelian Valuta Asing</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(VALAS_RATES).map(([curr, rate]) => (
                <button
                  key={curr}
                  onClick={() => setValasCurrency(curr as any)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                    valasCurrency === curr ? 'border-teal-400 bg-teal-500/20' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  <span className="font-bold block">{curr}</span>
                  <span className="text-[10px] text-teal-300 font-mono">{formatRupiah(rate.sell)}</span>
                </button>
              ))}
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
              <span>Jumlah {valasCurrency}:</span>
              <input
                type="number"
                min={1}
                value={valasAmount}
                onChange={(e) => setValasAmount(parseInt(e.target.value, 10) || 1)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-right font-mono text-white"
              />
            </div>
            <button
              onClick={() => {
                const totalRp = Math.round(valasAmount * VALAS_RATES[valasCurrency].sell);
                const title = `Pembelian Valas ${valasAmount} ${valasCurrency}`;
                const res = payBill('belanja_fitur', title, totalRp, `VALAS-${valasCurrency}`, 'investasi', 'valas');
                if (res.success) {
                  setActiveModal(null);
                  setLastPurchaseReceipt({
                    title,
                    customerId: `Dompet Valas ${valasCurrency}`,
                    result: res,
                  });
                } else {
                  showNotification(res.message, true);
                }
              }}
              className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl cursor-pointer"
            >
              Beli {valasAmount} {valasCurrency} ({formatRupiah(Math.round(valasAmount * VALAS_RATES[valasCurrency].sell))})
            </button>
          </div>
        </div>
      )}

      {activeModal === 'limits' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Atur Limit Transaksi Harian</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Batas Belanja Harian:</span>
                <span className="font-mono font-bold text-amber-300">{formatRupiah(tempLimit)}</span>
              </div>
              <input
                type="range"
                min="500000"
                max={CARD_TIER_CONFIGS[currentAccount.cardTier].dailyWithdrawalLimit}
                step="500000"
                value={tempLimit}
                onChange={(e) => setTempLimit(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400"
              />
              <button
                onClick={() => setShowLimitPinModal(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl cursor-pointer"
              >
                Simpan Pengaturan (Butuh PIN Kartu) ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'cs' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Layanan CS & Pengaduan 24 Jam</h3>
              <button onClick={() => { setActiveModal(null); setCsSent(false); }} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {csSent ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-base">Tiket Pengaduan Terkirim!</h4>
                <button onClick={() => { setActiveModal(null); setCsSent(false); }} className="w-full py-2 bg-blue-600 font-bold rounded-xl cursor-pointer">
                  Tutup
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCsSent(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  value={csSubject}
                  onChange={(e) => setCsSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
                <textarea
                  rows={3}
                  required
                  value={csMessage}
                  onChange={(e) => setCsMessage(e.target.value)}
                  placeholder="Tuliskan kendala Anda..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
                <button type="submit" className="w-full py-3 bg-purple-600 font-bold rounded-xl cursor-pointer">
                  Kirim Pengaduan
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeModal === 'statement' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">e-Statement / Rekening Koran Resmi</h3>
              <button onClick={() => setActiveModal(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Nama:</span> <strong className="text-white">{currentAccount.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span>No. Rekening:</span> <strong className="text-amber-300">{currentAccount.accountNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>Saldo Efektif:</span> <strong className="text-emerald-400">{formatRupiah(currentAccount.balance)}</strong>
              </div>
            </div>
            <button
              onClick={() => {
                showNotification('e-Statement PDF berhasil diunduh!');
                setActiveModal(null);
              }}
              className="w-full py-3 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Unduh e-Statement (PDF)</span>
            </button>
          </div>
        </div>
      )}

      {/* Admin PIN Gate Modal if Admin enabled `requireAdminPin` for a feature */}
      <AdminPinModal
        isOpen={Boolean(pendingFeatureForAdminPin)}
        onSuccess={() => {
          if (pendingFeatureForAdminPin) {
            const feat = pendingFeatureForAdminPin;
            setPendingFeatureForAdminPin(null);
            launchFeatureModal(feat);
          }
        }}
        onCancel={() => setPendingFeatureForAdminPin(null)}
      />

      {/* PIN Prompt for Limit changes */}
      <PinPromptModal
        isOpen={showLimitPinModal}
        title="Verifikasi PIN Ubah Limit"
        description="Masukkan 6 digit PIN kartu Anda untuk mengonfirmasi perubahan limit transaksi harian."
        targetAccountName={currentAccount.fullName}
        cardNumberSnippet={currentAccount.cardNumber}
        expectedPin={currentAccount.pin}
        onSuccess={() => {
          updateCardSpendingLimit(tempLimit);
          setShowLimitPinModal(false);
          setActiveModal(null);
          showNotification(`Limit harian berhasil diubah menjadi ${formatRupiah(tempLimit)}`);
        }}
        onCancel={() => setShowLimitPinModal(false)}
      />

      {/* =========================================================================
          MODAL: ENSIKLOPEDIA & PENJELASAN LENGKAP 100x LIPAT UNTUK SETIAP FITUR
         ========================================================================= */}
      {detailExplanationFeature && (() => {
        const exp = getFeatureUltraDetailedExplanation(detailExplanationFeature);
        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-indigo-500/60 text-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-xs my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 sticky top-0 bg-slate-900 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 text-amber-300 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        DOKUMENTASI 100x LIPAT • {detailExplanationFeature.category}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        ID: {detailExplanationFeature.id}
                      </span>
                    </div>
                    <h3 className="font-black text-base sm:text-lg text-white mt-1">
                      {detailExplanationFeature.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setDetailExplanationFeature(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Ringkasan Eksekutif */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
                  1. Ringkasan Eksekutif & Definisi Layanan (100x Detail)
                </h4>
                <p className="text-slate-200 leading-relaxed text-xs">
                  {exp.executiveSummary}
                </p>
              </div>

              {/* 2. SOP Langkah demi Langkah */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="font-extrabold text-cyan-300 text-xs uppercase tracking-wider">
                  2. Standar Operasional Prosedur (SOP) Langkah demi Langkah
                </h4>
                <div className="space-y-2">
                  {exp.stepByStepSop.map((step, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-slate-200 leading-relaxed">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Arsitektur Teknis & Keamanan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-1.5">
                  <h4 className="font-extrabold text-indigo-300 text-xs uppercase tracking-wider">
                    3. Arsitektur Core-Banking & Ledger
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {exp.technicalArchitecture}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                  <h4 className="font-extrabold text-emerald-300 text-xs uppercase tracking-wider">
                    4. Protokol Keamanan & Otorisasi Berlapis
                  </h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {exp.securityAndCompliance}
                  </p>
                </div>
              </div>

              {/* 5. Simulasi Perhitungan Keuangan */}
              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/40 space-y-1.5">
                <h4 className="font-extrabold text-amber-300 text-xs uppercase tracking-wider">
                  5. Simulasi Perhitungan Saldo, Limit & Kuota
                </h4>
                <p className="text-slate-200 leading-relaxed text-xs font-mono">
                  {exp.financialSimulation}
                </p>
              </div>

              {/* 6. Tanya Jawab (FAQ) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="font-extrabold text-purple-300 text-xs uppercase tracking-wider">
                  6. Tanya Jawab Komprehensif (FAQ Nasabah & Admin)
                </h4>
                <div className="space-y-2">
                  {exp.faqList.map((faq, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <span className="font-bold text-amber-300 block">Q: {faq.q}</span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">A: {faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 sticky bottom-0 bg-slate-900 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const feat = detailExplanationFeature;
                    setDetailExplanationFeature(null);
                    handleOpenFeature(feat);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Langsung Gunakan Fitur "{detailExplanationFeature.title}"</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailExplanationFeature(null)}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Tutup Penjelasan
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PIN Prompt for Freeze / Unfreeze */}
      <PinPromptModal
        isOpen={showFreezePinModal}
        title={currentAccount.cardStatus === 'frozen' ? 'Buka Blokir Kartu' : 'Kunci Kartu Sementara'}
        description="Masukkan 6 digit PIN kartu Anda untuk mengubah status kunci kartu ATM."
        targetAccountName={currentAccount.fullName}
        cardNumberSnippet={currentAccount.cardNumber}
        expectedPin={currentAccount.pin}
        onSuccess={() => {
          toggleCardFreezeWithPin(currentAccount.id, currentAccount.pin);
          setShowFreezePinModal(false);
          showNotification('Status kunci kartu berhasil diperbarui!');
        }}
        onCancel={() => setShowFreezePinModal(false)}
      />
    </div>
  );
};
