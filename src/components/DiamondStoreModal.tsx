import React, { useMemo, useState } from 'react';
import {
  X,
  Gem,
  Search,
  Sparkles,
  QrCode,
  ArrowRightLeft,
  ArrowUpCircle,
  CheckCircle2,
  Lock,
  Clock,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  DIAMOND_FEATURE_METADATA,
  DIAMOND_PACKAGES_250,
  MAX_DIAMOND_PACKAGE_AMOUNT,
  MAX_DIAMOND_PURCHASE_RUPIAH,
  calculateDiamondPurchasePrice,
  calculateDiamondsFromRupiahBudget,
  getEffectiveDiamondPurchaseLimits,
} from '../data/diamondCatalog';
import { formatRupiah } from '../utils/bankUtils';
import { requestCreateQrisPayment } from '../../buatQrisService';
import { QrisPaymentOrder } from '../types/bank';
import { DiamondIcon, DiamondText } from './DiamondIcon';

const ITEMS_PER_PAGE = 25;

type TierFilter = 'all' | 'tier1' | 'tier2' | 'tier3' | 'tier4';

const QUICK_RUPIAH_PRESETS: Array<{ label: string; amount: number | 'max' }> = [
  { label: 'Rp 5rb', amount: 5_000 },
  { label: 'Rp 10rb', amount: 10_000 },
  { label: 'Rp 25rb', amount: 25_000 },
  { label: 'Rp 50rb', amount: 50_000 },
  { label: 'Rp 100rb', amount: 100_000 },
  { label: 'Rp 250rb', amount: 250_000 },
  { label: 'Rp 500rb', amount: 500_000 },
  { label: 'Maks', amount: 'max' },
];

