import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Zap,
  TrendingUp,
  Sparkles,
  Coins,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  ShoppingBag,
  Layers,
  CheckCircle2,
  AlertCircle,
  Flame,
  Gavel,
  Gauge,
  Box,
  Sliders,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  SULTAN_BUSINESS_CATALOG,
  SULTAN_TRADING_ASSETS,
  SULTAN_MYSTERY_VAULTS,
} from '../data/empireAndMintolCatalog';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';

export const SultanEmpireView: React.FC = () => {
  const {
    currentAccount,
    sultanEmpireConfig,
    buySultanBusiness,
    sellSultanBusinessAuction,
    claimAllSultanBusinessProfits,
    tradeSultanAsset,
    openSultanMysteryVault,
    adminUpdateSultanEmpireConfig,
    userSettings,
  } = useBank();

  const [activeSubTab, setActiveSubTab] = useState<'mining' | 'auction' | 'trading' | 'vault'>('mining');
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [overclockMode, setOverclockMode] = useState<1 | 2 | 5>(
    userSettings?.miningOverclockDefault || 1
  );
  const [tradeQuantityMap, setTradeQuantityMap] = useState<Record<string, number>>({
    gold_antam_kg: 1,
    stock_bbna_vip: 1,
    crypto_nusa_btc: 1,
    rare_pink_diamond: 1,
  });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [claimCooldownSec, setClaimCooldownSec] = useState<number>(0);
  const [hashrateTicker, setHashrateTicker] = useState<number>(842.5);
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  useEffect(() => {
    if (claimCooldownSec <= 0) return;
    const t = setInterval(() => {
      setClaimCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [claimCooldownSec]);

  useEffect(() => {
    const t = setInterval(() => {
      setHashrateTicker((prev) => {
        const delta = (Math.random() - 0.48) * 15 * overclockMode;
        return Math.max(120, Number((prev + delta).toFixed(1)));
      });
    }, 2000);
    return () => clearInterval(t);
  }, [overclockMode]);

  if (!currentAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center text-white">
        <p className="text-lg font-bold">Silakan pilih rekening aktif terlebih dahulu.</p>
      </div>
    );
  }

  const ownedBusinesses = currentAccount.empireBusinesses || {};
  const ownedHoldings = currentAccount.empireTradingHoldings || {};

  // Hitung total penghasilan per panen
  const discountPercent = Math.min(99, Math.max(0, sultanEmpireConfig.businessDiscountPercent || 0));
  const profitMult = Math.max(1, sultanEmpireConfig.profitMultiplier || 1);

  let totalPotentialCashPerClaim = 0;
  let totalPotentialCoinsPerClaim = 0;
  let totalOwnedBusinessUnits = 0;
  let totalAuctionResaleValue = 0;

  SULTAN_BUSINESS_CATALOG.forEach((biz) => {
    const lvl = ownedBusinesses[biz.id] || 0;
    if (lvl > 0) {
      totalOwnedBusinessUnits += lvl;
      totalPotentialCashPerClaim += (biz.profitPerClaim || biz.profitPerCycle) * lvl * profitMult;
      totalPotentialCoinsPerClaim +=
        (biz.bonusSpinCoinsPerClaim || biz.bonusSpinCoinsPerCycle) *
        lvl *
        Math.max(1, Math.floor(profitMult / 2));
      const unitBase = biz.basePrice || biz.baseCost;
      const resaleMult = 1 + (biz.resaleProfitPercent || 50) / 100;
      totalAuctionResaleValue += Math.round(unitBase * lvl * resaleMult * profitMult);
    }
  });

  // Hitung nilai portofolio bursa
  let totalPortfolioValue = 0;
  SULTAN_TRADING_ASSETS.forEach((asset) => {
    const units = ownedHoldings[asset.id] || 0;
    const mult = sultanEmpireConfig.marketPriceMultiplier?.[asset.id] || 1;
    const baseP = sultanEmpireConfig.marketPrices?.[asset.id] || asset.basePrice;
    const currentPrice = Math.round(baseP * mult);
    totalPortfolioValue += units * currentPrice;
  });

  const handleClaimProfits = () => {
    if (claimCooldownSec > 0) {
      setFeedback({
        type: 'error',
        text: `Rig Mining sedang proses sinkronisasi blok! Tunggu ${claimCooldownSec} detik lagi untuk klaim berikutnya.`,
      });
      return;
    }
    const res = claimAllSultanBusinessProfits();
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setClaimCooldownSec(overclockMode === 5 ? 1 : overclockMode === 2 ? 2 : 4);
    }
  };

  const handleBuyBusiness = (businessId: string) => {
    const res = buySultanBusiness(businessId, buyQuantity);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleSellAuction = (businessId: string, qty = 1) => {
    const res = sellSultanBusinessAuction(businessId, qty);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleTrade = (assetId: string, action: 'buy' | 'sell') => {
    const qty = tradeQuantityMap[assetId] || 1;
    const res = tradeSultanAsset(assetId, action, qty);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleOpenVault = (vaultId: string) => {
    const res = openSultanMysteryVault(vaultId);
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const handleQuickOverclockBoost = (mode: 1 | 2 | 5) => {
    setOverclockMode(mode);
    adminUpdateSultanEmpireConfig({
      profitMultiplier: mode === 5 ? Math.max(profitMult, 5) : mode === 2 ? Math.max(profitMult, 2) : profitMult,
    });
    setFeedback({
      type: 'success',
      text: `⚡ Mode Overclock Mining diatur ke ${mode}x Turbo! Kecepatan klaim & bonus hashrate ditingkatkan.`,
    });
  };

  const isUnlimited =
    currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

  const categories = ['Semua', 'Rig Mining Kripto', 'Lelang Supercar & Hypercar', 'Lelang Koleksi Langka', 'Lelang Armada Eksklusif'];
  const filteredCatalog =
    categoryFilter === 'Semua'
      ? SULTAN_BUSINESS_CATALOG
      : SULTAN_BUSINESS_CATALOG.filter((b) => b.category === categoryFilter);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* HERO HEADER: PUSAT MINING KRIPTO, BALAI LELANG SUPERCAR & CYBER VAULT */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950 to-indigo-950 border-2 border-cyan-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute -right-12 -top-12 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-extrabold uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              FITUR BARU PENGGANTI KERAJAAN • BEBAS AKSES TANPA SYARAT LEVEL
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3 flex-wrap">
              <span>💎 Pusat Mining Kripto, Lelang Supercar & Cyber Vault</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Tambang uang tunai & Koin Spin otomatis dengan <strong>12 Rig GPU/Quantum</strong>, jual-beli koleksi mewah di{' '}
              <strong>Balai Lelang Supercar (+Profit s/d 250%)</strong>, trading <strong>Crypto & Saham AI Live</strong>, serta buka{' '}
              <strong>Mystery Cyber Container</strong>!
            </p>
            {sultanEmpireConfig.customAnnouncement && (
              <div className="mt-2 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>{sultanEmpireConfig.customAnnouncement}</span>
              </div>
            )}
          </div>

          {/* KARTU RINGKASAN SALDO, KOIN, DAN TOMBOL PANEN RAYA */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 min-w-[290px] sm:min-w-[350px]">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[10px] font-bold uppercase text-slate-400">Saldo Rekening</p>
                <p className="text-sm sm:text-base font-black text-emerald-400 truncate">
                  {isUnlimited ? '∞ Unlimited' : formatRupiah(currentAccount.balance)}
                </p>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[10px] font-bold uppercase text-slate-400">Koin Spin Wheel</p>
                <p className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-400" />
                  {(currentAccount.spinCoins || 0).toLocaleString('id-ID')} Koin
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 border border-cyan-400/30 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-cyan-200 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Hasil Mining ({totalOwnedBusinessUnits} Unit • {hashrateTicker} TH/s)
                </p>
                <p className="text-base sm:text-lg font-black text-white">
                  +{formatRupiah(totalPotentialCashPerClaim)}
                </p>
                <p className="text-[11px] font-bold text-amber-300">
                  + Bonus {totalPotentialCoinsPerClaim.toLocaleString('id-ID')} Koin Spin / Klaim
                </p>
              </div>
              <button
                onClick={handleClaimProfits}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 active:scale-95 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                {claimCooldownSec > 0 ? `Tunggu ${claimCooldownSec}d` : 'KLAIM MINING'}
              </button>
            </div>

            {/* OVERCLOCK TURBO BAR */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Overclock Rig:
              </span>
              <div className="flex items-center gap-1">
                {([1, 2, 5] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleQuickOverclockBoost(mode)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition cursor-pointer ${
                      overclockMode === mode
                        ? 'bg-cyan-400 text-slate-950 shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {mode}x {mode === 5 ? 'EXTREME' : mode === 2 ? 'TURBO' : 'NORMAL'}
                  </button>
                ))}
              </div>
            </div>

            {(discountPercent > 0 || profitMult > 1 || sultanEmpireConfig.vaultGuaranteedJackpot) && (
              <div className="flex flex-wrap gap-1.5">
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold">
                    🏷️ Diskon Admin {discountPercent}% Aktif
                  </span>
                )}
                {profitMult > 1 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold">
                    🚀 Boost Profit Admin {profitMult}x Lipat
                  </span>
                )}
                {sultanEmpireConfig.vaultGuaranteedJackpot && (
                  <span className="px-2 py-0.5 rounded-md bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-300 text-[10px] font-extrabold">
                    🎰 Cyber Vault Guaranteed Max Jackpot!
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* SUB-NAVIGATION TABS (4 FITUR UTAMA DI DALAM MINING & LELANG VIP) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('mining')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'mining'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-lg'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            ⛏️ 12 Rig Mining & Aset ({totalOwnedBusinessUnits} Unit)
          </button>
          <button
            onClick={() => setActiveSubTab('auction')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'auction'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Gavel className="w-4 h-4" />
            🏎️ Balai Lelang Supercar (Nilai Jual: {formatRupiah(totalAuctionResaleValue)})
          </button>
          <button
            onClick={() => setActiveSubTab('trading')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'trading'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            📊 Bursa Crypto, Saham AI & Emas ({formatRupiah(totalPortfolioValue)})
          </button>
          <button
            onClick={() => setActiveSubTab('vault')}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'vault'
                ? 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Box className="w-4 h-4" />
            🧰 Mystery Cyber Container (5 Tier)
          </button>
        </div>

        {(activeSubTab === 'mining' || activeSubTab === 'auction') && (
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400">Jumlah Beli:</span>
            {[1, 5, 10, 25].map((q) => (
              <button
                key={q}
                onClick={() => setBuyQuantity(q)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  buyQuantity === q
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {q}x
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: 12 RIG MINING KRIPTO & KOLEKSI SUPERCAR */}
      {activeSubTab === 'mining' && (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCatalog.map((biz) => {
              const currentLevel = ownedBusinesses[biz.id] || 0;
              const unitCost = Math.max(
                100,
                Math.round((biz.baseCost || biz.basePrice) * (1 - discountPercent / 100))
              );
              const totalCost = unitCost * buyQuantity;
              const profitEach = Math.round(
                (biz.profitPerClaim || biz.profitPerCycle) * profitMult
              );
              const coinsEach =
                (biz.bonusSpinCoinsPerClaim || biz.bonusSpinCoinsPerCycle) *
                Math.max(1, Math.floor(profitMult / 2));

              return (
                <div
                  key={biz.id}
                  className="bg-slate-900/95 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-2xl shrink-0">
                          {biz.iconEmoji}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300">
                              {biz.category}
                            </span>
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300">
                              {biz.badge}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1">{biz.name}</h3>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-xs">
                          Milikmu: {currentLevel}x
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{biz.description}</p>

                    <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Hasil Mining / Unit:</span>
                        <span className="font-bold text-emerald-400">+{formatRupiah(profitEach)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bonus Koin Spin / Unit:</span>
                        <span className="font-bold text-amber-400">
                          +{coinsEach.toLocaleString('id-ID')} Koin
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Profit Jual Lelang VIP:</span>
                        <span className="font-bold text-cyan-300">
                          +{biz.resaleProfitPercent || 50}% Margin Lelang
                        </span>
                      </div>
                      {currentLevel > 0 && (
                        <div className="pt-1.5 border-t border-slate-800 flex justify-between font-extrabold">
                          <span className="text-cyan-300">Total Panenmu ({currentLevel}x):</span>
                          <span className="text-emerald-300">
                            +{formatRupiah(profitEach * currentLevel)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Harga Beli ({buyQuantity}x Unit)
                      </p>
                      <p className="text-sm font-black text-white">{formatRupiah(totalCost)}</p>
                      {discountPercent > 0 && (
                        <p className="text-[10px] text-slate-500 line-through">
                          {formatRupiah((biz.baseCost || biz.basePrice) * buyQuantity)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {currentLevel > 0 && (
                        <button
                          onClick={() => handleSellAuction(biz.id, 1)}
                          title="Jual 1 Unit di Balai Lelang VIP dengan Profit Tinggi"
                          className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-black text-xs transition cursor-pointer"
                        >
                          🔨 Lelang
                        </button>
                      )}
                      <button
                        onClick={() => handleBuyBusiness(biz.id)}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Beli {buyQuantity}x
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BALAI LELANG SUPERCAR, HYPERCAR & KOLEKSI LANGKA */}
      {activeSubTab === 'auction' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Gavel className="w-5 h-5 text-amber-400" />
                Balai Lelang Internasional Supercar, Private Jet & Koleksi Langka
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Setiap unit Rig Mining, Jam Richard Mille, Supercar Porsche/Lamborghini/Ferrari, hingga Jet Pribadi yang Anda miliki dapat dilelang kembali kapan saja dengan <strong>Keuntungan Langsung +35% hingga +250%</strong>!
              </p>
            </div>
            <div className="bg-slate-950 border border-amber-500/40 rounded-xl px-4 py-3 text-right shrink-0">
              <p className="text-[10px] font-bold uppercase text-amber-300">Total Nilai Lelang Asetmu</p>
              <p className="text-lg font-black text-emerald-400">
                {formatRupiah(totalAuctionResaleValue)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SULTAN_BUSINESS_CATALOG.map((biz) => {
              const owned = ownedBusinesses[biz.id] || 0;
              const unitBase = biz.basePrice || biz.baseCost;
              const resaleBonusPercent = biz.resaleProfitPercent || 50;
              const auctionValuePerUnit = Math.round(
                unitBase * (1 + resaleBonusPercent / 100) * profitMult
              );
              const buyPrice = Math.max(
                100,
                Math.round(unitBase * (1 - discountPercent / 100))
              );

              return (
                <div
                  key={biz.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-2xl">
                          {biz.iconEmoji}
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            Margin Lelang +{resaleBonusPercent}%
                          </span>
                          <h4 className="text-sm font-black text-white mt-1">{biz.name}</h4>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-white font-black text-xs">
                        Stok: {owned} Unit
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Harga Akuisisi Standar:</span>
                        <span className="font-bold text-slate-200">{formatRupiah(buyPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Harga Jual Lelang / Unit:</span>
                        <span className="font-black text-emerald-400">
                          {formatRupiah(auctionValuePerUnit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Untung Bersih Lelang / Unit:</span>
                        <span className="font-black text-amber-300">
                          +{formatRupiah(Math.max(0, auctionValuePerUnit - buyPrice))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleBuyBusiness(biz.id)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition cursor-pointer"
                    >
                      + Akuisisi ({buyQuantity}x)
                    </button>
                    <button
                      onClick={() => handleSellAuction(biz.id, 1)}
                      disabled={owned <= 0}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-40 text-slate-950 font-black text-xs transition cursor-pointer"
                    >
                      🔨 Jual Lelang (1x)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: BURSA TRADING LIVE (CRYPTO, SAHAM AI, EMAS & BERLIAN) */}
      {activeSubTab === 'trading' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SULTAN_TRADING_ASSETS.map((asset) => {
            const mult = sultanEmpireConfig.marketPriceMultiplier?.[asset.id] || 1;
            const baseP = sultanEmpireConfig.marketPrices?.[asset.id] || asset.basePrice;
            const currentPrice = Math.max(1000, Math.round(baseP * mult));
            const ownedUnits = ownedHoldings[asset.id] || 0;
            const holdingValue = ownedUnits * currentPrice;
            const qty = tradeQuantityMap[asset.id] || 1;
            const isUp = mult >= 1;

            return (
              <div
                key={asset.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                      {asset.iconEmoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                          {asset.symbol}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Volatilitas: {asset.volatility}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white mt-0.5">{asset.name}</h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Harga Pasar Saat Ini</p>
                    <p className="text-lg font-black text-emerald-400">
                      {formatRupiah(currentPrice)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[11px] font-extrabold ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      Multiplier Admin: {mult.toFixed(2)}x
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">{asset.description}</p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block">Portofolio Anda:</span>
                    <span className="text-sm font-black text-white">
                      {ownedUnits.toLocaleString('id-ID')} {asset.unitLabel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block">Nilai Aset Tersimpan:</span>
                    <span className="text-sm font-black text-amber-400">
                      {formatRupiah(holdingValue)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-400">Jumlah Lot/Unit:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 5, 10, 50, 100].map((u) => (
                      <button
                        key={u}
                        onClick={() =>
                          setTradeQuantityMap((prev) => ({ ...prev, [asset.id]: u }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                          qty === u
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleTrade(asset.id, 'buy')}
                    className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    BELI {qty} {asset.unitLabel} ({formatRupiah(currentPrice * qty)})
                  </button>
                  <button
                    onClick={() => handleTrade(asset.id, 'sell')}
                    disabled={ownedUnits < qty}
                    className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 disabled:opacity-40 text-white font-black text-xs shadow-md active:scale-95 transition cursor-pointer"
                  >
                    JUAL {qty} {asset.unitLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: MYSTERY CYBER CONTAINER */}
      {activeSubTab === 'vault' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SULTAN_MYSTERY_VAULTS.map((vault) => {
            const finalCost = Math.max(
              100,
              Math.round((vault.cost || vault.price) * (1 - discountPercent / 100))
            );
            return (
              <div
                key={vault.id}
                className="relative overflow-hidden bg-slate-900 border-2 border-slate-800 hover:border-fuchsia-500/50 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-xl"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full bg-gradient-to-r ${vault.colorClass} text-white font-black text-xs`}
                    >
                      {vault.iconEmoji} {vault.name}
                    </span>
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />+{vault.minSpinCoins.toLocaleString('id-ID')} s/d{' '}
                      {vault.maxSpinCoins.toLocaleString('id-ID')} Koin
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{vault.description}</p>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rentang Hadiah Tunai:</span>
                      <span className="font-black text-emerald-400">
                        {formatRupiah(vault.minCashReward * profitMult)} s/d{' '}
                        {formatRupiah(vault.maxCashReward * profitMult)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bonus Koin Spin Wheel:</span>
                      <span className="font-black text-amber-400">
                        Hingga {(vault.maxSpinCoins * profitMult).toLocaleString('id-ID')} Koin
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bonus Voucher Level:</span>
                      <span className="font-black text-cyan-300">
                        +{vault.minLevelVouchers} s/d +{vault.maxLevelVouchers} Voucher
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Biaya Buka Container
                    </p>
                    <p className="text-base font-black text-white">{formatRupiah(finalCost)}</p>
                  </div>
                  <button
                    onClick={() => handleOpenVault(vault.id)}
                    className={`px-5 py-3 rounded-2xl bg-gradient-to-r ${vault.colorClass} hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-lg active:scale-95 transition flex items-center gap-2 cursor-pointer`}
                  >
                    <Flame className="w-4 h-4" />
                    BUKA CONTAINER
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
