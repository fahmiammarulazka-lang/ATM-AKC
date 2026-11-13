/**
 * Bank Nusantara — Fitur Spin the Wheel (Rp 100.000 s/d Rp 20.000.000)
 * & Toko Pembelian 100 Pilihan Koin (1 Koin s/d 100.000 Koin s/d 1.000.000 Koin)
 *
 * Sesuai spesifikasi lengkap user:
 * - Di bagian atas ada Gambar Koin (🪙), angka jumlah koin (mulai dari 0), dan tombol Plus (+).
 * - Ketika tombol (+) dipencet, muncul 100 pilihan pembelian koin mulai dari 1 Koin, 100.000 Koin, hingga 1.000.000 Koin.
 * - Harga 1 Koin = Rp 10.000 (dikalikan jumlah koin + ada recehan & desimalnya, contoh Rp 10.000,12).
 * - Harga koin masih bisa dimurahin & dikasih diskon di Panel Admin.
 * - Pilihan Spin: 1 kali, 3 kali, 5 kali, 7 kali, 10 kali.
 * - Harga 1 kali Spin = 100 Koin (setara Rp 1.000.000), dan bisa dikasih diskon di Panel Admin.
 * - Hadiah di dalam roda Spin:
 *   Rp 100.000, Rp 500.000, Rp 750.000, Rp 1.000.000 (kemungkinan 1%, lalu semakin mengecil),
 *   Rp 1.500.000, Rp 2.000.000, Rp 2.500.000, Rp 3.000.000, Rp 3.500.000, Rp 4.000.000,
 *   Rp 4.500.000, Rp 5.000.000, Rp 5.500.000, Rp 6.000.000, Rp 6.500.000, Rp 7.000.000,
 *   Rp 7.500.000, Rp 10.000.000, serta Rp 15.000.000 & Rp 20.000.000 (kemungkinan 0,000000000001% — 1 dari 1.000 Kuadriliun).
 * - Kemungkinan pendapatan saat nyepin bisa diperbesar di Panel Admin.
 */
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  Trophy,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Tag,
  Zap,
  ShieldCheck,
  Coins,
  RotateCw,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  SPIN_WHEEL_PRIZES,
  COIN_PURCHASE_PACKAGES_100,
  calculateCoinPackagePrice,
  calculateSpinCost,
  formatRupiahWithDecimals,
} from '../data/spinWheelCatalog';
import { formatRupiah } from '../utils/bankUtils';
import { SpinPrizeSegment } from '../types/bank';

const SPIN_COUNTS: (1 | 3 | 5 | 7 | 10)[] = [1, 3, 5, 7, 10];

