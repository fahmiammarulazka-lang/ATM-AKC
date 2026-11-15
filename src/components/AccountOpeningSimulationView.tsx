/**
 * Bank Nusantara — Simulasi Interaktif Pembukaan Rekening (5 Langkah Sesuai Bab 2)
 * Mendukung pengisian formulir, pembuatan PIN aman 6 digit, bebas pilih semua jenis kartu nasabah
 * (Reguler, Emas, Premium, Platinum), pengiriman ke antrean Admin nyata, serta pelacak status
 * (Menunggu Persetujuan, Disetujui, Ditolak) dengan tombol uji keputusan Admin.
 */
import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileCheck2,
  UserCheck,
  Lock,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CARD_TIER_CONFIGS, formatRupiah, validateStrongPin } from '../utils/bankUtils';
import { CardTier } from '../types/bank';
import { GoogleMapsAddressPicker } from './GoogleMapsAddressPicker';

interface AccountOpeningSimulationViewProps {
  onNavigateToDashboard: () => void;
  onOpenRegisterModal: () => void;
}

const CUSTOMER_SELECTABLE_TIERS: CardTier[] = ['regular', 'gold', 'premium', 'platinum'];

export const AccountOpeningSimulationView: React.FC<AccountOpeningSimulationViewProps> = ({
  onNavigateToDashboard,
  onOpenRegisterModal,
}) => {
  const { accounts, registerCard, adminApproveCard, adminRejectCard } = useBank();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [fullName, setFullName] = useState<string>('');
  const [nik, setNik] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [initialDeposit, setInitialDeposit] = useState<number>(500_000);

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);

  const [selectedTier, setSelectedTier] = useState<CardTier>('regular');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submittedAccountId, setSubmittedAccountId] = useState<string | null>(null);
  const [testRejectReason, setTestRejectReason] = useState<string>(
    'Foto KTP kurang jelas atau nomor NIK belum sesuai data dukcapil.'
  );

  const trackedAccount = submittedAccountId
    ? accounts.find((a) => a.id === submittedAccountId) || null
    : null;

  const activeTierConfig = CARD_TIER_CONFIGS[selectedTier] || CARD_TIER_CONFIGS.regular;

  const pinStrengthCheck = validateStrongPin(pin);
  const pinMatchCheck = pin.length === 6 && pin === confirmPin;

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMsg('Nama lengkap wajib diisi minimal 3 karakter sesuai KTP.');
      return;
    }
    if (!/^\d{16}$/.test(nik.trim())) {
      setErrorMsg('Nomor Identitas KTP (NIK) wajib tepat 16 digit angka.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Nomor HP aktif wajib diisi minimal 10 digit.');
      return;
    }
    if (!address.trim()) {
      setErrorMsg('Alamat domisili lengkap wajib diisi.');
      return;
    }
    if (initialDeposit < 100_000) {
      setErrorMsg('Saldo setoran awal minimal Rp 100.000.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateStrongPin(pin);
    if (!check.valid) {
      setErrorMsg(check.reason || 'Kode PIN 6 digit tidak valid.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('Konfirmasi 6 digit PIN tidak sama!');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleStep4Submit = () => {
    setErrorMsg('');
    const res = registerCard({
      fullName: fullName.trim(),
      nik: nik.trim(),
      phone: phone.trim(),
      email: email.trim() || `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@banknusantara.id`,
      address: address.trim(),
      pin,
      cardTier: selectedTier,
      initialDeposit,
    });

    if (res.success && res.accountId) {
      setSubmittedAccountId(res.accountId);
      setStep(5);
    } else {
      setErrorMsg(res.message || 'Gagal mengirim permohonan.');
    }
  };

  const handleResetSimulation = () => {
    setStep(1);
    setFullName('');
    setNik('');
    setPhone('');
    setEmail('');
    setAddress('');
    setInitialDeposit(500_000);
    setPin('');
    setConfirmPin('');
    setSelectedTier('regular');
    setErrorMsg('');
    setSubmittedAccountId(null);
  };

  const handleReapplyRejected = () => {
    setErrorMsg('');
    setSubmittedAccountId(null);
    setStep(1);
  };

  const recentSubmissions = accounts.filter((a) => a.cardTier !== 'admin').slice(0, 5);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>SIMULASI INTERAKTIF BAB 2</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
              Terhubung ke Antrean Admin Nyata
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Simulasi Pembukaan Rekening &amp; Penerbitan Kartu ATM
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Uji seluruh 5 tahapan pembukaan rekening Bank Nusantara secara interaktif: isi formulir data diri, buat PIN aman 6 digit, bebas pilih seluruh jenis kartu (Reguler, Emas, Premium, Platinum), kirim ke antrean verifikasi Admin, lalu pantau status <strong>Menunggu Persetujuan</strong>, <strong>Disetujui</strong>, atau <strong>Ditolak</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            Buka Modal Pendaftaran Cepat
          </button>
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
          >
            Ke Mobile Banking
          </button>
        </div>
      </div>

      {/* 5-Step Progress Indicator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {[
            { num: 1, title: '1. Isi Formulir', sub: 'Identitas & Alamat' },
            { num: 2, title: '2. Buat PIN', sub: '6 Digit Anti-Lemah' },
            { num: 3, title: '3. Pilih Kartu', sub: 'Reguler s/d Platinum' },
            { num: 4, title: '4. Kirim Admin', sub: 'Tinjauan Enkripsi' },
            { num: 5, title: '5. Status', sub: 'Proses / ACC / Tolak' },
          ].map((s) => {
            const isActive = step === s.num;
            const isDone = step > s.num;
            return (
              <div
                key={s.num}
                className={`p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg'
                    : isDone
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <div className="text-xs font-extrabold truncate">{s.title}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-slate-900' : 'opacity-75'}`}>
                  {s.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-2xl text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Active Wizard Card */}
        <div className="lg:col-span-8 bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
                  Langkah 1 dari 5 — Formulir Pendaftaran Nasabah
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Lengkapi Identitas Resmi &amp; Setoran Awal
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nama Lengkap (Sesuai KTP):
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Pratama Putra Wijaya"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Email Nasabah (Opsional):
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pratama@banknusantara.id"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">NIK / KTP (16 Digit):</label>
                    <span className="text-[10px] font-mono text-amber-400 tabular-nums">
                      {nik.replace(/\D/g, '').length}/16 digit
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="3171041508920003"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nomor HP Aktif:</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <GoogleMapsAddressPicker
                value={address}
                onChange={(newAddr) => setAddress(newAddr)}
                required={true}
                label="Alamat Tempat Tinggal Lengkap:"
                placeholder="Pilih titik lokasi di Peta Google Maps atau isi alamat lengkap..."
              />

              <div className="space-y-2">
                <label className="text-slate-300 font-semibold block">
                  Saldo Setoran Awal (Min. Rp 100.000):
                </label>
                <input
                  type="number"
                  min={100_000}
                  step={50_000}
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
                <div className="flex flex-wrap gap-2">
                  {[250_000, 500_000, 1_000_000, 5_000_000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setInitialDeposit(amt)}
                      className={`px-3 py-1 rounded-lg font-mono text-[11px] font-bold border cursor-pointer whitespace-nowrap ${
                        initialDeposit === amt
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Langkah 2: Buat PIN Rahasia 6 Digit</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-5 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
                  Langkah 2 dari 5 — Keamanan Kode PIN 6 Digit
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Buat Kode PIN Kartu ATM Anda
                </h2>
                <p className="text-slate-400 mt-1">
                  Sesuai prosedur keamanan Bab 2, hindari kombinasi berurutan (123456), angka berulang (111111), atau pola sederhana.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Masukkan 6 Digit PIN:</label>
                    <button
                      type="button"
                      onClick={() => setShowPin((v) => !v)}
                      className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPin ? 'Sembunyikan' : 'Tampilkan'}</span>
                    </button>
                  </div>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Konfirmasi Ulang 6 Digit PIN:
                  </label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Live Security Criteria */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white text-[11px] mb-1">Pemeriksaan Kekuatan PIN:</div>
                  <div className={pin.length === 6 ? 'text-emerald-400' : 'text-slate-400'}>
                    {pin.length === 6 ? '✓' : '○'} Tepat 6 digit angka ({pin.length}/6)
                  </div>
                  <div
                    className={
                      pin.length === 6 && pinStrengthCheck.valid
                        ? 'text-emerald-400'
                        : pin.length === 6
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }
                  >
                    {pin.length === 6 && pinStrengthCheck.valid
                      ? '✓ Tidak menggunakan pola lemah / berurutan'
                      : pin.length === 6
                      ? `✕ ${pinStrengthCheck.reason}`
                      : '○ Tidak boleh angka berurutan (123456) atau berulang (111111)'}
                  </div>
                  <div className={pinMatchCheck ? 'text-emerald-400' : 'text-slate-400'}>
                    {pinMatchCheck ? '✓' : '○'} Konfirmasi PIN cocok
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lanjut ke Langkah 3: Pilih Jenis Kartu</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
                  Langkah 3 dari 5 — Pemilihan Jenis Kartu Bebas
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Pilih Jenis Kartu Bank Nusantara Anda
                </h2>
                <p className="text-slate-400 mt-1">
                  Pilih kasta kartu yang sesuai kebutuhan transaksi harian Anda: <strong>Reguler</strong>, <strong>Emas</strong>, <strong>Premium</strong>, atau <strong>Platinum</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {CUSTOMER_SELECTABLE_TIERS.map((tierKey) => {
                  const cfg = CARD_TIER_CONFIGS[tierKey];
                  const isSelected = selectedTier === tierKey;
                  return (
                    <button
                      key={tierKey}
                      type="button"
                      onClick={() => setSelectedTier(tierKey)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30 shadow-lg'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-black text-white text-sm">{cfg.nameIndo}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${cfg.badgeColor}`}>
                          {cfg.colorName}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Limit Tarik/Hari</span>
                          <strong className="text-amber-300 font-mono tabular-nums">
                            {formatRupiah(cfg.dailyWithdrawalLimit)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Biaya Bulanan</span>
                          <strong className="text-white font-mono tabular-nums">
                            {formatRupiah(cfg.monthlyFee)}
                          </strong>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-300 font-semibold">{cfg.idealFor}</span>
                        <span className="text-slate-400 font-mono">{cfg.validityYears} Tahun</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lanjut ke Langkah 4: Konfirmasi &amp; Kirim</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-amber-400 font-mono font-bold uppercase tracking-wider text-[11px]">
                  Langkah 4 dari 5 — Review &amp; Kirim ke Antrean Admin
                </span>
                <h2 className="text-lg font-black text-white mt-0.5">
                  Konfirmasi Data Pendaftaran Anda
                </h2>
                <p className="text-slate-400 mt-1">
                  Setelah dikirim, permohonan masuk ke antrean Admin Bank Nusantara dengan status <strong>Menunggu Persetujuan</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Nama Lengkap:</span>
                  <span className="font-bold text-white text-right">{fullName}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">NIK (16 Digit):</span>
                  <span className="font-mono text-white">{nik}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Nomor HP Aktif:</span>
                  <span className="font-mono text-white">{phone}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 shrink-0">Alamat Lengkap:</span>
                  <span className="text-slate-200 text-right max-w-md">{address}</span>
                </div>
                <div className="flex justify-between gap-2 border-t border-slate-800 pt-2">
                  <span className="text-slate-400">Jenis Kartu Dipilih:</span>
                  <span className="font-black text-amber-300">{activeTierConfig.nameIndo}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Setoran Awal:</span>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(initialDeposit)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">PIN Rahasia:</span>
                  <span className="font-mono text-slate-300">•••••• (Terenkripsi)</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Nomor Rekening 10-Digit:</span>
                  <span className="text-cyan-300 font-semibold text-right">
                    Diacak otomatis oleh Core Banking saat Disetujui Admin
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali</span>
                </button>
                <button
                  type="button"
                  onClick={handleStep4Submit}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Kirim Permohonan ke Antrean Admin</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-5 text-xs">
              {(!trackedAccount || trackedAccount.cardStatus === 'pending') && (
                <>
                  <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/50 text-center space-y-2.5">
                    <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-300 flex items-center justify-center mx-auto animate-pulse">
                      <Clock className="w-7 h-7" />
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                      Status Permohonan
                    </div>
                    <h2 className="text-xl font-black text-white">
                      Menunggu Persetujuan Admin
                    </h2>
                    <p className="text-slate-300 max-w-lg mx-auto leading-relaxed">
                      Permohonan pembukaan rekening <strong>{trackedAccount?.fullName || fullName}</strong> ({activeTierConfig.nameIndo}) telah masuk ke antrean verifikasi Admin Bank Nusantara. Selama berstatus menunggu, kartu belum dapat dipakai bertransaksi.
                    </p>
                  </div>

                  {/* Integrated Admin Test Controls */}
                  {trackedAccount && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <span className="font-black text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Simulasi Keputusan Antrean Admin</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          Terhubung ke Antrean Nyata
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Anda dapat menunggu persetujuan dari Admin Bank Nusantara, atau langsung menguji kedua hasil keputusan (<strong>Disetujui</strong> / <strong>Ditolak</strong>) melalui tombol simulasi di bawah ini:
                      </p>

                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                          Alasan Penolakan (Jika Menguji Status Ditolak):
                        </label>
                        <input
                          type="text"
                          value={testRejectReason}
                          onChange={(e) => setTestRejectReason(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-slate-200 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => adminApproveCard(trackedAccount.id)}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Simulasikan Setujui Admin</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            adminRejectCard(
                              trackedAccount.id,
                              testRejectReason.trim() || 'Dokumen identitas perlu dilengkapi ulang.'
                            )
                          }
                          className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Simulasikan Tolak Admin</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {trackedAccount && trackedAccount.cardStatus === 'active' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-emerald-950/35 border border-emerald-500/50 text-center space-y-2.5">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-bold">
                      Status Permohonan
                    </div>
                    <h2 className="text-xl font-black text-white">Disetujui Admin — Rekening Aktif!</h2>
                    <p className="text-slate-300 max-w-lg mx-auto leading-relaxed">
                      Sistem Core Banking telah mengacak <strong>10 digit nomor rekening unik</strong>, mengaktifkan kartu ATM debit Anda, dan memasukkan setoran awal ke saldo aktif.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nomor Rekening 10 Digit</span>
                      <span className="font-mono font-black text-base text-amber-300 tabular-nums">
                        {trackedAccount.accountNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Saldo Awal Aktif</span>
                      <span className="font-mono font-black text-base text-emerald-400 tabular-nums">
                        {formatRupiah(trackedAccount.balance)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nomor Kartu 16 Digit</span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        {trackedAccount.cardNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Berlaku Hingga &amp; CVV</span>
                      <span className="font-mono font-bold text-cyan-300 tabular-nums">
                        {trackedAccount.expiryDate} • CVV {trackedAccount.cvv}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {trackedAccount && trackedAccount.cardStatus === 'rejected' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-rose-950/35 border border-rose-500/50 text-center space-y-2.5">
                    <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-400 text-rose-300 flex items-center justify-center mx-auto">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <div className="text-[11px] font-mono uppercase tracking-widest text-rose-300 font-bold">
                      Status Permohonan
                    </div>
                    <h2 className="text-xl font-black text-white">Permohonan Ditolak Admin</h2>
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/30 text-rose-200 max-w-lg mx-auto text-left">
                      <strong className="block text-[10px] uppercase text-rose-400 mb-0.5">
                        Alasan Resmi Penolakan:
                      </strong>
                      <span>
                        {trackedAccount.rejectionReason || 'Data pendaftaran belum memenuhi persyaratan.'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReapplyRejected}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Perbaiki Data Formulir &amp; Ajukan Ulang</span>
                  </button>
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
                >
                  Lihat di Mobile Banking
                </button>
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Simulasi Pendaftaran Baru</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Live 3D Card Preview & Queue Monitor */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Interactive Card Preview */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Pratinjau Kartu Live</span>
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTierConfig.badgeColor}`}>
                {activeTierConfig.name}
              </span>
            </div>

            <div
              className={`rounded-2xl p-5 bg-gradient-to-br ${activeTierConfig.gradientClass} text-white shadow-2xl space-y-5 relative overflow-hidden`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-xs tracking-widest">BANK NUSANTARA</span>
                <span className="text-[10px] font-mono uppercase opacity-80">
                  {trackedAccount?.cardStatus === 'active'
                    ? 'AKTIF'
                    : trackedAccount?.cardStatus === 'rejected'
                    ? 'DITOLAK'
                    : 'SIMULASI'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-7 rounded-md bg-gradient-to-br from-amber-200 to-yellow-500 border border-amber-100/50" />
                <span className="text-[10px] font-mono opacity-80">EMV CHIP • PIN 6-DIGIT</span>
              </div>

              <div className="font-mono text-sm sm:text-base font-bold tracking-widest tabular-nums">
                {trackedAccount?.cardStatus === 'active'
                  ? trackedAccount.cardNumber
                  : '5392 •••• •••• ••••'}
              </div>

              <div className="flex items-end justify-between text-[11px]">
                <div>
                  <span className="text-[9px] uppercase opacity-70 block">Pemilik Kartu</span>
                  <span className="font-bold uppercase tracking-wide truncate max-w-[160px] block">
                    {trackedAccount?.fullName || fullName || 'NAMA CALON NASABAH'}
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] uppercase opacity-70 block">Berlaku</span>
                  <span>{trackedAccount?.expiryDate || 'MM/YY'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Limit Tarik Harian:</span>
                <strong className="text-amber-300 font-mono">
                  {formatRupiah(activeTierConfig.dailyWithdrawalLimit)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Biaya Admin/Bulan:</span>
                <strong className="text-white font-mono">{formatRupiah(activeTierConfig.monthlyFee)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Setoran Awal:</span>
                <strong className="text-emerald-400 font-mono">{formatRupiah(initialDeposit)}</strong>
              </div>
            </div>
          </div>

          {/* Live Application Queue Status List */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Lacak Permohonan Kartu</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {recentSubmissions.length} Akun
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
              {recentSubmissions.map((acc) => {
                const statusBadge =
                  acc.cardStatus === 'active'
                    ? { label: 'Disetujui', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' }
                    : acc.cardStatus === 'rejected'
                    ? { label: 'Ditolak', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
                    : { label: 'Menunggu', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setSubmittedAccountId(acc.id);
                      setSelectedTier(acc.cardTier);
                      setStep(5);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                      submittedAccountId === acc.id
                        ? 'bg-blue-950/60 border-blue-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{acc.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {CARD_TIER_CONFIGS[acc.cardTier]?.name} • {acc.accountNumber}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0 ${statusBadge.cls}`}>
                      {statusBadge.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
