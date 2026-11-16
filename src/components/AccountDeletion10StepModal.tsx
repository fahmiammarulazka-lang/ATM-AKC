import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  User,
  KeyRound,
  FileText,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

interface AccountDeletion10StepModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'admin' | 'customer';
  initialTargetAccountId?: string;
  onDeleted?: (message: string) => void;
}

export const AccountDeletion10StepModal: React.FC<AccountDeletion10StepModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialTargetAccountId,
  onDeleted,
}) => {
  const { accounts, currentAccount, adminDeleteAccount } = useBank();

  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(30);
  const [reasonCategory, setReasonCategory] = useState<string>('Rekening Ganda / Tidak Terpakai');
  const [reasonDetail, setReasonDetail] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [fullNameInput, setFullNameInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('Jakarta, Indonesia');
  const [lastAccessStamp, setLastAccessStamp] = useState<string>('');
  const [assetAckChecked, setAssetAckChecked] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [legalChecked, setLegalChecked] = useState<boolean>(false);
  const [confirmKeyword, setConfirmKeyword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Reset modal state and start 30s countdown whenever opened
  useEffect(() => {
    if (!isOpen) return;
    const defaultId =
      mode === 'customer'
        ? currentAccount?.id || accounts[0]?.id || ''
        : initialTargetAccountId || accounts[0]?.id || '';
    setTargetAccountId(defaultId);
    setCountdown(30);
    setReasonCategory('Rekening Ganda / Tidak Terpakai');
    setReasonDetail('');
    setPhoneInput('');
    setEmailInput('');
    setFullNameInput('');
    setLocationInput('Jakarta, Indonesia');
    setLastAccessStamp(new Date().toLocaleString('id-ID'));
    setAssetAckChecked(false);
    setPinInput('');
    setLegalChecked(false);
    setConfirmKeyword('');
    setFormError('');
  }, [isOpen, mode, initialTargetAccountId, currentAccount?.id]);

  // Real-time 30-second countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const targetAccount =
    accounts.find((a) => a.id === targetAccountId) ||
    (mode === 'customer' ? currentAccount : accounts[0]) ||
    null;

  const isReasonValid = reasonDetail.trim().length >= 5;
  const isPhoneValid = phoneInput.trim().length >= 8;
  const isEmailValid = emailInput.trim().includes('@') && emailInput.trim().length >= 5;
  const isNameValid = fullNameInput.trim().length >= 3;
  const isLocationValid = locationInput.trim().length >= 3;
  const isPinFormatValid = /^\d{6}$/.test(pinInput.trim());
  const isKeywordValid = confirmKeyword.trim().toUpperCase() === 'HAPUS';

  const all10Filled =
    Boolean(targetAccount) &&
    isReasonValid &&
    isPhoneValid &&
    isEmailValid &&
    isNameValid &&
    isLocationValid &&
    Boolean(lastAccessStamp) &&
    assetAckChecked &&
    isPinFormatValid &&
    legalChecked &&
    isKeywordValid;

  const canClickContinue = countdown === 0 && all10Filled;

  const handleConfirmDelete = () => {
    setFormError('');
    if (countdown > 0) {
      setFormError(`Mohon baca penjelasan terlebih dahulu. Tombol Lanjut aktif dalam ${countdown} detik.`);
      return;
    }
    if (!targetAccount) {
      setFormError('Rekening target tidak ditemukan.');
      return;
    }
    if (!isReasonValid) {
      setFormError('Konfirmasi 2: Jelaskan alasan penghapusan minimal 5 karakter.');
      return;
    }
    if (!isPhoneValid) {
      setFormError('Konfirmasi 3: Masukkan nomor telepon aktif minimal 8 digit.');
      return;
    }
    if (!isEmailValid) {
      setFormError('Konfirmasi 4: Masukkan alamat email yang valid.');
      return;
    }
    if (!isNameValid) {
      setFormError('Konfirmasi 5: Masukkan nama lengkap pemilik rekening.');
      return;
    }
    if (!isLocationValid) {
      setFormError('Konfirmasi 6: Masukkan lokasi perangkat saat ini.');
      return;
    }
    if (!assetAckChecked) {
      setFormError('Konfirmasi 8: Centang persetujuan pemusnahan saldo & seluruh data aset.');
      return;
    }
    if (!isPinFormatValid) {
      setFormError('Konfirmasi 9: Masukkan 6 digit PIN Kartu atau PIN Otorisasi yang valid.');
      return;
    }

    const cleanPin = pinInput.trim();
    const validAdminOverride = mode === 'admin' && cleanPin === '159357';
    if (targetAccount.pin && cleanPin !== targetAccount.pin && !validAdminOverride) {
      setFormError('Konfirmasi 9: 6 digit PIN tidak sesuai dengan PIN kartu rekening tersebut!');
      return;
    }

    if (!legalChecked || !isKeywordValid) {
      setFormError('Konfirmasi 10: Centang persetujuan hukum akhir dan ketik kata "HAPUS".');
      return;
    }

    const res = adminDeleteAccount(targetAccount.id, {
      logoutIfCurrent: mode === 'customer',
    });

    if (!res.success) {
      setFormError(res.message);
      return;
    }

    onDeleted?.(res.message);
    onClose();
  };

  const completedCount = [
    Boolean(targetAccount),
    isReasonValid,
    isPhoneValid,
    isEmailValid,
    isNameValid,
    isLocationValid,
    Boolean(lastAccessStamp),
    assetAckChecked,
    isPinFormatValid,
    legalChecked && isKeywordValid,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-rose-500/80 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl space-y-4 text-xs text-slate-200 max-h-[92vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Penghapusan Akun Permanen — 10 Konfirmasi Keamanan
              </h3>
              <p className="text-[11px] text-slate-400">
                Terpenuhi: <strong className="text-amber-300">{completedCount}/10</strong> Konfirmasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Reading Explanation + 30s Timer */}
        <div className="p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/50 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-black text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Penjelasan Wajib Dibaca Sebelum Menghapus Akun</span>
            </span>
            <span
              className={`font-mono font-black text-xs px-3 py-1 rounded-full flex items-center gap-1.5 ${
                countdown > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}
            >
              {countdown > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>Baca dulu: {countdown} detik</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Waktu Baca Selesai — Tombol Lanjut Aktif</span>
                </>
              )}
            </span>
          </div>

          <div className="text-slate-300 leading-relaxed text-[11px] space-y-1.5">
            <p>
              <strong>1. Penghapusan Bersifat Permanen Total:</strong> Akun yang dihapus akan langsung dimusnahkan dari{' '}
              <strong>Panel Admin</strong>, daftar login kartu, seluruh riwayat transaksi, pinjaman, deposito, celengan
              pocket, koin Spin the Wheel, penyimpanan perangkat, serta database server secara serentak dan tidak dapat
              dipulihkan kembali.
            </p>
            <p>
              <strong>2. Wajib Lengkapi 10 Konfirmasi &amp; Tunggu 30 Detik:</strong> Untuk mencegah penghapusan yang tidak
              disengaja, tombol <strong>Lanjut</strong> dinonaktifkan selama <strong>30 detik</strong> agar Anda membaca
              seluruh ketentuan di atas dan mengisi 10 langkah validasi di bawah ini dengan benar.
            </p>
          </div>
        </div>

        {/* 10 Confirmations Form */}
        <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
          <h4 className="font-extrabold text-rose-400 text-xs uppercase border-b border-slate-800 pb-2">
            Daftar 10 Konfirmasi Penghapusan Akun
          </h4>

          {/* 1. Target Account */}
          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">
              1. Rekening &amp; Kartu Target yang Akan Dihapus
            </label>
            {mode === 'admin' ? (
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
              >
                {accounts.length === 0 ? (
                  <option value="">Tidak ada rekening tersisa</option>
                ) : (
                  accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} — {acc.accountNumber} ({formatRupiah(acc.balance)})
                    </option>
                  ))
                )}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold flex items-center justify-between">
                <span>
                  {targetAccount
                    ? `${targetAccount.fullName} — ${targetAccount.accountNumber}`
                    : 'Tidak ada rekening aktif'}
                </span>
                {targetAccount && (
                  <span className="font-mono text-amber-300">{formatRupiah(targetAccount.balance)}</span>
                )}
              </div>
            )}
          </div>

          {/* 2. Alasan Penghapusan */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Jelaskan Alasan Penghapusan Akun (Wajib)</span>
            </label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
            >
              <option value="Rekening Ganda / Tidak Terpakai">Rekening Ganda / Tidak Terpakai</option>
              <option value="Ganti Perangkat / Buat Kartu Baru">Ganti Perangkat / Buat Kartu Baru</option>
              <option value="Keamanan & Privasi Data">Keamanan &amp; Privasi Data</option>
              <option value="Ingin Berhenti Menggunakan Layanan">Ingin Berhenti Menggunakan Layanan</option>
              <option value="Alasan Lainnya">Alasan Lainnya</option>
            </select>
            <textarea
              rows={2}
              placeholder="Tuliskan penjelasan lengkap alasan Anda menghapus akun ini..."
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
            />
          </div>

          {/* 3 & 4. No Telp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Nomor Telepon / WhatsApp</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: 081234567890"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>4. Alamat Email Aktif</span>
              </label>
              <input
                type="email"
                placeholder="Contoh: nama@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* 5 & 6. Nama Lengkap & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>5. Nama Lengkap Pemilik Akun</span>
              </label>
              <input
                type="text"
                placeholder="Ketik nama lengkap Anda"
                value={fullNameInput}
                onChange={(e) => setFullNameInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-200 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>6. Lokasi Perangkat / Kota</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Bandung, Indonesia"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* 7. Waktu Akses Terakhir */}
          <div className="space-y-1">
            <label className="font-bold text-slate-200 block">
              7. Waktu Akses Terakhir &amp; Stempel Sesi Keamanan
            </label>
            <input
              type="text"
              readOnly
              value={lastAccessStamp}
              className="w-full p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-cyan-300 font-mono"
            />
          </div>

          {/* 8. Konfirmasi Pemusnahan Aset */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={assetAckChecked}
              onChange={(e) => setAssetAckChecked(e.target.checked)}
              className="mt-0.5 rounded bg-slate-950 border-slate-700 text-rose-600"
            />
            <span className="text-[11px] text-slate-300 leading-relaxed">
              <strong>8. Konfirmasi Pemusnahan Saldo &amp; Aset:</strong> Saya mengerti seluruh saldo ({targetAccount ? formatRupiah(targetAccount.balance) : 'Rp 0'}), koin Spin ({targetAccount?.spinCoins || 0}), deposito, dan riwayat transaksi akan ikut terhapus permanen.
            </span>
          </label>

          {/* 9. Verifikasi 6 Digit PIN */}
          <div className="space-y-1">
            <label className="font-bold text-slate-200 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>
                9. Verifikasi 6 Digit PIN Kartu {mode === 'admin' ? '(atau Kode Otorisasi Admin)' : ''}
              </span>
            </label>
            <input
              type="password"
              maxLength={6}
              inputMode="numeric"
              placeholder="Masukkan 6 digit PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono tracking-[0.4em] text-center text-base"
            />
          </div>

          {/* 10. Persetujuan Akhir & Ketik HAPUS */}
          <div className="space-y-2 p-3 rounded-xl bg-rose-950/25 border border-rose-500/30">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={legalChecked}
                onChange={(e) => setLegalChecked(e.target.checked)}
                className="mt-0.5 rounded bg-slate-950 border-slate-700 text-rose-600"
              />
              <span className="text-[11px] text-slate-200 leading-relaxed">
                <strong>10. Pernyataan Hukum &amp; Persetujuan Akhir:</strong> Saya menyatakan penghapusan akun ini adalah keputusan sadar tanpa paksaan dan tidak dapat dibatalkan.
              </span>
            </label>
            <input
              type="text"
              placeholder='Ketik "HAPUS" untuk konfirmasi langkah ke-10'
              value={confirmKeyword}
              onChange={(e) => setConfirmKeyword(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-200 font-black uppercase tracking-wider text-center"
            />
          </div>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-950 border border-rose-500 text-rose-200 font-bold text-[11px]">
            ⚠️ {formError}
          </div>
        )}

        {/* Footer Actions: Batal & Lanjut */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            {countdown > 0 ? (
              <span>⏳ Wajib baca penjelasan: <strong>{countdown} detik</strong> lagi</span>
            ) : !all10Filled ? (
              <span className="text-amber-300">Lengkapi seluruh 10 konfirmasi di atas ({completedCount}/10)</span>
            ) : (
              <span className="text-emerald-300 font-bold">✅ Semua syarat siap — klik Lanjut untuk menghapus</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!canClickContinue}
              onClick={handleConfirmDelete}
              className={`px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all ${
                !canClickContinue
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30 cursor-pointer'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {countdown > 0 ? `Lanjut (${countdown}d)` : 'Lanjut'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
