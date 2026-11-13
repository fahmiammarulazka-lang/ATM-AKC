/**
 * Bank Nusantara Card Registration Modal & Status Tracker
 * Implements Section 2: Cara Membuat Kartu & Persetujuan Admin
 * Steps 1 to 5 + Status: Menunggu Persetujuan, Disetujui, Ditolak
 */
import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CARD_TIER_CONFIGS, formatRupiah } from '../utils/bankUtils';
import { CardTier } from '../types/bank';
import { GoogleMapsAddressPicker } from './GoogleMapsAddressPicker';

interface CardRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CardRegistrationModal: React.FC<CardRegistrationModalProps> = ({ isOpen, onClose }) => {
  const { registerCard, accounts, currentAccount } = useBank();

  // Step wizard: 1 (Data Diri), 2 (Buat PIN), 3 (Pilih Jenis Kartu), 4 (Konfirmasi & Kirim), 5 (Status Permohonan)
  const [step, setStep] = useState<number>(1);
  const [fullName, setFullName] = useState<string>('');
  const [nik, setNik] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [initialDeposit, setInitialDeposit] = useState<number>(500_000);
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<CardTier>('regular');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submittedAccountId, setSubmittedAccountId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Check if current user is in pending or rejected state
  const pendingOrRejectedAccount = accounts.find(
    (a) => a.id === submittedAccountId || (currentAccount && (currentAccount.cardStatus === 'pending' || currentAccount.cardStatus === 'rejected'))
  );

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nik || !phone || !address) {
      setErrorMsg('Harap lengkapi seluruh formulir identitas.');
      return;
    }
    if (nik.length < 16) {
      setErrorMsg('Nomor Identitas KTP (NIK) harus terdiri dari 16 digit.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setErrorMsg('Kode PIN harus terdiri dari tepat 6 digit angka rahasia.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg('Konfirmasi kode PIN tidak cocok!');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleStep3Submit = () => {
    // Sesuai permintaan pengguna: pembuatan kartu baru wajib Kartu Biasa (Reguler)
    setSelectedTier('regular');
    setStep(4);
  };

  const handleFinalSubmit = () => {
    const res = registerCard({
      fullName,
      nik,
      phone,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      address,
      pin,
      cardTier: 'regular', // Bikin kartu yang biasa (Reguler Biru)
      initialDeposit,
    });

    if (res.success && res.accountId) {
      setSubmittedAccountId(res.accountId);
      setStep(5);
    }
  };

  const resetForm = () => {
    setFullName('');
    setNik('');
    setPhone('');
    setEmail('');
    setAddress('');
    setPin('');
    setConfirmPin('');
    setSelectedTier('regular');
    setStep(1);
    setSubmittedAccountId(null);
  };

  const activeTierConfig = CARD_TIER_CONFIGS[selectedTier];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Pendaftaran Kartu ATM Bank Nusantara</h3>
              <p className="text-xs text-slate-400">Formulir Pembukaan Rekening & Penerbitan Kartu Baru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold">
          {[
            { num: 1, label: '1. Isi Formulir' },
            { num: 2, label: '2. Buat PIN' },
            { num: 3, label: '3. Jenis Kartu' },
            { num: 4, label: '4. Kirim & Status' },
          ].map((s) => (
            <div
              key={s.num}
              className={`py-1.5 rounded-lg transition-all ${
                step >= s.num ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: ISI FORMULIR PENDAFTARAN ================= */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4 text-xs">
            <div>
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-[11px] mb-1">
                Langkah 1 — Formulir Data Identitas
              </span>
              <p className="text-slate-400 text-xs">
                Isi formulir pendaftaran dengan nama lengkap, nomor identitas (KTP), alamat, dan setoran awal.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nama Lengkap (Sesuai KTP):</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Raden Satrio Wibowo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nomor Identitas KTP (16 Digit):
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="3171041508920003"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nomor Handphone Aktif:</label>
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
                label="Alamat Tempat Tinggal Lengkap (Ambil Langsung dari Google Maps):"
                placeholder="Klik titik lokasi di Peta Google Maps di atas atau klik Ambil Lokasi GPS Saya Otomatis..."
              />

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Saldo Setoran Awal (Rp):</label>
                <input
                  type="number"
                  min={100_000}
                  step={50_000}
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Saldo awal akan langsung masuk ke rekening begitu pendaftaran selesai diproses.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Lanjut ke Langkah 2: Buat Kode PIN ➔</span>
            </button>
          </form>
        )}

        {/* ================= STEP 2: BUAT KODE PIN RAHASIA ================= */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4 text-xs">
            <div>
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-[11px] mb-1">
                Langkah 2 — Buat Kode PIN Rahasia
              </span>
              <p className="text-slate-400 text-xs">
                Buat kode PIN rahasia Anda sendiri (6 digit angka). Jangan gunakan angka tanggal lahir yang mudah ditebak.
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto py-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1 text-center">
                  Ketik 6 Digit PIN Rahasia:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1 text-center">
                  Ketik Ulang PIN (Konfirmasi):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-amber-300 font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Lanjut ke Langkah 3: Tentukan Jenis Kartu ➔
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: TENTUKAN JENIS KARTU ================= */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-[11px] mb-1">
                Langkah 3 — Tentukan Jenis Kartu yang Diinginkan
              </span>
              <p className="text-slate-300 text-xs font-medium">
                Penerbitan kartu baru dimulai dari <strong className="text-blue-400">Kartu Biasa (Reguler Biru)</strong>. Untuk beralih ke kartu tingkat di atasnya, permohonan dapat diajukan dan akan diproses oleh sistem bank.
              </p>
            </div>

            {/* Notice Banner */}
            <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex items-start gap-2.5 text-blue-200">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] space-y-1">
                <span className="font-bold text-white block">Ketentuan Pembuatan Kartu Bank Nusantara (5 Jenis Kartu):</span>
                <p className="text-slate-300">
                  Kartu perdana yang otomatis diterbitkan adalah <strong>Kartu Biasa (Reguler Biru)</strong>. Fitur Upgrade Kartu ke <strong>Kartu Emas</strong>, <strong>Kartu Premium</strong>, <strong>Kartu Platinum</strong>, atau <strong>Kartu Admin (∞)</strong> dapat diajukan melalui menu Layanan Kartu.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
              {Object.values(CARD_TIER_CONFIGS).map((tier) => {
                const isRegular = tier.tier === 'regular';
                return (
                  <div
                    key={tier.tier}
                    onClick={() => {
                      if (isRegular) setSelectedTier('regular');
                    }}
                    className={`p-4 rounded-2xl border transition-all ${
                      isRegular
                        ? 'border-blue-400 bg-blue-500/10 shadow-lg scale-[1.02] ring-2 ring-blue-500/30'
                        : 'border-slate-800 bg-slate-950/40 opacity-75 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{tier.nameIndo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${tier.badgeColor}`}>
                        {tier.colorName}
                      </span>
                    </div>

                    {isRegular ? (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold block mb-2 text-center">
                        ✓ Kartu Standar Perdana
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold block mb-2 text-center">
                        ⏳ Melalui Proses Upgrade
                      </span>
                    )}

                    <div className="space-y-1.5 text-slate-300 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Batas Tarik Harian:</span>
                        <strong className="text-amber-300 font-mono">
                          {formatRupiah(tier.dailyWithdrawalLimit)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Biaya Bulanan:</span>
                        <strong className="text-white font-mono">{formatRupiah(tier.monthlyFee)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Cocok Untuk:</span>
                        <span className="text-emerald-300 font-semibold">{tier.idealFor}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleStep3Submit}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Lanjut ke Langkah 4: Kirimkan Permohonan ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 4: KONFIRMASI & KIRIM KE ADMIN ================= */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-[11px] mb-1">
                Langkah 4 — Kirimkan Permohonan Pendaftaran ke Bank
              </span>
              <p className="text-slate-400 text-xs">
                Periksa seluruh data Anda. Setelah dikirim, Admin Bank Nusantara akan memeriksa dan memverifikasi data Anda.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nama Pemohon:</span>
                <span className="font-bold text-white">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">NIK KTP:</span>
                <span className="font-mono text-white">{nik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Telepon:</span>
                <span className="font-mono text-white">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pilihan Kartu:</span>
                <span className="font-bold text-amber-300">{activeTierConfig.nameIndo} ({activeTierConfig.colorName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Setoran Awal:</span>
                <span className="font-mono font-bold text-emerald-400">{formatRupiah(initialDeposit)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Sistem Nomor Rekening:</span>
                <span className="text-blue-300 font-semibold">Diacak Otomatis oleh Sistem setelah Disetujui</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                Kirim Permohonan Sekarang ➔
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 5: STATUS PERMOHONAN KARTU (Bab 2) ================= */}
        {step === 5 && (
          <div className="space-y-4 text-center py-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Langkah 5 — Permohonan Sedang Diproses</h3>
              <p className="text-xs text-amber-300 font-semibold mt-1">Status: ⏳ Sedang Diproses</p>
              <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                Permohonan pendaftaran kartu Anda sudah diterima dan sedang diproses oleh sistem Bank Nusantara.
              </p>
            </div>

            <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl text-left text-xs text-blue-200 max-w-md mx-auto">
              <span className="font-bold text-amber-300 block mb-1">Informasi Proses Penerbitan Kartu:</span>
              <p>
                Begitu proses verifikasi kartu selesai:
              </p>
              <ul className="list-disc list-inside mt-1 text-[11px] space-y-0.5">
                <li>Kartu akan langsung aktif dan siap digunakan di mesin ATM</li>
                <li>Nomor rekening 10 digit akan dibuatkan secara otomatis dan diacak oleh sistem</li>
                <li>Saldo setoran awal Rp {initialDeposit.toLocaleString('id-ID')} langsung masuk ke rekening</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Lihat di Dashboard
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-3 bg-slate-800 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Daftar Akun Lain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
