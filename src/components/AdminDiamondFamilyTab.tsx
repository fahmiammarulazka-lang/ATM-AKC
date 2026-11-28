import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  QrCode,
  Trash2,
  RefreshCw,
  Coins,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Save,
  AlertTriangle,
  Upload,
  CheckCircle2,
  XCircle,
  Zap,
  Wifi,
  RotateCcw,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  DIAMOND_FEATURE_METADATA,
  MAX_DIAMOND_PACKAGE_AMOUNT,
  MAX_DIAMOND_PURCHASE_RUPIAH,
  UI_VISIBILITY_NAV_METADATA,
} from '../data/diamondCatalog';
import { formatRupiah, formatAssetCount, isAdminCardAccount } from '../utils/bankUtils';
import { DiamondIcon, DiamondText } from './DiamondIcon';

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
  accountId?: string;
  loginId?: string;
  webhookUrl?: string;
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
    qrisAdminConfig,
    manualQrisSubmissions,
    adminUpdateQrisConfig,
    adminResetQrisConfig,
    adminReviewManualQrisSubmission,
    adminSimulateQrisOrder,
  } = useBank();

  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || 'acc-admin');
  const [diamondAdjustVal, setDiamondAdjustVal] = useState<number>(500);
  const [feedback, setFeedback] = useState<string>('');
  const [qrisConfigStatus, setQrisConfigStatus] = useState<QrisGatewayStatusInfo | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [confirmResetDiamond, setConfirmResetDiamond] = useState<boolean>(false);

  // Hybrid BuatQRIS & QR Manual Admin states
  const [qrModeDraft, setQrModeDraft] = useState<'auto_buatqris' | 'manual_override'>(
    qrisAdminConfig.mode || 'auto_buatqris'
  );
  const [manualQrisStringDraft, setManualQrisStringDraft] = useState<string>(
    qrisAdminConfig.manualQrisString || ''
  );
  const [manualQrImageDraft, setManualQrImageDraft] = useState<string>(
    qrisAdminConfig.manualQrImageDataUrl || ''
  );
  const [manualDynamicDraft, setManualDynamicDraft] = useState<boolean>(
    Boolean(qrisAdminConfig.manualUseDynamicEmvco ?? true)
  );
  const [manualNoteDraft, setManualNoteDraft] = useState<string>(
    qrisAdminConfig.manualPaymentNote || ''
  );
  const [testingGateway, setTestingGateway] = useState<boolean>(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{
    ok: boolean;
    message: string;
    detail?: string;
  } | null>(null);
  const [simulatingOrderId, setSimulatingOrderId] = useState<string | null>(null);
  const [proofLightboxUrl, setProofLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    setQrModeDraft(qrisAdminConfig.mode || 'auto_buatqris');
    setManualQrisStringDraft(qrisAdminConfig.manualQrisString || '');
    setManualQrImageDraft(qrisAdminConfig.manualQrImageDataUrl || '');
    setManualDynamicDraft(Boolean(qrisAdminConfig.manualUseDynamicEmvco ?? true));
    setManualNoteDraft(qrisAdminConfig.manualPaymentNote || '');
  }, [qrisAdminConfig]);

  // Anti-reset local string drafts for Diamond & Family configs
  const isDiamondDirtyRef = useRef<boolean>(false);
  const [diamondDraft, setDiamondDraft] = useState(() => ({
    baseDiamondPriceRupiah: String(diamondConfig.baseDiamondPriceRupiah ?? 90),
    diamondDiscountPercent: String(diamondConfig.diamondDiscountPercent ?? 0),
    maxCustomDiamond: String(diamondConfig.maxCustomDiamond ?? MAX_DIAMOND_PACKAGE_AMOUNT),
    maxPurchaseRupiah: String(diamondConfig.maxPurchaseRupiah ?? MAX_DIAMOND_PURCHASE_RUPIAH),
  }));

  useEffect(() => {
    if (!isDiamondDirtyRef.current) {
      setDiamondDraft({
        baseDiamondPriceRupiah: String(diamondConfig.baseDiamondPriceRupiah ?? 90),
        diamondDiscountPercent: String(diamondConfig.diamondDiscountPercent ?? 0),
        maxCustomDiamond: String(diamondConfig.maxCustomDiamond ?? MAX_DIAMOND_PACKAGE_AMOUNT),
        maxPurchaseRupiah: String(diamondConfig.maxPurchaseRupiah ?? MAX_DIAMOND_PURCHASE_RUPIAH),
      });
    }
  }, [diamondConfig]);

  const isFamilyDirtyRef = useRef<boolean>(false);
  const [familyDraft, setFamilyDraft] = useState(() => ({
    defaultMaxFamilies: String(familyConfig.defaultMaxFamilies ?? 1),
    baseSlotMoneyCost: String(familyConfig.baseSlotMoneyCost ?? 2_500_000),
    baseSlotDiamondCost: String(familyConfig.baseSlotDiamondCost ?? 100),
    maxMembersPerFamily: String(familyConfig.maxMembersPerFamily ?? 25),
  }));

  useEffect(() => {
    if (!isFamilyDirtyRef.current) {
      setFamilyDraft({
        defaultMaxFamilies: String(familyConfig.defaultMaxFamilies ?? 1),
        baseSlotMoneyCost: String(familyConfig.baseSlotMoneyCost ?? 2_500_000),
        baseSlotDiamondCost: String(familyConfig.baseSlotDiamondCost ?? 100),
        maxMembersPerFamily: String(familyConfig.maxMembersPerFamily ?? 25),
      });
    }
  }, [familyConfig]);

  const parseDraftNum = (raw: string, min: number, max: number) => {
    const t = raw.trim();
    if (t === '') return min;
    const n = Number(t);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min;
  };

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

  const handleManualQrImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        const maxDim = 680;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(120, Math.round(img.width * scale));
        canvas.height = Math.max(120, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setManualQrImageDraft(canvas.toDataURL('image/jpeg', 0.86));
        } else {
          setManualQrImageDraft(src);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleTestBuatQrisConnection = async () => {
    setTestingGateway(true);
    setGatewayTestResult(null);
    try {
      const resp = await fetch('/api/qris/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      setGatewayTestResult({
        ok: Boolean(data.success),
        message: data.message || (data.success ? 'Koneksi BuatQRIS Sehat!' : 'Gagal terhubung ke gateway.'),
        detail: data.gatewayMode ? `Mode: ${data.gatewayMode} • Latency: ${data.latencyMs ?? 0}ms` : undefined,
      });
      void fetchQrisStatus();
    } catch (err) {
      setGatewayTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Gagal menghubungi server /api/qris/test-connection.',
      });
    } finally {
      setTestingGateway(false);
    }
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
            onClick={() => setConfirmResetDiamond(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 font-bold text-cyan-300 hover:bg-slate-700 cursor-pointer"
          >
            <span>Reset Default</span>
            <DiamondIcon tone="bright" className="h-3.5 w-3.5" />
          </button>
        </div>

        {confirmResetDiamond && (
          <div className="rounded-2xl border-2 border-rose-400 bg-rose-950/90 p-3.5 flex flex-wrap items-center justify-between gap-2 text-rose-100">
            <span className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              Konfirmasi Reset Pengaturan Permata ke Standar Bawaan?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetDiamond(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = adminResetDiamondConfig();
                  isDiamondDirtyRef.current = false;
                  setConfirmResetDiamond(false);
                  showMsg(res.message);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500 text-white font-black cursor-pointer"
              >
                Ya, Reset
              </button>
            </div>
          </div>
        )}

        {/* Kontrol Harga, Diskon & Batas Maksimal Dual-Cap (11.099 & Rp 998.910) */}
        <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/80 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-black text-white flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <span>Harga Satuan, Diskon &amp; Batas Maksimal Pembelian</span>
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-cyan-300">
                Batas Sistem: Maks {MAX_DIAMOND_PACKAGE_AMOUNT.toLocaleString('id-ID')} &amp; Rp{' '}
                {MAX_DIAMOND_PURCHASE_RUPIAH.toLocaleString('id-ID')}
              </span>
              <button
                type="button"
                onClick={() => {
                  const res = adminUpdateDiamondConfig({
                    baseDiamondPriceRupiah: parseDraftNum(
                      diamondDraft.baseDiamondPriceRupiah,
                      0,
                      1_000_000_000
                    ),
                    diamondDiscountPercent: parseDraftNum(diamondDraft.diamondDiscountPercent, 0, 99),
                    maxCustomDiamond: parseDraftNum(
                      diamondDraft.maxCustomDiamond,
                      1,
                      MAX_DIAMOND_PACKAGE_AMOUNT
                    ),
                    maxPurchaseRupiah: parseDraftNum(
                      diamondDraft.maxPurchaseRupiah,
                      0,
                      MAX_DIAMOND_PURCHASE_RUPIAH
                    ),
                  });
                  isDiamondDirtyRef.current = false;
                  showMsg(res.message);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 px-3.5 py-1.5 font-black text-slate-950 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block">
                Harga Dasar per 1 Permata (Rp)
              </label>
              <input
                type="number"
                min={0}
                value={diamondDraft.baseDiamondPriceRupiah}
                onChange={(e) => {
                  isDiamondDirtyRef.current = true;
                  setDiamondDraft((prev) => ({
                    ...prev,
                    baseDiamondPriceRupiah: e.target.value,
                  }));
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
                value={diamondDraft.diamondDiscountPercent}
                onChange={(e) => {
                  isDiamondDirtyRef.current = true;
                  setDiamondDraft((prev) => ({
                    ...prev,
                    diamondDiscountPercent: e.target.value,
                  }));
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
                value={diamondDraft.maxCustomDiamond}
                onChange={(e) => {
                  isDiamondDirtyRef.current = true;
                  setDiamondDraft((prev) => ({
                    ...prev,
                    maxCustomDiamond: e.target.value,
                  }));
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
                min={0}
                max={MAX_DIAMOND_PURCHASE_RUPIAH}
                value={diamondDraft.maxPurchaseRupiah}
                onChange={(e) => {
                  isDiamondDirtyRef.current = true;
                  setDiamondDraft((prev) => ({
                    ...prev,
                    maxPurchaseRupiah: e.target.value,
                  }));
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
        {(() => {
          const selectedTargetAcc = accounts.find((a) => a.id === selectedAccountId);
          const targetIsAdmin = isAdminCardAccount(selectedTargetAcc);
          return (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-black text-white flex items-center gap-1.5">
                  <Coins className="h-4 w-4 text-cyan-400" />
                  <span>Atur / Suntik Saldo</span>
                  <DiamondIcon tone="bright" className="h-4 w-4" />
                  <span>Nasabah</span>
                </h3>
                {targetIsAdmin && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-black text-[11px]">
                    Kartu ADMIN · Sudah ∞ (Tetap bisa disinkronkan)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="sm:col-span-5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white font-bold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} ({acc.accountNumber}) — Saldo: {formatAssetCount(acc.diamonds, { isAdmin: isAdminCardAccount(acc) })}
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
          );
        })()}
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

      {/* SECTION 2: KELOLA HYBRID BUATQRIS BOT, QR MANUAL ADMIN, TES KONEKSI & BUKTI TRANSFER */}
      <div className="rounded-3xl border-2 border-sky-500/50 bg-slate-900/95 p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 border border-sky-400/40">
              <QrCode className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white">
                Kelola QRIS Hybrid (Bot BuatQRIS &amp; QR Manual Admin) • {qrisOrders.length} Transaksi
              </h3>
              <p className="text-[11px] text-slate-400">
                Jika Admin tidak mengaktifkan QR Manual, sistem otomatis memakai Bot &amp; API BuatQRIS bawaan agar Top-Up Diamond selalu berjalan tanpa error.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleTestBuatQrisConnection()}
              disabled={testingGateway}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 px-3 py-2 font-bold text-emerald-300 cursor-pointer shrink-0"
            >
              <Wifi className={`h-3.5 w-3.5 ${testingGateway ? 'animate-pulse' : ''}`} />
              <span>{testingGateway ? 'Mengetes...' : 'Tes Koneksi BuatQRIS'}</span>
            </button>
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
        </div>

        {gatewayTestResult && (
          <div
            className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-2 ${
              gatewayTestResult.ok
                ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-200'
                : 'border-rose-500/50 bg-rose-950/40 text-rose-200'
            }`}
          >
            <div>
              <p className="font-black">{gatewayTestResult.message}</p>
              {gatewayTestResult.detail && <p className="text-[11px] opacity-80">{gatewayTestResult.detail}</p>}
            </div>
            <button type="button" onClick={() => setGatewayTestResult(null)} className="opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {qrisConfigStatus && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] text-slate-400 block">Alur Top-Up Diamond</span>
                <span className="font-black text-emerald-300 uppercase">
                  REDIRECT BUATQRIS.SITE
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] text-slate-400 block">API Account ID</span>
                <span className={qrisConfigStatus.hasAccountId ? 'font-bold text-emerald-400 font-mono text-[10px] break-all' : 'font-bold text-amber-400'}>
                  {qrisConfigStatus.accountId || 'Aktif'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] text-slate-400 block">ID Login Merchant</span>
                <span className="font-bold text-sky-300 font-mono text-[10px] break-all">
                  {qrisConfigStatus.loginId || 'Terhubung'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] text-slate-400 block">Secret Key (Server)</span>
                <span className={qrisConfigStatus.hasSecretKey ? 'font-bold text-emerald-400' : 'font-bold text-amber-400'}>
                  {qrisConfigStatus.hasSecretKey ? 'Tersimpan Aman' : 'Isi di Secrets Server'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] text-slate-400 block">Webhook Otomatis</span>
                <span className="font-bold text-emerald-400 font-mono text-[10px] break-all">
                  {qrisConfigStatus.webhookUrl || 'Siap Terima'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                <span className="text-[10px] text-slate-400 block">QRIS di Dashboard</span>
                <span className="font-bold text-cyan-300">Dinonaktifkan (Tab Baru)</span>
              </div>
            </div>
          </div>
        )}

        {/* PANEL PENGATURAN QR MANUAL ADMIN VS BOT BUATQRIS */}
        <div className="rounded-2xl border border-sky-500/40 bg-slate-950/90 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-white">Pengaturan Sumber Kode QRIS Pembayaran Diamond</h4>
              <p className="text-[11px] text-slate-400">
                Pilih Mode Bot BuatQRIS (otomatis terverifikasi) atau ganti dengan QRIS Pribadi / Toko Admin.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const res = adminResetQrisConfig();
                  showMsg(res.message);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 font-bold text-slate-200 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset ke Bot BuatQRIS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = adminUpdateQrisConfig({
                    mode: qrModeDraft,
                    manualQrisString: manualQrisStringDraft.trim() || undefined,
                    manualQrImageDataUrl: manualQrImageDraft || undefined,
                    manualUseDynamicEmvco: manualDynamicDraft,
                    manualPaymentNote: manualNoteDraft.trim() || undefined,
                  });
                  showMsg(res.message);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-400 hover:bg-sky-300 px-3.5 py-1.5 font-black text-slate-950 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Simpan Mode QRIS</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setQrModeDraft('auto_buatqris')}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                qrModeDraft === 'auto_buatqris'
                  ? 'border-emerald-400 bg-emerald-950/40 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              <p className="font-black text-sm">🤖 Mode Bawaan: Bot BuatQRIS Otomatis</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                QR dibuat langsung oleh Bot/API BuatQRIS dengan verifikasi otomatis &amp; fallback EMVCo aman.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setQrModeDraft('manual_override')}
              className={`rounded-2xl border p-3.5 text-left transition cursor-pointer ${
                qrModeDraft === 'manual_override'
                  ? 'border-amber-400 bg-amber-950/40 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              }`}
            >
              <p className="font-black text-sm">🖼️ Mode QR Manual Admin Sendiri</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Gunakan gambar QR atau teks QRIS statis milik Admin. Nasabah unggah bukti transfer &amp; Admin setujui instan.
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 space-y-2 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <label className="font-bold text-slate-200 block">Upload Gambar Kode QR Manual (PNG/JPG)</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 font-bold text-cyan-300 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Pilih Gambar QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleManualQrImageUpload(f);
                    }}
                  />
                </label>
                {manualQrImageDraft && (
                  <button
                    type="button"
                    onClick={() => setManualQrImageDraft('')}
                    className="rounded-xl bg-rose-500/20 px-2.5 py-2 font-bold text-rose-300 hover:bg-rose-500/30"
                  >
                    Hapus Gambar
                  </button>
                )}
              </div>
              {manualQrImageDraft ? (
                <div className="mt-2 inline-block rounded-xl bg-white p-2">
                  <img src={manualQrImageDraft} alt="Preview QR Manual" className="h-28 w-28 object-contain" />
                </div>
              ) : (
                <p className="text-[10px] text-slate-500">Belum ada gambar QR custom (opsional jika sudah isi string QRIS).</p>
              )}
            </div>

            <div className="lg:col-span-7 space-y-2.5 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Tempel Teks String QRIS Statis (Dimulai 000201...)
                </label>
                <textarea
                  rows={2}
                  value={manualQrisStringDraft}
                  onChange={(e) => setManualQrisStringDraft(e.target.value)}
                  placeholder="00020101021126670016COM.NOBUBANK.WWW..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-[11px] text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={manualDynamicDraft}
                    onChange={(e) => setManualDynamicDraft(e.target.checked)}
                    className="h-4 w-4 accent-sky-400"
                  />
                  <span className="font-semibold text-slate-300">Suntik Nominal Dinamis EMVCo</span>
                </label>
                <input
                  type="text"
                  value={manualNoteDraft}
                  onChange={(e) => setManualNoteDraft(e.target.value)}
                  placeholder="Instruksi bayar (mis. A.n Toko Nusantara)"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ANTREAN PERSETUJUAN INSTAN BUKTI TRANSFER QR MANUAL */}
        <div className="rounded-2xl border border-amber-500/40 bg-slate-950/90 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-black text-amber-300">
              Antrean Bukti Transfer QRIS Manual ({manualQrisSubmissions.filter((s) => s.status === 'menunggu').length} Menunggu)
            </h4>
          </div>
          {manualQrisSubmissions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-800 py-4 text-center text-slate-500">
              Belum ada kiriman bukti transfer QRIS manual dari nasabah.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {manualQrisSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {sub.proofImageDataUrl && (
                      <button
                        type="button"
                        onClick={() => setProofLightboxUrl(sub.proofImageDataUrl)}
                        className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-black cursor-pointer"
                        title="Klik untuk perbesar bukti transfer"
                      >
                        <img src={sub.proofImageDataUrl} alt="Bukti Transfer" className="h-full w-full object-cover" />
                      </button>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white">{sub.accountName}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {sub.userId16 ? `ID ${sub.userId16}` : sub.accountNumber}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${
                            sub.status === 'disetujui'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : sub.status === 'ditolak'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-cyan-300">
                        +{(sub.diamondAmount || 0).toLocaleString('id-ID')} Diamond • {formatRupiah(sub.totalAmount)}
                      </p>
                      {sub.note && <p className="text-[10px] text-slate-400 truncate">Catatan: {sub.note}</p>}
                    </div>
                  </div>
                  {sub.status === 'menunggu' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminReviewManualQrisSubmission(sub.id, 'disetujui');
                          showMsg(res.message);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-1.5 font-black text-slate-950 cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Setujui Instan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminReviewManualQrisSubmission(sub.id, 'ditolak', 'Bukti transfer tidak valid.');
                          showMsg(res.message);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 px-3 py-1.5 font-bold text-rose-300 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOG PESANAN REDIRECT BUATQRIS.SITE + SETUJUI MANUAL ADMIN */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-sky-300 text-xs">
              Log Pesanan Redirect buatqris.site ({qrisOrders.length} Transaksi)
            </h4>
            <span className="text-[10px] text-slate-400">
              Otomatis lunas via Webhook atau klik Setujui Manual
            </span>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {qrisOrders.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-800 py-6 text-center text-slate-500">
                Belum ada transaksi redirect buatqris.site yang dibuat nasabah.
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
                            : ord.status === 'EXPIRED' || ord.status === 'DITOLAK'
                              ? 'bg-rose-500/20 text-rose-300'
                              : ord.status === 'MENUNGGU_ADMIN'
                                ? 'bg-sky-500/20 text-sky-300'
                                : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-slate-400">
                      {ord.orderId} · Redirect buatqris.site ({ord.paymentUrlSource === 'api' ? 'API Link' : 'Merchant Link'}) · {new Date(ord.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {(ord.status === 'PENDING' || ord.status === 'MENUNGGU_ADMIN') && (
                      <button
                        type="button"
                        disabled={simulatingOrderId === ord.orderId}
                        onClick={async () => {
                          setSimulatingOrderId(ord.orderId);
                          try {
                            const res = await adminSimulateQrisOrder(ord.orderId);
                            showMsg(res.message);
                          } finally {
                            setSimulatingOrderId(null);
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 px-2.5 py-1 text-[10px] font-black text-emerald-200 cursor-pointer whitespace-nowrap"
                        title="Setujui Manual & Cairkan Diamond Instan ke Nasabah"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{simulatingOrderId === ord.orderId ? 'Memproses...' : 'Setujui Manual'}</span>
                      </button>
                    )}
                    <span className="font-mono font-black text-sky-300 tabular-nums">
                      {formatRupiah(ord.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {proofLightboxUrl && (
          <div
            onClick={() => setProofLightboxUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          >
            <div className="relative max-w-lg rounded-2xl bg-slate-900 p-3 border border-slate-700">
              <button
                type="button"
                onClick={() => setProofLightboxUrl(null)}
                className="absolute right-2 top-2 rounded-lg bg-slate-800 p-1.5 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={proofLightboxUrl} alt="Bukti Transfer Zoom" className="max-h-[75vh] rounded-xl object-contain" />
            </div>
          </div>
        )}
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

          <div className="flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              onClick={() => {
                const res = adminUpdateFamilyConfig({
                  defaultMaxFamilies: parseDraftNum(familyDraft.defaultMaxFamilies, 1, 100),
                  baseSlotMoneyCost: parseDraftNum(familyDraft.baseSlotMoneyCost, 0, 1_000_000_000_000),
                  baseSlotDiamondCost: parseDraftNum(familyDraft.baseSlotDiamondCost, 0, 1_000_000),
                  maxMembersPerFamily: parseDraftNum(familyDraft.maxMembersPerFamily, 2, 500),
                });
                isFamilyDirtyRef.current = false;
                showMsg(res.message);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-400 hover:bg-indigo-300 px-3.5 py-2 font-black text-slate-950 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Simpan Pengaturan Keluarga</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 block">
              Slot Default Buat Keluarga
            </label>
            <input
              type="number"
              min={1}
              value={familyDraft.defaultMaxFamilies}
              onChange={(e) => {
                isFamilyDirtyRef.current = true;
                setFamilyDraft((prev) => ({ ...prev, defaultMaxFamilies: e.target.value }));
              }}
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
              value={familyDraft.baseSlotMoneyCost}
              onChange={(e) => {
                isFamilyDirtyRef.current = true;
                setFamilyDraft((prev) => ({ ...prev, baseSlotMoneyCost: e.target.value }));
              }}
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
              value={familyDraft.baseSlotDiamondCost}
              onChange={(e) => {
                isFamilyDirtyRef.current = true;
                setFamilyDraft((prev) => ({ ...prev, baseSlotDiamondCost: e.target.value }));
              }}
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
              value={familyDraft.maxMembersPerFamily}
              onChange={(e) => {
                isFamilyDirtyRef.current = true;
                setFamilyDraft((prev) => ({ ...prev, maxMembersPerFamily: e.target.value }));
              }}
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
