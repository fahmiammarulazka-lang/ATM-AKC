import React, { useEffect, useState } from 'react';
import {
  Users,
  QrCode,
  Trash2,
  RefreshCw,
  Coins,
  Eye,
  EyeOff,
  SlidersHorizontal,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  DIAMOND_FEATURE_METADATA,
  MAX_DIAMOND_PACKAGE_AMOUNT,
  MAX_DIAMOND_PURCHASE_RUPIAH,
  UI_VISIBILITY_NAV_METADATA,
} from '../data/diamondCatalog';
import { formatRupiah } from '../utils/bankUtils';
import { DiamondIcon, DiamondText } from './DiamondIcon';
import { AdminWarningStudioSection } from './AdminWarningStudioSection';

interface QrisGatewayStatusInfo {
  hasLoginId: boolean;
  hasAccountId: boolean;
  hasSecretKey: boolean;
  hasWebhookUrl: boolean;
  hasApiKey: boolean;
  hasMerchantId: boolean;
  hasWebhookSecret: boolean;
  hasStaticQris: boolean;
  activeMode: 'api' | 'emvco';
}

export const AdminDiamondFamilyTab: React.FC = () => {
  const {
    accounts,
    diamondConfig,
    qrisOrders,
    adminUpdateDiamondConfig,
    adminResetDiamondConfig,
    adminAdjustAccountDiamonds,
    uiVisibilityConfig,
    adminUpdateUiVisibility,
    adminShowAllUiVisibility,
    familyConfig,
    families,
    adminUpdateFamilyConfig,
    adminDeleteFamily,
  } = useBank();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc-admin');
  const [diamondAdjustVal, setDiamondAdjustVal] = useState<number>(500);
  const [feedback, setFeedback] = useState<string>('');
  const [qrisConfigStatus, setQrisConfigStatus] = useState<QrisGatewayStatusInfo | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);

  const fetchQrisStatus = async () => {
    setLoadingStatus(true);
    try {
      const resp = await fetch('/api/qris/config-status');
      if (resp.ok) {
        const data = (await resp.json()) as QrisGatewayStatusInfo;
        setQrisConfigStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void fetchQrisStatus();
  }, []);

  const showMsg = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(''), 4500);
  };

  return (
    <div className="space-y-6 text-xs">
      {feedback && (
        <div className="rounded-2xl border border-emerald-400 bg-emerald-950/90 px-4 py-3 font-bold text-emerald-200">
          ✅ <DiamondText text={feedback} tone="bright" />
        </div>
      )}

      {/* SECTION 1: KONTROL FITUR DIAMOND & SALDO DIAMOND NASABAH */}
      <div className="rounded-3xl border-2 border-cyan-500/60 bg-gradient-to-br from-slate-900 via-cyan-950/50 to-slate-900 p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              <DiamondIcon tone="bright" className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400">
                <span>KONTROL PENUH</span>
                <DiamondIcon tone="bright" className="h-3 w-3" />
                <span>&amp; QRIS (250 PAKET + CUSTOM)</span>
              </span>
              <h2 className="flex flex-wrap items-center gap-1.5 text-lg font-black text-white">
                <span>Pengaturan Fitur</span>
                <DiamondIcon tone="bright" className="h-5 w-5" />
                <span>&amp; Manajemen Saldo</span>
                <DiamondIcon tone="bright" className="h-5 w-5" />
              </h2>
              <p className="text-[11px] text-slate-400">
                Atur fitur mana saja yang boleh memakai <DiamondIcon tone="bright" className="h-3 w-3 mx-0.5" />. Untuk Diskon &amp; Harga per <DiamondIcon tone="bright" className="h-3 w-3 mx-0.5" /> juga terintegrasi di tab <strong>Kontrol Spin Wheel &amp; Diskon</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const res = adminResetDiamondConfig();
              showMsg(res.message);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 font-bold text-cyan-300 hover:bg-slate-700 cursor-pointer"
          >
            <span>Reset Default</span>
            <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Kontrol Harga, Diskon & Batas Maksimal Dual-Cap (11.099 & Rp 998.910) */}
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/80 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-white flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <span>Harga Satuan, Diskon &amp; Batas Maksimal Pembelian</span>
            </h3>
            <span className="text-[11px] font-mono text-cyan-300">
              Batas Sistem: Maks {MAX_DIAMOND_PACKAGE_AMOUNT.toLocaleString('id-ID')} &amp; Rp{' '}
              {MAX_DIAMOND_PURCHASE_RUPIAH.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Harga Dasar per 1 Permata (Rp)
              </label>
              <input
                type="number"
                min={1}
                value={diamondConfig.baseDiamondPriceRupiah}
                onChange={(e) => {
                  const res = adminUpdateDiamondConfig({
                    baseDiamondPriceRupiah: Math.max(1, Number(e.target.value) || 90),
                  });
                  showMsg(res.message);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono font-bold text-white"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Diskon Aktif (0 – 99%)
              </label>
              <input
                type="number"
                min={0}
                max={99}
                value={diamondConfig.diamondDiscountPercent}
                onChange={(e) => {
                  const res = adminUpdateDiamondConfig({
                    diamondDiscountPercent: Math.max(0, Math.min(99, Number(e.target.value) || 0)),
                  });
                  showMsg(res.message);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono font-bold text-amber-300"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Maks Jumlah (≤ {MAX_DIAMOND_PACKAGE_AMOUNT.toLocaleString('id-ID')})
              </label>
              <input
                type="number"
                min={1}
                max={MAX_DIAMOND_PACKAGE_AMOUNT}
                value={diamondConfig.maxCustomDiamond}
                onChange={(e) => {
                  const res = adminUpdateDiamondConfig({
                    maxCustomDiamond: Math.max(
                      1,
                      Math.min(MAX_DIAMOND_PACKAGE_AMOUNT, Number(e.target.value) || MAX_DIAMOND_PACKAGE_AMOUNT)
                    ),
                  });
                  showMsg(res.message);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono font-bold text-cyan-300"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Maks Harga Dasar Rp (≤ {MAX_DIAMOND_PURCHASE_RUPIAH.toLocaleString('id-ID')})
              </label>
              <input
                type="number"
                min={1}
                max={MAX_DIAMOND_PURCHASE_RUPIAH}
                value={diamondConfig.maxPurchaseRupiah}
                onChange={(e) => {
                  const res = adminUpdateDiamondConfig({
                    maxPurchaseRupiah: Math.max(
                      1,
                      Math.min(MAX_DIAMOND_PURCHASE_RUPIAH, Number(e.target.value) || MAX_DIAMOND_PURCHASE_RUPIAH)
                    ),
                  });
                  showMsg(res.message);
                }}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono font-bold text-emerald-300"
              />
            </div>
          </div>
        </div>

        {/* Toggle 5 Diamond Features */}
        <div>
          <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-300">
            <span>Fitur yang Diizinkan Menggunakan</span>
            <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
            <span>(Toggle On/Off)</span>
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {DIAMOND_FEATURE_METADATA.map((feat) => {
              const enabled = Boolean(diamondConfig.enabledFeatures?.[feat.key]);
              return (
                <label
                  key={feat.key}
                  className={`flex cursor-pointer items-start justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    enabled
                      ? 'border-cyan-400/60 bg-cyan-950/40'
                      : 'border-slate-800 bg-slate-950/70 opacity-75'
                  }`}
                >
                  <div>
                    <p className="font-black text-white">
                      <DiamondText text={feat.label} tone="bright" />
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      <DiamondText text={feat.description} tone="bright" iconClassName="h-3 w-3 mx-0.5" />
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      const res = adminUpdateDiamondConfig({
                        enabledFeatures: {
                          ...diamondConfig.enabledFeatures,
                          [feat.key]: e.target.checked,
                        },
                      });
                      showMsg(res.message);
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-400 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>

        {/* Inject / Set Account Diamonds */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
          <h3 className="font-black text-white flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-cyan-400" />
            <span>Atur / Suntik Saldo</span>
            <DiamondIcon tone="bright" className="h-4 w-4" />
            <span>Nasabah</span>
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="sm:col-span-5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white font-bold"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.fullName} ({acc.accountNumber}) — Saldo: {(acc.diamonds || 0).toLocaleString('id-ID')}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={diamondAdjustVal}
              onChange={(e) => setDiamondAdjustVal(Math.max(0, Number(e.target.value) || 0))}
              className="sm:col-span-3 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white"
              placeholder="Jumlah"
            />
            <div className="sm:col-span-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const res = adminAdjustAccountDiamonds(selectedAccountId, diamondAdjustVal, 'add');
                  showMsg(res.message);
                }}
                className="flex-1 rounded-xl bg-cyan-500 px-3 py-2 font-black text-slate-950 hover:bg-cyan-400 cursor-pointer"
              >
                + Tambah
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = adminAdjustAccountDiamonds(selectedAccountId, diamondAdjustVal, 'set');
                  showMsg(res.message);
                }}
                className="flex-1 rounded-xl bg-slate-800 px-3 py-2 font-black text-cyan-300 border border-cyan-500/40 hover:bg-slate-700 cursor-pointer"
              >
                Set Persis
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1B: KONTROL SEMBUNYIKAN / MUNCULKAN TAB NAVIGASI, TOP-UP & TOKO (REAL-TIME) */}
      <div className="rounded-3xl border-2 border-emerald-500/50 bg-slate-900/95 p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              <Eye className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                KONTROL TAMPILAN NAVIGASI &amp; FITUR REAL-TIME
              </span>
              <h3 className="text-lg font-black text-white">
                Sembunyikan / Munculkan Tab &amp; Fitur (Berlaku ke Semua Nasabah)
              </h3>
              <p className="text-[11px] text-slate-400">
                Jika tab yang sedang dibuka nasabah disembunyikan, layar otomatis berpindah ke Mobile Banking dengan pesan info.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const res = adminShowAllUiVisibility();
              showMsg(res.message);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 font-black text-slate-950 cursor-pointer transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>Tampilkan Semua</span>
          </button>
        </div>

        {/* Sakelar Terpisah: Indikator Saldo Permata, Tombol + Top-Up & 3 Sub-Tab Toko */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
            Sakelar Terpisah Navbar Permata &amp; Sub-Tab Toko
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                { key: 'showDiamondBalance', label: 'Indikator Saldo Permata', desc: 'Kotak jumlah permata di Navbar' },
                { key: 'showDiamondTopUpButton', label: 'Tombol + Top-Up', desc: 'Tombol tambah (+) buka Toko' },
                { key: 'storeTabTopUp', label: 'Tab Toko: Top-Up', desc: '250 Paket & Beli Custom' },
                { key: 'storeTabUse', label: 'Tab Toko: Gunakan', desc: 'Tukar & Upgrade Level' },
                { key: 'storeTabHistory', label: 'Tab Toko: Riwayat', desc: 'Riwayat Tagihan QRIS' },
              ] as const
            ).map((item) => {
              const isVisible = uiVisibilityConfig[item.key] !== false;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    const res = adminUpdateUiVisibility({ [item.key]: !isVisible });
                    showMsg(res.message);
                  }}
                  className={`flex items-start justify-between gap-2 rounded-2xl border p-3 text-left transition cursor-pointer ${
                    isVisible
                      ? 'border-emerald-500/50 bg-emerald-950/35 text-white'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] opacity-75 mt-0.5">{item.desc}</p>
                  </div>
                  {isVisible ? (
                    <Eye className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 13 Tab Navigasi Utama */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Tab Navigasi Utama Navbar ({UI_VISIBILITY_NAV_METADATA.length} Tab)
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {UI_VISIBILITY_NAV_METADATA.map((navItem) => {
              const isVisible = uiVisibilityConfig.navTabs[navItem.key] !== false;
              return (
                <button
                  key={navItem.key}
                  type="button"
                  onClick={() => {
                    const res = adminUpdateUiVisibility({
                      navTabs: { [navItem.key]: !isVisible },
                    });
                    showMsg(res.message);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition cursor-pointer ${
                    isVisible
                      ? 'border-emerald-500/45 bg-slate-950 text-white hover:border-emerald-400'
                      : 'border-rose-500/35 bg-rose-950/20 text-slate-400 hover:border-rose-400'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{navItem.label}</p>
                    <p className="text-[10px] opacity-70 truncate">{navItem.description}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                      isVisible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {isVisible ? 'Tampil' : 'Sembunyi'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 1C: STUDIO PERINGATAN SISTEM NASABAH (25 PRESET + MANUAL) */}
      <AdminWarningStudioSection />

      {/* SECTION 2: MONITOR INTEGRASI QRIS & RIWAYAT ORDER */}
      <div className="rounded-3xl border-2 border-sky-500/50 bg-slate-900/95 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/40">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white">
                Status Koneksi QRIS &amp; Monitor Transaksi ({qrisOrders.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Pantau kesiapan layanan pembayaran QRIS Nusantara dan riwayat transaksi nasabah secara real-time.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchQrisStatus()}
            disabled={loadingStatus}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 font-bold text-sky-300 hover:bg-slate-700 cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {qrisConfigStatus && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[10px] text-slate-400 block">Mode Aktif</span>
              <span className="font-black text-sky-300 uppercase">
                {qrisConfigStatus.activeMode === 'api' ? 'QRIS LIVE' : 'QRIS DINAMIS'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[10px] text-slate-400 block">Akun Gateway</span>
              <span className={qrisConfigStatus.hasAccountId ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'}>
                {qrisConfigStatus.hasAccountId ? 'Aktif' : 'Standby'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[10px] text-slate-400 block">Otentikasi</span>
              <span className={qrisConfigStatus.hasLoginId ? 'font-bold text-emerald-400' : 'font-bold text-slate-400'}>
                {qrisConfigStatus.hasLoginId ? 'Terhubung' : 'Opsional'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[10px] text-slate-400 block">Kunci Server</span>
              <span className={qrisConfigStatus.hasSecretKey ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'}>
                {qrisConfigStatus.hasSecretKey ? 'Aktif' : 'Fallback EMVCo'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[10px] text-slate-400 block">Sinkronisasi</span>
              <span className={qrisConfigStatus.hasWebhookUrl ? 'font-bold text-emerald-400' : 'font-bold text-sky-300'}>
                {qrisConfigStatus.hasWebhookUrl ? 'Otomatis Aktif' : 'Siap Terima'}
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="text-[10px] text-slate-400 block">QRIS Dinamis</span>
              <span className={qrisConfigStatus.hasStaticQris ? 'font-bold text-emerald-400' : 'font-bold text-slate-400'}>
                {qrisConfigStatus.hasStaticQris ? 'Siap' : 'Default'}
              </span>
            </div>
          </div>
        )}

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {qrisOrders.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-slate-500">
              Belum ada transaksi QRIS yang dibuat nasabah.
            </p>
          ) : (
            qrisOrders.slice(0, 30).map((ord) => (
              <div
                key={ord.orderId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{ord.accountName}</span>
                    <span className="inline-flex items-center gap-1 text-cyan-300 font-black">
                      <span>+{(ord.diamondAmount || 0).toLocaleString('id-ID')}</span>
                      <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-black ${
                        ord.status === 'LUNAS'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : ord.status === 'EXPIRED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-slate-400">
                    {ord.orderId} • Mode {ord.modeUsed.toUpperCase()} • {new Date(ord.createdAt).toLocaleString('id-ID')}
                  </p>
                </div>
                <span className="font-mono font-black text-sky-300 tabular-nums">
                  {formatRupiah(ord.totalAmount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 3: PENGATURAN PENUH FITUR KELUARGA & MODERASI */}
      <div className="rounded-3xl border-2 border-indigo-500/50 bg-slate-900/95 p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/40">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">
                PANEL PENGATURAN KELUARGA LENGKAP
              </span>
              <h3 className="text-lg font-black text-white">
                Slot Keluarga, Tarif Bertingkat &amp; Daftar Keluarga Aktif ({families.length})
              </h3>
            </div>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-950/60 px-3.5 py-2 font-black text-indigo-200">
            <input
              type="checkbox"
              checked={familyConfig.enabled}
              onChange={(e) => {
                const res = adminUpdateFamilyConfig({ enabled: e.target.checked });
                showMsg(res.message);
              }}
              className="h-4 w-4 accent-indigo-500"
            />
            Aktifkan Fitur Keluarga
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Slot Default Buat Keluarga
            </label>
            <input
              type="number"
              min={1}
              value={familyConfig.defaultMaxFamilies}
              onChange={(e) =>
                adminUpdateFamilyConfig({
                  defaultMaxFamilies: Math.max(1, Number(e.target.value) || 1),
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white"
            />
            <span className="text-[10px] text-slate-500">Bawaan: 1 Keluarga per akun</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Biaya Dasar Uang Tambah Slot (Rp)
            </label>
            <input
              type="number"
              min={0}
              step={500000}
              value={familyConfig.baseSlotMoneyCost}
              onChange={(e) =>
                adminUpdateFamilyConfig({
                  baseSlotMoneyCost: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white"
            />
            <span className="text-[10px] text-slate-500">
              Bertingkat: 1x = {formatRupiah(familyConfig.baseSlotMoneyCost)}, 2x ={' '}
              {formatRupiah(familyConfig.baseSlotMoneyCost * 2)}, 3x ={' '}
              {formatRupiah(familyConfig.baseSlotMoneyCost * 3)}
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-bold text-slate-300">
              <span>Biaya Dasar</span>
              <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
              <span>Tambah Slot</span>
            </label>
            <input
              type="number"
              min={0}
              step={10}
              value={familyConfig.baseSlotDiamondCost}
              onChange={(e) =>
                adminUpdateFamilyConfig({
                  baseSlotDiamondCost: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-cyan-300"
            />
            <span className="inline-flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
              <span>Bertingkat: {familyConfig.baseSlotDiamondCost}</span>
              <DiamondIcon tone="bright" className="h-3 w-3" />
              <span>, {familyConfig.baseSlotDiamondCost * 2}</span>
              <DiamondIcon tone="bright" className="h-3 w-3" />
              <span>, {familyConfig.baseSlotDiamondCost * 3}</span>
              <DiamondIcon tone="bright" className="h-3 w-3" />
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Maks Anggota per Keluarga
            </label>
            <input
              type="number"
              min={2}
              value={familyConfig.maxMembersPerFamily}
              onChange={(e) =>
                adminUpdateFamilyConfig({
                  maxMembersPerFamily: Math.max(2, Number(e.target.value) || 50),
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white"
            />
            <span className="text-[10px] text-slate-500">Batas kapasitas anggota</span>
          </div>
        </div>

        {/* Active Families Moderation List */}
        <div className="space-y-2">
          <h4 className="font-black text-indigo-300">Daftar Keluarga Terdaftar ({families.length})</h4>
          {families.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 py-5 text-center text-slate-500">
              Belum ada keluarga yang dibuat oleh nasabah.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {families.map((fam) => {
                const ownerAcc = accounts.find((a) => a.id === fam.ownerAccountId);
                return (
                  <div
                    key={fam.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3.5"
                  >
                    <div>
                      <p className="font-black text-white">{fam.name}</p>
                      <p className="font-mono text-[11px] text-indigo-300">Kode: {fam.familyCode}</p>
                      <p className="text-[10px] text-slate-400">
                        Kepala Keluarga: {ownerAcc?.fullName || fam.ownerAccountId} •{' '}
                        {fam.members.length} anggota
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminDeleteFamily(fam.id);
                        showMsg(res.message);
                      }}
                      className="rounded-xl bg-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                      title="Bubarkan Keluarga"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