export const DiamondStoreModal: React.FC = () => {
  const {
    isDiamondStoreOpen,
    setIsDiamondStoreOpen,
    currentAccount,
    diamondConfig,
    uiVisibilityConfig,
    qrisOrders,
    registerQrisOrder,
    setActiveQrisModalOrder,
    exchangeDiamondsToCashOrCoins,
    upgradeJobLevelWithDiamonds,
  } = useBank();

  const visibleStoreTabs = useMemo(() => {
    const tabs: Array<'topup' | 'use' | 'history'> = [];
    if (uiVisibilityConfig.storeTabTopUp !== false) tabs.push('topup');
    if (uiVisibilityConfig.storeTabUse !== false) tabs.push('use');
    if (uiVisibilityConfig.storeTabHistory !== false) tabs.push('history');
    return tabs;
  }, [uiVisibilityConfig]);

  const [activeTab, setActiveTab] = useState<'topup' | 'use' | 'history'>('topup');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [page, setPage] = useState<number>(1);
  const [customDiamondsInput, setCustomDiamondsInput] = useState<string>('100');
  const [customRupiahInput, setCustomRupiahInput] = useState<string>(() =>
    String(calculateDiamondPurchasePrice(100, diamondConfig).finalPrice)
  );
  const [lastEditedMode, setLastEditedMode] = useState<'diamonds' | 'rupiah'>('diamonds');
  const [clampNotice, setClampNotice] = useState<string>('');
  const [isCreatingQris, setIsCreatingQris] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    showTopUpShortcut?: boolean;
  } | null>(null);

  // Use / Exchange state
  const [exchangeAmount, setExchangeAmount] = useState<string>('10');
  const [levelUpCount, setLevelUpCount] = useState<number>(1);

  // Pastikan activeTab selalu mengarah ke tab yang tampil bila Admin menyembunyikan salah satu sub-tab Toko
  React.useEffect(() => {
    if (visibleStoreTabs.length > 0 && !visibleStoreTabs.includes(activeTab)) {
      setActiveTab(visibleStoreTabs[0]);
    }
  }, [visibleStoreTabs, activeTab]);

  const limits = useMemo(() => getEffectiveDiamondPurchaseLimits(diamondConfig), [diamondConfig]);

  // Sinkronkan ulang saat harga/diskon berubah dari Panel Admin
  React.useEffect(() => {
    if (lastEditedMode === 'rupiah') {
      const budget = Math.max(0, Math.floor(Number(customRupiahInput.replace(/[^0-9]/g, '')) || 0));
      const calc = calculateDiamondsFromRupiahBudget(budget, diamondConfig);
      setCustomDiamondsInput(String(calc.diamonds));
    } else {
      const qty = Math.max(
        1,
        Math.min(limits.maxDiamonds, Math.floor(Number(customDiamondsInput.replace(/[^0-9]/g, '')) || 1))
      );
      const pr = calculateDiamondPurchasePrice(qty, diamondConfig);
      setCustomRupiahInput(String(pr.finalPrice));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diamondConfig.baseDiamondPriceRupiah, diamondConfig.diamondDiscountPercent, limits.maxDiamonds, limits.maxBaseRupiah]);

  const handleDiamondsInputChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setLastEditedMode('diamonds');
    if (!digits) {
      setCustomDiamondsInput('');
      setCustomRupiahInput('');
      setClampNotice('');
      return;
    }
    let val = Math.floor(Number(digits) || 0);
    if (val > limits.maxDiamonds) {
      val = limits.maxDiamonds;
      setClampNotice(
        `Jumlah disesuaikan otomatis ke batas maksimal ${limits.maxDiamonds.toLocaleString('id-ID')} (harga dasar maks ${formatRupiah(limits.maxBaseRupiah)}).`
      );
    } else {
      setClampNotice('');
    }
    setCustomDiamondsInput(String(val));
    if (val >= 1) {
      const pr = calculateDiamondPurchasePrice(val, diamondConfig);
      setCustomRupiahInput(String(pr.finalPrice));
    } else {
      setCustomRupiahInput('0');
    }
  };

  const handleRupiahInputChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, '');
    setLastEditedMode('rupiah');
    if (!digits) {
      setCustomRupiahInput('');
      setCustomDiamondsInput('');
      setClampNotice('');
      return;
    }
    let rupiahVal = Math.floor(Number(digits) || 0);
    let notice = '';
    if (rupiahVal > limits.maxBaseRupiah) {
      rupiahVal = limits.maxBaseRupiah;
      notice = `Nominal disesuaikan ke batas maksimal harga dasar ${formatRupiah(limits.maxBaseRupiah)} (sebelum angka unik 3 digit QRIS).`;
    }
    const calc = calculateDiamondsFromRupiahBudget(rupiahVal, diamondConfig);
    if (calc.wasClampedToMax && !notice) {
      notice = `Batas maksimal ${limits.maxDiamonds.toLocaleString('id-ID')} per transaksi diterapkan (${formatRupiah(calc.finalPrice)}).`;
      rupiahVal = calc.finalPrice;
    } else if (calc.isBelowMin && rupiahVal > 0) {
      notice = `Minimal pembelian 1 permata adalah ${formatRupiah(calc.minRupiah)}.`;
    }
    setClampNotice(notice);
    setCustomRupiahInput(String(rupiahVal));
    setCustomDiamondsInput(String(calc.diamonds));
  };

  const handleQuickRupiahPreset = (presetAmount: number | 'max') => {
    setLastEditedMode('rupiah');
    if (presetAmount === 'max') {
      const maxDiamonds = limits.maxDiamonds;
      const pr = calculateDiamondPurchasePrice(maxDiamonds, diamondConfig);
      setCustomDiamondsInput(String(maxDiamonds));
      setCustomRupiahInput(String(pr.finalPrice));
      setClampNotice(
        `Paket maksimal dipilih: ${maxDiamonds.toLocaleString('id-ID')} permata (${formatRupiah(pr.finalPrice)} sebelum angka unik QRIS).`
      );
      return;
    }
    handleRupiahInputChange(String(presetAmount));
  };

  const filteredPackages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/[.,\s]/g, '');
    return DIAMOND_PACKAGES_250.filter((pkg) => {
      if (pkg.diamonds > limits.maxDiamonds) return false;
      if (tierFilter === 'tier1' && pkg.diamonds > 100) return false;
      if (tierFilter === 'tier2' && (pkg.diamonds <= 100 || pkg.diamonds > 1_000)) return false;
      if (tierFilter === 'tier3' && (pkg.diamonds <= 1_000 || pkg.diamonds > 5_000)) return false;
      if (tierFilter === 'tier4' && pkg.diamonds <= 5_000) return false;
      if (!q) return true;
      return (
        String(pkg.diamonds).includes(q) ||
        pkg.tierLabel.toLowerCase().replace(/[.,\s]/g, '').includes(q) ||
        `#${pkg.id}`.includes(q)
      );
    });
  }, [searchQuery, tierFilter, limits.maxDiamonds]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedPackages = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredPackages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackages, safePage]);

  const parsedCustomDiamonds = Math.max(
    0,
    Math.min(limits.maxDiamonds, Math.floor(Number(customDiamondsInput.replace(/[^0-9]/g, '')) || 0))
  );
  const customPrice = useMemo(
    () =>
      parsedCustomDiamonds >= 1
        ? calculateDiamondPurchasePrice(parsedCustomDiamonds, diamondConfig)
        : {
            originalPrice: 0,
            finalPrice: 0,
            discountPercent: diamondConfig.diamondDiscountPercent,
            discountSaved: 0,
            unitPriceEffective: limits.effectiveUnitPrice,
            exceedsRupiahCap: false,
            exceedsDiamondCap: false,
          },
    [parsedCustomDiamonds, diamondConfig, limits.effectiveUnitPrice]
  );

  const accountOrders = useMemo(
    () => qrisOrders.filter((o) => !currentAccount || o.accountId === currentAccount.id),
    [qrisOrders, currentAccount]
  );

  if (!isDiamondStoreOpen) return null;

  const startQrisCheckout = async (diamonds: number, label: string) => {
    if (!currentAccount) {
      setFeedback({ type: 'error', text: 'Silakan login ke rekening terlebih dahulu.' });
      return;
    }
    if (diamonds < 1 || diamonds > limits.maxDiamonds) {
      setFeedback({
        type: 'error',
        text: `Jumlah 💎 harus antara 1 sampai ${limits.maxDiamonds.toLocaleString('id-ID')} 💎.`,
      });
      return;
    }
    const pricing = calculateDiamondPurchasePrice(diamonds, diamondConfig);
    if (pricing.finalPrice > limits.maxBaseRupiah) {
      setFeedback({
        type: 'error',
        text: `Harga dasar transaksi melebihi batas maksimal ${formatRupiah(limits.maxBaseRupiah)} (sebelum angka unik QRIS).`,
      });
      return;
    }
    setIsCreatingQris(true);
    setFeedback(null);
    try {
      const orderId = `BN-DIA-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const res = await requestCreateQrisPayment({
        orderId,
        accountId: currentAccount.id,
        amount: pricing.finalPrice,
        diamondAmount: diamonds,
        purpose: 'diamond_topup',
        customerName: currentAccount.fullName,
        description: label,
        useUniqueCode: true,
        expiryMinutes: 10,
      });

      if (!res.success) {
        setFeedback({
          type: 'error',
          text: res.configNotice || 'Gagal membuat tagihan QRIS melalui BuatQRIS.',
        });
        return;
      }

      const newOrder: QrisPaymentOrder = {
        orderId: res.orderId,
        externalInvoiceId: res.externalInvoiceId,
        accountId: currentAccount.id,
        accountName: currentAccount.fullName,
        purpose: 'diamond_topup',
        diamondAmount: diamonds,
        baseAmount: res.baseAmount,
        uniqueCode: res.uniqueCode,
        totalAmount: res.totalAmount,
        discountPercentApplied: pricing.discountPercent,
        modeUsed: res.modeUsed,
        configReady: res.configReady,
        configNotice: res.configNotice,
        status: 'PENDING',
        qrisString: res.qrisString,
        qrisImageUrl: res.qrisImageUrl,
        createdAt: res.createdAt || new Date().toISOString(),
        expiresAt: res.expiresAt,
      };

      registerQrisOrder(newOrder);
      setActiveQrisModalOrder(newOrder);
    } catch {
      setFeedback({
        type: 'error',
        text: 'Terjadi gangguan koneksi saat membuat QRIS. Coba lagi.',
      });
    } finally {
      setIsCreatingQris(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-950/70 p-2.5 sm:p-5 backdrop-blur-sm">
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-r from-cyan-950 via-sky-900 to-indigo-950 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-300/40">
              <Gem className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="flex items-center gap-1.5 text-lg font-black tracking-tight">
                  Toko &amp; Brankas <DiamondIcon tone="bright" className="h-5 w-5" />
                </h2>
                {diamondConfig.diamondDiscountPercent > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-2 py-0.5 text-[11px] font-black text-white">
                    <Tag className="h-3 w-3" />
                    DISKON {diamondConfig.diamondDiscountPercent}%
                  </span>
                )}
              </div>
              <p className="flex flex-wrap items-center gap-1 text-xs text-cyan-100/80">
                <span>
                  250 Paket (1 – {limits.maxDiamonds.toLocaleString('id-ID')}
                </span>
                <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                <span>
                  ) • Maks {formatRupiah(limits.maxBaseRupiah)} • Rp{' '}
                  {diamondConfig.baseDiamondPriceRupiah.toLocaleString('id-ID')}/
                </span>
                <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                <span>via BuatQRIS</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 px-3.5 py-2 text-right ring-1 ring-white/15">
              <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-200">
                <span>Saldo</span>
                <DiamondIcon tone="bright" className="h-3 w-3" />
                <span>Anda</span>
              </p>
              <p className="flex items-center justify-end gap-1.5 text-base font-black text-white tabular-nums">
                <span>{(currentAccount?.diamonds || 0).toLocaleString('id-ID')}</span>
                <DiamondIcon tone="bright" className="h-4 w-4" />
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDiamondStoreOpen(false)}
              className="rounded-xl p-2 text-cyan-100 transition hover:bg-white/15 hover:text-white"
              aria-label="Tutup Toko"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Respect Admin UI Visibility Config) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-2.5">
          {uiVisibilityConfig.storeTabTopUp !== false && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('topup');
                setFeedback(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'topup'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              Top-Up 250 Paket &amp; Custom
            </button>
          )}
          {uiVisibilityConfig.storeTabUse !== false && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('use');
                setFeedback(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'use'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Gunakan &amp; Tukar</span>
              <DiamondIcon
                tone={activeTab === 'use' ? 'bright' : 'cyan'}
                className="h-3.5 w-3.5"
              />
            </button>
          )}
          {uiVisibilityConfig.storeTabHistory !== false && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('history');
                setFeedback(null);
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Riwayat QRIS ({accountOrders.length})
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {feedback && (
            <div
              className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-xs font-bold ${
                feedback.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              }`}
            >
              <DiamondText text={feedback.text} />
              {feedback.showTopUpShortcut && activeTab !== 'topup' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('topup');
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-cyan-600 px-3 py-1.5 text-[11px] font-black text-white shadow-sm transition hover:bg-cyan-700"
                >
                  Top-Up <DiamondIcon tone="bright" className="h-3.5 w-3.5" /> Sekarang
                </button>
              )}
            </div>
          )}

          {visibleStoreTabs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-xs font-semibold text-slate-500">
              Seluruh tab Toko sedang disembunyikan sementara oleh Administrator.
            </div>
          )}

          {activeTab === 'topup' && uiVisibilityConfig.storeTabTopUp !== false && (
            <>
              {/* Two-Way Synced Custom Diamond & Rupiah Builder */}
              <div className="rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-sky-50 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-cyan-700" />
                    <h3 className="flex flex-wrap items-center gap-1.5 text-sm font-black text-slate-900">
                      <span>Beli Custom</span>
                      <DiamondIcon className="h-4 w-4" />
                      <span>
                        ⇄ Nominal Rupiah (Maks {limits.maxDiamonds.toLocaleString('id-ID')} /{' '}
                        {formatRupiah(limits.maxBaseRupiah)})
                      </span>
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-800">
                    <span>1</span>
                    <DiamondIcon className="h-3.5 w-3.5" />
                    <span>
                      = Rp {diamondConfig.baseDiamondPriceRupiah.toLocaleString('id-ID')}
                      {diamondConfig.diamondDiscountPercent > 0
                        ? ` → Diskon ${diamondConfig.diamondDiscountPercent}%`
                        : ''}
                    </span>
                  </span>
                </div>

                {/* Dua Input Berdampingan: Jumlah Permata ⇄ Nominal Harga Rp */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                  <div className="sm:col-span-4">
                    <label className="mb-1 flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <span>Jumlah</span>
                      <DiamondIcon className="h-3.5 w-3.5" />
                      <span className="text-slate-400">
                        (1 – {limits.maxDiamonds.toLocaleString('id-ID')})
                      </span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customDiamondsInput}
                      onChange={(e) => handleDiamondsInputChange(e.target.value)}
                      placeholder="Contoh: 500"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-black text-slate-900 tabular-nums focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-600">
                      <span>Nominal Harga (Rp)</span>
                      <span className="text-slate-400 tabular-nums">
                        Maks {formatRupiah(limits.maxBaseRupiah)}
                      </span>
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={customRupiahInput}
                        onChange={(e) => handleRupiahInputChange(e.target.value)}
                        placeholder="Contoh: 50000"
                        className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2.5 text-sm font-black text-sky-800 tabular-nums focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      disabled={isCreatingQris || parsedCustomDiamonds < 1}
                      onClick={() =>
                        void startQrisCheckout(
                          parsedCustomDiamonds,
                          `Custom ${parsedCustomDiamonds.toLocaleString('id-ID')} 💎`
                        )
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-sky-700 active:scale-95 disabled:opacity-50"
                    >
                      {isCreatingQris ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <QrCode className="h-4 w-4" />
                      )}
                      <span>
                        Bayar {parsedCustomDiamonds >= 1 ? formatRupiah(customPrice.finalPrice) : 'QRIS'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Deretan 8 Tombol Cepat Nominal Rupiah */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Pilihan Cepat:</span>
                  {QUICK_RUPIAH_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleQuickRupiahPreset(preset.amount)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold tabular-nums transition ${
                        preset.amount === 'max'
                          ? 'border-cyan-400 bg-cyan-600 text-white hover:bg-cyan-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Ringkasan Harga & Notice Batas */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-600">Diterima:</span>
                    <span className="inline-flex items-center gap-1 font-black text-slate-900 tabular-nums">
                      {parsedCustomDiamonds.toLocaleString('id-ID')}
                      <DiamondIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-semibold text-slate-600">Harga Dasar:</span>
                    <span className="font-black text-sky-700 tabular-nums">
                      {formatRupiah(customPrice.finalPrice)}
                    </span>
                    {customPrice.discountSaved > 0 && (
                      <span className="text-slate-400 line-through tabular-nums">
                        {formatRupiah(customPrice.originalPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    Total QRIS + kode unik 3 digit tetap di bawah Rp 1.000.000
                  </span>
                </div>

                {clampNotice && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900">
                    {clampNotice}
                  </p>
                )}
              </div>

              {/* Search & Tier Filters for 250 Packages (1..11.099) */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder={`Cari cepat dari 250 paket (contoh: 100, 1000, ${MAX_DIAMOND_PACKAGE_AMOUNT})...`}
                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      { key: 'all', label: 'Semua (250)' },
                      { key: 'tier1', label: '1 - 100' },
                      { key: 'tier2', label: '101 - 1.000' },
                      { key: 'tier3', label: '1.001 - 5.000' },
                      { key: 'tier4', label: `5.001 - ${MAX_DIAMOND_PACKAGE_AMOUNT.toLocaleString('id-ID')}` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setTierFilter(tab.key);
                        setPage(1);
                      }}
                      className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                        tierFilter === tab.key
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 250 Packages Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                {paginatedPackages.map((pkg) => {
                  const pricing = calculateDiamondPurchasePrice(pkg.diamonds, diamondConfig);
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      disabled={isCreatingQris}
                      onClick={() =>
                        void startQrisCheckout(
                          pkg.diamonds,
                          `Paket #${pkg.id}: ${pkg.diamonds.toLocaleString('id-ID')} 💎`
                        )
                      }
                      className="group relative flex flex-col items-start justify-between rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-sky-400 hover:bg-sky-50/40 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">#{pkg.id}</span>
                        {(pkg.isPopular || pkg.tierLabel === 'Max Sultan') && (
                          <span className="rounded-md bg-cyan-100 px-1.5 py-0.5 text-[9px] font-black text-cyan-800">
                            {pkg.tierLabel}
                          </span>
                        )}
                      </div>

                      <div className="my-2 flex items-center gap-1.5">
                        <Gem className="h-4 w-4 shrink-0 text-cyan-600 transition group-hover:scale-110" />
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {pkg.diamonds.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="w-full border-t border-slate-100 pt-2">
                        {pricing.discountSaved > 0 && (
                          <p className="text-[10px] font-semibold text-slate-400 line-through tabular-nums">
                            {formatRupiah(pricing.originalPrice)}
                          </p>
                        )}
                        <p className="text-xs font-black text-sky-700 tabular-nums">
                          {formatRupiah(pricing.finalPrice)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                <p className="font-semibold text-slate-500">
                  Menampilkan {paginatedPackages.length} dari {filteredPackages.length} paket (Halaman{' '}
                  {safePage} / {totalPages})
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'use' && uiVisibilityConfig.storeTabUse !== false && (
            <div className="space-y-4">
              {/* Feature Availability Matrix */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                  <span>Fitur yang Mendukung Penggunaan</span>
                  <DiamondIcon className="h-4 w-4" />
                  <span>(Kontrol Admin)</span>
                </h3>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <DiamondIcon className="h-3.5 w-3.5" />
                  <span>hanya dapat digunakan pada fitur yang diaktifkan di Panel Admin.</span>
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DIAMOND_FEATURE_METADATA.map((meta) => {
                    const enabled = Boolean(diamondConfig.enabledFeatures?.[meta.key]);
                    return (
                      <div
                        key={meta.key}
                        className={`flex items-start gap-2.5 rounded-xl border p-3 ${
                          enabled
                            ? 'border-emerald-200 bg-white'
                            : 'border-slate-200 bg-slate-100/70 opacity-70'
                        }`}
                      >
                        {enabled ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <div>
                          <p className="text-xs font-black text-slate-900">
                            <DiamondText text={meta.label} />
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            <DiamondText text={meta.description} iconClassName="h-3 w-3 mx-0.5" />
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Direct Action 1: Exchange Diamond to Cash or Coin */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="h-4 w-4 text-sky-600" />
                    <h4 className="flex items-center gap-1 text-sm font-black text-slate-900">
                      <span>Tukar</span>
                      <DiamondIcon className="h-4 w-4" />
                      <span>ke Saldo Uang atau Coin</span>
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <span>1</span>
                    <DiamondIcon className="h-3.5 w-3.5" />
                    <span>
                      = {formatRupiah((diamondConfig.baseDiamondPriceRupiah || 90) * 50)} / 2 Coin
                    </span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  <input
                    type="number"
                    min={1}
                    value={exchangeAmount}
                    onChange={(e) => setExchangeAmount(e.target.value)}
                    className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-900"
                    placeholder="Jumlah"
                  />
                  <button
                    type="button"
                    disabled={!diamondConfig.enabledFeatures?.diamond_transfer_exchange}
                    onClick={() => {
                      const amt = Math.max(1, Math.floor(Number(exchangeAmount) || 0));
                      const res = exchangeDiamondsToCashOrCoins(amt, 'cash');
                      setFeedback({
                        type: res.success ? 'success' : 'error',
                        text: res.message,
                        showTopUpShortcut: Boolean(res.insufficientDiamonds),
                      });
                    }}
                    className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                  >
                    Tukar ke Saldo Uang
                  </button>
                  <button
                    type="button"
                    disabled={!diamondConfig.enabledFeatures?.diamond_transfer_exchange}
                    onClick={() => {
                      const amt = Math.max(1, Math.floor(Number(exchangeAmount) || 0));
                      const res = exchangeDiamondsToCashOrCoins(amt, 'coin');
                      setFeedback({
                        type: res.success ? 'success' : 'error',
                        text: res.message,
                        showTopUpShortcut: Boolean(res.insufficientDiamonds),
                      });
                    }}
                    className="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
                  >
                    Tukar ke Coin
                  </button>
                </div>
              </div>

              {/* Direct Action 2: Upgrade Job Level with Diamonds */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-indigo-600" />
                    <h4 className="flex items-center gap-1 text-sm font-black text-slate-900">
                      <span>Upgrade Level Pekerjaan dengan</span>
                      <DiamondIcon className="h-4 w-4" />
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                    <span>25</span>
                    <DiamondIcon className="h-3.5 w-3.5" />
                    <span>/ Level (Level Anda: Lv.{currentAccount?.jobLevel || 1})</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                  {[1, 5, 10].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevelUpCount(lvl)}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        levelUpCount === lvl
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>+{lvl} Level ({lvl * 25}</span>
                      <DiamondIcon
                        tone={levelUpCount === lvl ? 'bright' : 'cyan'}
                        className="h-3.5 w-3.5"
                      />
                      <span>)</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={!diamondConfig.enabledFeatures?.job_voucher_upgrade}
                    onClick={() => {
                      const res = upgradeJobLevelWithDiamonds(levelUpCount);
                      setFeedback({
                        type: res.success ? 'success' : 'error',
                        text: res.message,
                        showTopUpShortcut: Boolean(res.insufficientDiamonds),
                      });
                    }}
                    className="ml-auto inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white transition hover:bg-indigo-700 disabled:opacity-40"
                  >
                    <span>Naikkan +{levelUpCount} Level ({levelUpCount * 25}</span>
                    <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                    <span>)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && uiVisibilityConfig.storeTabHistory !== false && (
            <div className="space-y-2.5">
              {accountOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center text-xs font-semibold text-slate-500">
                  Belum ada riwayat transaksi BuatQRIS untuk rekening ini.
                </div>
              ) : (
                accountOrders.map((ord) => (
                  <div
                    key={ord.orderId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-black text-slate-900">
                          {ord.diamondAmount ? (
                            <>
                              <span>Top-Up {ord.diamondAmount.toLocaleString('id-ID')}</span>
                              <DiamondIcon className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            'Pembayaran BuatQRIS'
                          )}
                        </span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black ${
                            ord.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ord.status === 'EXPIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                        {ord.orderId} • {new Date(ord.createdAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-slate-900 tabular-nums">
                        {formatRupiah(ord.totalAmount)}
                      </span>
                      {ord.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => setActiveQrisModalOrder(ord)}
                          className="rounded-xl bg-sky-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-sky-700"
                        >
                          Buka QRIS
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