export const SpinTheWheelView: React.FC = () => {
  const {
    currentAccount,
    spinWheelConfig,
    spinHistory,
    buySpinCoins,
    spinTheWheel,
  } = useBank();

  const [isCoinShopOpen, setIsCoinShopOpen] = useState<boolean>(false);
  const [coinFilterTab, setCoinFilterTab] = useState<
    'all' | 'satuan' | 'paket_spin' | 'sultan_100k' | 'mega_1juta'
  >('all');
  const [coinSearchQuery, setCoinSearchQuery] = useState<string>('');

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotationDeg, setWheelRotationDeg] = useState<number>(0);
  const [selectedSpinCount, setSelectedSpinCount] = useState<1 | 3 | 5 | 7 | 10>(1);

  const [lastSpinResult, setLastSpinResult] = useState<{
    spinCount: number;
    coinsSpent: number;
    prizes: SpinPrizeSegment[];
    totalWonAmount: number;
    message: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  if (!currentAccount) {
    return (
      <div className="p-8 text-center text-slate-300 bg-slate-900/80 rounded-3xl border border-slate-800">
        Silakan login ke kartu rekening Bank Nusantara terlebih dahulu untuk memutar Spin the Wheel.
      </div>
    );
  }

  const userCoins = currentAccount.spinCoins ?? 0;
  const numSegments = SPIN_WHEEL_PRIZES.length; // 20 segmen
  const sliceAngle = 360 / numSegments; // 18 derajat per segmen

  const filteredCoinPackages = useMemo(() => {
    return COIN_PURCHASE_PACKAGES_100.filter((pkg) => {
      if (coinFilterTab !== 'all' && pkg.category !== coinFilterTab) return false;
      if (coinSearchQuery.trim()) {
        const q = coinSearchQuery.trim().toLowerCase();
        const matchCoins = pkg.coins.toString().includes(q.replace(/\./g, ''));
        const matchLabel = pkg.label.toLowerCase().includes(q);
        const matchId = `#${pkg.id}` === q || pkg.id.toString() === q;
        return matchCoins || matchLabel || matchId;
      }
      return true;
    });
  }, [coinFilterTab, coinSearchQuery]);

  const handleExecuteSpin = (spinCount: 1 | 3 | 5 | 7 | 10) => {
    if (isSpinning) return;
    setSelectedSpinCount(spinCount);
    setFeedback(null);

    const { finalCoins } = calculateSpinCost(spinCount, spinWheelConfig);
    if (userCoins < finalCoins) {
      setFeedback({
        type: 'error',
        title: `Koin Spin Kurang (Butuh ${finalCoins.toLocaleString('id-ID')} Koin)`,
        message: `Untuk ${spinCount}x Spin dibutuhkan ${finalCoins.toLocaleString(
          'id-ID'
        )} Koin, sedangkan Koin Anda saat ini ${userCoins.toLocaleString(
          'id-ID'
        )} Koin. Silakan pencet tombol [+] di sebelah gambar koin di atas untuk membeli koin!`,
      });
      return;
    }

    const res = spinTheWheel(spinCount);
    if (!res.success || !res.results || res.results.length === 0) {
      setFeedback({
        type: 'error',
        title: 'Gagal Memutar Spin the Wheel',
        message: res.message,
      });
      return;
    }

    // Target segment for visual landing is the highest prize won in the batch (or the single prize on 1x)
    const bestResult = [...res.results].sort(
      (a, b) => b.segment.amount - a.segment.amount
    )[0];
    const targetIndex = bestResult.index;

    // Pointer is at the top (0 deg / 270 deg in SVG coordinates).
    // Segment i center angle from top clockwise is: targetIndex * sliceAngle + sliceAngle / 2
    const segmentCenterClockwise = targetIndex * sliceAngle + sliceAngle / 2;
    const desiredFinalMod = (360 - segmentCenterClockwise) % 360;
    const currentMod = ((wheelRotationDeg % 360) + 360) % 360;
    let delta = desiredFinalMod - currentMod;
    if (delta < 0) delta += 360;

    // Spin 6 to 8 full rotations + exact landing angle
    const fullSpins = (6 + Math.floor(Math.random() * 2)) * 360;
    const nextRotation = wheelRotationDeg + fullSpins + delta;

    setIsSpinning(true);
    setLastSpinResult(null);
    setWheelRotationDeg(nextRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setLastSpinResult({
        spinCount,
        coinsSpent: res.coinsSpent || finalCoins,
        prizes: res.results!.map((r) => r.segment),
        totalWonAmount: res.totalWonAmount || 0,
        message: res.message,
      });
    }, 3200);
  };

  const handleBuyCoinPackage = (packageId: number) => {
    const res = buySpinCoins(packageId);
    setFeedback({
      type: res.success ? 'success' : 'error',
      title: res.success
        ? `🪙 Berhasil Membeli +${(res.coinsAdded || 0).toLocaleString('id-ID')} Koin!`
        : 'Pembelian Koin Gagal',
      message: res.message,
    });
  };

  // Helper to build SVG pie slice path (0 deg at top 12 o'clock)
  const createSlicePath = (index: number, radius: number, cx: number, cy: number) => {
    const startDeg = index * sliceAngle - 90;
    const endDeg = (index + 1) * sliceAngle - 90;
    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
  };

  const currentAccountHistory = spinHistory.filter(
    (h) => h.accountId === currentAccount.id
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* =====================================================================
          BAGIAN ATAS: BAR KOIN SPIN (GAMBAR KOIN + ANGKA KOIN 0 + TOMBOL PLUS [+])
         ===================================================================== */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-fuchsia-950/90 rounded-3xl p-5 sm:p-6 border-2 border-amber-400/70 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Title & Info */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NUSANTARA MEGA SPIN THE WHEEL • HADIAH RP 100.000 S/D RP 20.000.000</span>
              </span>
              {(spinWheelConfig.spinDiscountPercent > 0 ||
                spinWheelConfig.coinPurchaseDiscountPercent > 0 ||
                spinWheelConfig.baseCoinPriceRupiah < 10_000 ||
                spinWheelConfig.luckMultiplier > 1 ||
                spinWheelConfig.forceJackpotMode !== 'none') && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 font-mono font-bold text-[10px]">
                  ⚡ Promo &amp; Boost Admin Aktif!
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              🎡 Spin the Wheel Berhadiah Rp 100.000 s/d Rp 20.000.000
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              1 kali Spin membutuhkan <strong>{calculateSpinCost(1, spinWheelConfig).finalCoins} Koin</strong> (normal <strong>100 Koin = Rp 1.000.000</strong>). Klik tombol <strong>[+]</strong> di sebelah gambar koin di kanan atas untuk membeli koin (tersedia <strong>100 pilihan pembelian dari 1 Koin sampai 1.000.000 Koin</strong> dengan harga 1 Koin = {formatRupiah(spinWheelConfig.baseCoinPriceRupiah)} + recehan desimal).
            </p>
          </div>

          {/* Right: TOP COIN COUNTER BAR WITH COIN IMAGE, "0" (CURRENT COINS), AND "+" BUTTON */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Saldo Rekening Card */}
            <div className="px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-right">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Saldo Rekening Anda
              </span>
              <span className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                {formatRupiahWithDecimals(currentAccount.balance)}
              </span>
            </div>

            {/* GAMBAR KOIN + ANGKA KOIN (0) + TOMBOL PLUS (+) SESUAI PERMINTAAN USER */}
            <div className="flex items-center gap-2.5 bg-slate-950 border-2 border-amber-400 rounded-2xl px-4 py-2 shadow-xl shadow-amber-500/20">
              {/* Gambar Koin Emas 3D */}
              <div
                onClick={() => setIsCoinShopOpen(true)}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-2 border-yellow-100 flex items-center justify-center shadow-md shadow-amber-400/40 cursor-pointer shrink-0"
                title="Koin Spin the Wheel"
              >
                <span className="text-slate-950 font-black font-mono text-base select-none">
                  🪙
                </span>
              </div>

              {/* Angka Koin (Default 0) */}
              <div
                onClick={() => setIsCoinShopOpen(true)}
                className="cursor-pointer pr-1"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                  Koin Spin
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono leading-none block">
                  {userCoins.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Tombol Plus (+) untuk Membeli Koin (1 s/d 1.000.000 Koin - 100 Pilihan) */}
              <button
                type="button"
                onClick={() => setIsCoinShopOpen((prev) => !prev)}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-emerald-500/30 cursor-pointer transition-transform active:scale-95"
                title="Klik [+] untuk Membeli Koin Spin (100 Pilihan: 1 Koin s/d 1.000.000 Koin)"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Promo Strip if Admin Discount or Boost is Active */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-mono font-bold">
              🪙 Harga Dasar 1 Koin: {formatRupiahWithDecimals(spinWheelConfig.baseCoinPriceRupiah + 0.12)}
            </span>
            {spinWheelConfig.coinPurchaseDiscountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold">
                🏷️ Diskon Beli Koin Admin: {spinWheelConfig.coinPurchaseDiscountPercent}% OFF
              </span>
            )}
            {spinWheelConfig.spinDiscountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-fuchsia-500/20 border border-fuchsia-400/50 text-fuchsia-300 font-mono font-bold">
                🔥 Diskon Biaya Spin Admin: {spinWheelConfig.spinDiscountPercent}% OFF
              </span>
            )}
            {spinWheelConfig.luckMultiplier > 1 && (
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono font-bold">
                🍀 Kemungkinan Pendapatan Diperbesar Admin: {spinWheelConfig.luckMultiplier.toLocaleString('id-ID')}x Lipat!
              </span>
            )}
            {spinWheelConfig.forceJackpotMode !== 'none' && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-mono font-black">
                👑 Mode Jackpot Admin Aktif ({spinWheelConfig.forceJackpotMode})
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCoinShopOpen((prev) => !prev)}
            className="text-amber-300 hover:text-amber-200 font-bold underline cursor-pointer flex items-center gap-1"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>
              {isCoinShopOpen
                ? 'Tutup Toko 100 Pilihan Koin'
                : 'Buka Toko Pembelian Koin (+ 100 Pilihan: 1 s/d 1 Juta Koin)'}
            </span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border-2 flex items-start justify-between gap-3 shadow-xl ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100'
              : feedback.type === 'error'
              ? 'bg-rose-950/90 border-rose-500 text-rose-100'
              : 'bg-blue-950/90 border-blue-400 text-blue-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-black text-sm text-white">{feedback.title}</h4>
              <p className="text-xs mt-0.5 leading-relaxed">{feedback.message}</p>
              {feedback.type === 'error' && !isCoinShopOpen && (
                <button
                  type="button"
                  onClick={() => setIsCoinShopOpen(true)}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Buka Pembelian Koin Sekarang (1 s/d 1.000.000 Koin)</span>
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg bg-slate-900/70 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          MODAL / DRAWER TOKO PEMBELIAN 100 PILIHAN KOIN (SAAT TOMBOL [+] DIPENCET)
         ===================================================================== */}
      {isCoinShopOpen && (
        <div className="bg-slate-900/95 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                  🪙 TOKO RESMI KOIN SPIN THE WHEEL • 100 PILIHAN PEMBELIAN
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono text-[10px] font-bold">
                  1 Koin = {formatRupiah(spinWheelConfig.baseCoinPriceRupiah)} (+ Recehan Desimal)
                </span>
                {spinWheelConfig.coinPurchaseDiscountPercent > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black">
                    DISKON ADMIN {spinWheelConfig.coinPurchaseDiscountPercent}% OFF
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                100 Pilihan Pembelian Koin (Mulai 1 Koin, 100.000 Koin, hingga 1.000.000 Koin)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih paket koin di bawah ini. Harga dikalikan dari <strong>1 Koin = Rp 10.000</strong> lengkap dengan <strong>angka recehan &amp; desimalnya</strong>, serta otomatis memotong diskon apabila diberikan di Panel Admin.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCoinShopOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 self-start cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Tutup Toko Koin</span>
            </button>
          </div>

          {/* Filter Kategori & Pencarian dari 100 Pilihan */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Semua (100 Pilihan)' },
                  { id: 'satuan', label: '#1–#25: 1 s/d 95 Koin' },
                  { id: 'paket_spin', label: '#26–#50: 100 s/d 5.000 Koin' },
                  { id: 'sultan_100k', label: '#51–#75: 6.000 s/d 100.000 Koin' },
                  { id: 'mega_1juta', label: '#76–#100: 110.000 s/d 1 Juta Koin' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCoinFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    coinFilterTab === tab.id
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-amber-400/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={coinSearchQuery}
                onChange={(e) => setCoinSearchQuery(e.target.value)}
                placeholder="Cari jumlah koin (misal: 1, 100, 100000, 1000000)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Grid 100 Pilihan Pembelian Koin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredCoinPackages.map((pkg) => {
              const { normalPrice, finalPrice, discountPercent } =
                calculateCoinPackagePrice(pkg, spinWheelConfig);
              const isPriceReduced = finalPrice < normalPrice;

              return (
                <div
                  key={pkg.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-2.5 transition-all ${
                    pkg.badge
                      ? 'bg-gradient-to-br from-amber-950/50 via-slate-950 to-slate-950 border-amber-400/70 shadow-lg'
                      : 'bg-slate-950/90 border-slate-800 hover:border-amber-500/50'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        Pilihan #{pkg.id}/100
                      </span>
                      {pkg.badge && (
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase">
                          {pkg.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                        🪙
                      </div>
                      <div>
                        <span className="font-black text-white text-sm sm:text-base font-mono block leading-tight">
                          {pkg.coins.toLocaleString('id-ID')} Koin
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Setara {(pkg.coins / 100).toLocaleString('id-ID')}x Spin Normal
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 p-2 rounded-xl bg-slate-900/90 border border-slate-800/90">
                      <span className="text-[9px] font-mono uppercase text-slate-400 block">
                        Harga (+ Recehan Desimal):
                      </span>
                      {isPriceReduced && (
                        <span className="text-[10px] font-mono text-slate-500 line-through block">
                          {formatRupiahWithDecimals(normalPrice)}
                        </span>
                      )}
                      <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono block">
                        {formatRupiahWithDecimals(finalPrice)}
                      </span>
                      {discountPercent > 0 && (
                        <span className="text-[9px] font-mono text-amber-300 font-bold">
                          Hemat Diskon {discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuyCoinPackage(pkg.id)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Beli +{pkg.coins.toLocaleString('id-ID')} Koin</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          BAGIAN UTAMA: RODA SPIN THE WHEEL 20 SEGMEN & TOMBOL SPIN (1x, 3x, 5x, 7x, 10x)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Visual Interactive Wheel (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border-2 border-indigo-500/40 rounded-3xl p-6 shadow-2xl flex flex-col items-center space-y-6">
          <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                RODA KEBERUNTUNGAN 20 HADIAH RESMI
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Putar Spin the Wheel (Rp 100.000 – Rp 20.000.000)
              </h2>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 font-bold">
              Total Dimainkan: {currentAccount.totalSpinsPlayed || 0}x Spin
            </div>
          </div>

          {/* Wheel Container with Pointer at 12 o'clock */}
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center select-none my-2">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 via-fuchsia-500/20 to-cyan-500/30 blur-xl pointer-events-none" />

            {/* Top Pointer Arrow (12 o'clock) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[28px] border-t-amber-400 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
            </div>

            {/* Rotating SVG Wheel */}
            <div
              className="w-full h-full rounded-full border-8 border-amber-400 shadow-[0_0_50px_rgba(251,191,36,0.3)] overflow-hidden"
              style={{
                transform: `rotate(${wheelRotationDeg}deg)`,
                transition: isSpinning
                  ? 'transform 3.1s cubic-bezier(0.15, 0.85, 0.25, 1)'
                  : 'none',
              }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full">
                {SPIN_WHEEL_PRIZES.map((prize, idx) => {
                  const midAngle = idx * sliceAngle + sliceAngle / 2 - 90;
                  const midRad = (midAngle * Math.PI) / 180;
                  const textRadius = 132;
                  const tx = 200 + textRadius * Math.cos(midRad);
                  const ty = 200 + textRadius * Math.sin(midRad);

                  return (
                    <g key={prize.id}>
                      <path
                        d={createSlicePath(idx, 200, 200, 200)}
                        fill={prize.color}
                        stroke="#334155"
                        strokeWidth="1.2"
                      />
                      <text
                        x={tx}
                        y={ty}
                        fill={prize.textColor}
                        fontSize="10.5"
                        fontWeight="900"
                        fontFamily="monospace"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle}, ${tx}, ${ty})`}
                      >
                        {prize.shortLabel}
                      </text>
                    </g>
                  );
                })}
                {/* Inner Hub Circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="34"
                  fill="#020617"
                  stroke="#facc15"
                  strokeWidth="5"
                />
                <text
                  x="200"
                  y="200"
                  fill="#facc15"
                  fontSize="11"
                  fontWeight="900"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  SPIN
                </text>
              </svg>
            </div>
          </div>

          {/* Last Spin Result Celebration Box */}
          {lastSpinResult && (
            <div className="w-full p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-2 border-emerald-400 space-y-2.5 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-emerald-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>
                    HASIL {lastSpinResult.spinCount}x SPIN ({lastSpinResult.coinsSpent.toLocaleString('id-ID')} KOIN):
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-mono font-black text-xs">
                  +{formatRupiah(lastSpinResult.totalWonAmount)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {lastSpinResult.prizes.map((p, i) => (
                  <span
                    key={`${p.id}-${i}`}
                    className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-emerald-400/50 text-white font-mono font-bold text-xs"
                  >
                    Putaran #{i + 1}: <strong className="text-amber-300">{p.label}</strong>
                  </span>
                ))}
              </div>
              <p className="text-xs text-emerald-200">{lastSpinResult.message}</p>
            </div>
          )}

          {/* 5 SPIN OPTIONS: 1x, 3x, 5x, 7x, 10x SPIN */}
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-amber-300 uppercase tracking-wider">
                Pilih Jumlah Putaran Spin (1x, 3x, 5x, 7x, atau 10x):
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Koin Anda: <strong className="text-white">{userCoins.toLocaleString('id-ID')} 🪙</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {SPIN_COUNTS.map((cnt) => {
                const cost = calculateSpinCost(cnt, spinWheelConfig);
                const canAfford = userCoins >= cost.finalCoins;

                return (
                  <button
                    key={cnt}
                    type="button"
                    disabled={isSpinning}
                    onClick={() => handleExecuteSpin(cnt)}
                    className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between gap-1 transition-all cursor-pointer active:scale-95 ${
                      isSpinning
                        ? 'bg-slate-900 border-slate-800 opacity-60 cursor-wait'
                        : canAfford
                        ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 border-yellow-200 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="font-black text-sm sm:text-base tracking-tight flex items-center gap-1">
                      <RotateCw className={`w-4 h-4 ${isSpinning && selectedSpinCount === cnt ? 'animate-spin' : ''}`} />
                      <span>SPIN {cnt}x</span>
                    </span>

                    <div className="text-center">
                      {cost.totalDiscountPercent > 0 && (
                        <span
                          className={`text-[10px] font-mono line-through block ${
                            canAfford ? 'text-slate-800' : 'text-slate-500'
                          }`}
                        >
                          {cost.normalCoins.toLocaleString('id-ID')} Koin
                        </span>
                      )}
                      <span
                        className={`font-mono font-black text-xs block ${
                          canAfford ? 'text-slate-950' : 'text-amber-300'
                        }`}
                      >
                        🪙 {cost.finalCoins.toLocaleString('id-ID')} Koin
                      </span>
                      <span
                        className={`text-[9px] font-mono block ${
                          canAfford ? 'text-slate-900 font-bold' : 'text-slate-400'
                        }`}
                      >
                        ({formatRupiah(cost.finalRupiahEquivalent)})
                      </span>
                    </div>

                    {cost.totalDiscountPercent > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-black text-[9px]">
                        DISKON {cost.totalDiscountPercent}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Tabel 20 Hadiah & Kemungkinan Pendapatan (1% di 1 Juta -> 0,000000000001% di 15 & 20 Juta) (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
              DAFTAR 20 NOMINAL HADIAH &amp; PERSENTASE KEMUNGKINAN
            </span>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              Rincian Hadiah Spin (Rp 100.000 s/d Rp 20.000.000)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Mulai dari <strong>Rp 100.000, Rp 500.000, Rp 750.000, Rp 1.000.000 (kemungkinan 1%)</strong>, lalu naik per Rp 500.000 sampai Rp 7.500.000, lanjut Rp 10.000.000, serta <strong>Rp 15.000.000 &amp; Rp 20.000.000 (kemungkinan 0,000000000001% / 1 dari 1.000 Kuadriliun)</strong>.
            </p>
          </div>

          <div className="max-h-[430px] overflow-y-auto space-y-2 pr-1">
            {SPIN_WHEEL_PRIZES.map((prize, idx) => {
              const isMythic = prize.amount >= 15_000_000;
              const isOneMillion = prize.amount === 1_000_000;

              return (
                <div
                  key={prize.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                    isMythic
                      ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/50 to-slate-950 border-amber-400/80'
                      : isOneMillion
                      ? 'bg-blue-950/50 border-blue-400/60'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-[10px] shrink-0 border border-white/20"
                      style={{ backgroundColor: prize.color, color: prize.textColor }}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-black text-white font-mono text-xs sm:text-sm block">
                        {prize.label}
                      </span>
                      {isMythic && (
                        <span className="text-[10px] text-amber-300 font-bold block">
                          👑 Hanya 1 dari 1.000 Kuadriliun!
                        </span>
                      )}
                      {isOneMillion && (
                        <span className="text-[10px] text-blue-300 font-bold block">
                          🎯 Titik Mulai 1% (Mengecil ke Atas)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-lg font-mono font-bold text-[10px] inline-block ${
                        isMythic
                          ? 'bg-amber-400 text-slate-950 font-black'
                          : isOneMillion
                          ? 'bg-blue-500/20 text-blue-200 border border-blue-400/40'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {prize.probabilityDisplay}
                    </span>
                    {spinWheelConfig.luckMultiplier > 1 && prize.amount >= 1_000_000 && (
                      <span className="text-[9px] font-mono text-emerald-400 block mt-0.5">
                        ⚡ Di-boost Admin {spinWheelConfig.luckMultiplier}x
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Riwayat Spin Terakhir */}
          {currentAccountHistory.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                <span>Riwayat Putaran Spin Terakhir Anda:</span>
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5">
                {currentAccountHistory.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-white">
                        {item.spinCount}x Spin ({item.coinsSpent} Koin)
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                        {item.prizesWon.map((p) => p.label).join(', ')}
                      </span>
                    </div>
                    <span className="font-mono font-black text-emerald-400">
                      +{formatRupiah(item.totalWonAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
