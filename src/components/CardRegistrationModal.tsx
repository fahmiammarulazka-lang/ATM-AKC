/**
 * Bank Nusantara Card Registration Modal & Status Tracker
 * Implements Section 2: Cara Membuat Kartu & Persetujuan Admin
 * Steps 1 to 5 + Status: Menunggu Persetujuan, Disetujui, Ditolak
 */
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CARD_TIER_CONFIGS, formatRupiah, validateStrongPin } from '../utils/bankUtils';
import { CardTier, StructuredIndonesiaAddress } from '../types/bank';
import { IndonesiaAddressPicker } from './IndonesiaAddressPicker';
import {
  createEmptyStructuredAddress,
  validateStructuredAddress,
} from '../data/indonesiaRegionsOffline';

interface CardRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SELECTABLE_TIERS: CardTier[] = ['regular', 'gold', 'premium', 'platinum'];

export const CardRegistrationModal: React.FC<CardRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { registerCard, accounts, enterLobbyCreatedAccountSession } = useBank();

  // Step wizard: 1 (Data Diri), 2 (Buat PIN), 3 (Pilih Jenis Kartu), 4 (Konfirmasi & Kirim), 5 (Status Permohonan)
  const [step, setStep] = useState<number>(1);
  const [fullName, setFullName] = useState<string>('');
  const [nik, setNik] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [structuredAddress, setStructuredAddress] = useState<StructuredIndonesiaAddress>(() =>
    createEmptyStructuredAddress()
  );
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<CardTier>('regular');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [submittedAccountId, setSubmittedAccountId] = useState<string | null>(null);

  const trackedAccount = submittedAccountId
    ? accounts.find((a) => a.id === submittedAccountId) || null
    : null;

  // Otomatis masuk ke Dashboard di HP nasabah begitu Admin klik "Setujui Kartu"
  useEffect(() => {
    if (isOpen && step === 5 && trackedAccount && trackedAccount.cardStatus === 'active') {
      enterLobbyCreatedAccountSession(trackedAccount.id);
      const timer = window.setTimeout(() => {
        onClose();
      }, 650);
      return () => window.clearTimeout(timer);
    }
  }, [
    isOpen,
    step,
    trackedAccount,
    trackedAccount?.id,
    trackedAccount?.cardStatus,
    enterLobbyCreatedAccountSession,
    onClose,
  ]);

  if (!isOpen) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !nik || !phone) {
      setErrorMsg('Harap lengkapi nama lengkap, NIK 16 digit, dan nomor HP.');
      return;
    }
    if (!/^\d{16}$/.test(nik.trim())) {
      setErrorMsg('Nomor Identitas KTP (NIK) harus terdiri dari tepat 16 digit angka.');
      return;
    }
    const addrCheck = validateStructuredAddress(structuredAddress);
    if (!addrCheck.valid && !address.trim()) {
      setErrorMsg(addrCheck.message || 'Harap lengkapi pilihan alamat wilayah Indonesia hingga RT/RW.');
      return;
    }
    if (structuredAddress.provinceName && !addrCheck.valid) {
      setErrorMsg(addrCheck.message || 'Harap lengkapi pilihan alamat wilayah Indonesia hingga RT/RW.');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateStrongPin(pin);
    if (!check.valid) {
      setErrorMsg(check.reason || 'Kode PIN harus terdiri dari tepat 6 digit angka rahasia.');
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
    setStep(4);
  };

  const handleFinalSubmit = () => {
    const res = registerCard({
      fullName,
      nik,
      phone,
      email: email || `${fullName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      address,
      structuredAddress: structuredAddress.provinceName ? structuredAddress : undefined,
      pin,
      cardTier: selectedTier,
      initialDeposit: 0,
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
    setStructuredAddress(createEmptyStructuredAddress());
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
                Isi formulir pendaftaran dengan nama lengkap, nomor identitas (KTP), nomor HP, dan alamat domisili. Saldo awal otomatis Rp 0.
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

              <IndonesiaAddressPicker
                value={structuredAddress}
                formattedAddress={address}
                onChange={(formatted, struct) => {
                  setAddress(formatted);
                  setStructuredAddress(struct);
                }}
                enableGoogleMapsTab={true}
                label="Alamat Tempat Tinggal Resmi (Provinsi → Desa → Kode Pos → RT/RW)"
              />

              <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Saldo Awal Rekening:</span>
                  <span className="font-mono font-black text-emerald-400">Rp 0 (Otomatis)</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Saldo tidak dapat diketik sendiri saat pendaftaran. Setelah kartu disetujui Admin &amp; aktif, Anda bisa mendapatkan uang melalui Kerja/Gajian, Transfer masuk, atau Pemberian Admin.
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

        {/* ================= STEP 3: PILIH JENIS KARTU (SEMUA TIER NASABAH) ================= */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-amber-400 font-bold uppercase tracking-wider block text-[11px] mb-1">
                Langkah 3 — Pilih Jenis Kartu yang Diinginkan
              </span>
              <p className="text-slate-300 text-xs font-medium">
                Pilih langsung jenis kartu Bank Nusantara sesuai kebutuhan Anda: <strong>Reguler</strong>, <strong>Emas</strong>, <strong>Premium</strong>, atau <strong>Platinum</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {SELECTABLE_TIERS.map((tierKey) => {
                const tier = CARD_TIER_CONFIGS[tierKey];
                const isSelected = selectedTier === tierKey;
                return (
                  <button
                    key={tier.tier}
                    type="button"
                    onClick={() => setSelectedTier(tier.tier)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 shadow-lg ring-2 ring-amber-400/30'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{tier.nameIndo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${tier.badgeColor}`}>
                        {tier.colorName}
                      </span>
                    </div>

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
                  </button>
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
                <span className="text-slate-400">Saldo Awal Pembukaan:</span>
                <span className="font-mono font-bold text-emerald-400">Rp 0 (Otomatis)</span>
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

        {/* ================= STEP 5: STATUS PERMOHONAN KARTU LIVE (Bab 2) ================= */}
        {step === 5 && (
          <div className="space-y-4 text-center py-3">
            {(!trackedAccount || trackedAccount.cardStatus === 'pending') && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
                  <Clock className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">
                    Langkah 5 — Menunggu Persetujuan Admin
                  </h3>
                  <p className="text-xs text-amber-300 font-semibold mt-1">
                    Status: ⏳ Menunggu Persetujuan
                  </p>
                  <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                    Permohonan pendaftaran <strong>{activeTierConfig.nameIndo}</strong> Anda telah masuk ke antrean verifikasi Admin Bank Nusantara.
                  </p>
                </div>
              </>
            )}

            {trackedAccount && trackedAccount.cardStatus === 'active' && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Permohonan Disetujui Admin!</h3>
                  <p className="text-xs text-emerald-300 font-semibold mt-1">
                    No. Rekening: <span className="font-mono">{trackedAccount.accountNumber}</span> • Saldo{' '}
                    <span className="font-mono">{formatRupiah(trackedAccount.balance)}</span>
                  </p>
                </div>
              </>
            )}

            {trackedAccount && trackedAccount.cardStatus === 'rejected' && (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 text-rose-400 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Permohonan Ditolak Admin</h3>
                  <p className="text-xs text-rose-300 mt-1">
                    {trackedAccount.rejectionReason || 'Dokumen belum memenuhi verifikasi.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedAccountId(null);
                    setStep(1);
                  }}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer"
                >
                  Perbaiki Data &amp; Ajukan Ulang
                </button>
              </>
            )}

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
