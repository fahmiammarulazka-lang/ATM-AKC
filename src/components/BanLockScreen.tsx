/**
 * Layar Blokir Penuh Real-Time saat Akun / Kartu Dibanned
 * Menampilkan alasan banned, tulisan kecil kuning cerah "Disarankan" di atas
 * tombol "Tinjau dengan WhatsApp" & "Tinjau dengan Email" (diatur di Panel Admin),
 * serta form interaktif "Tinjau di Sini" yang tersinkron real-time ke Cloud Firestore.
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldBan,
  MessageCircle,
  Mail,
  FileText,
  Send,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cloud,
} from 'lucide-react';
import { useBank } from '../context/BankContext';

const formatCountdown = (expiresAt?: string): string | null => {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Selesai — membebaskan blokir...';
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}h ${hours}j ${mins}m ${secs}d`;
  if (hours > 0) return `${hours}j ${mins}m ${secs}d`;
  return `${mins}m ${secs}d`;
};

export const BanLockScreen: React.FC = () => {
  const {
    activeBanLockState,
    banSupportConfig,
    currentAccount,
    googleUser,
    submitUnifiedBanAppeal,
    logoutGoogle,
    cloudSyncStatus,
  } = useBank();

  const [showInAppForm, setShowInAppForm] = useState<boolean>(false);
  const [appealMessage, setAppealMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    if (!activeBanLockState.expiresAt) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [activeBanLockState.expiresAt]);

  const rawWa = (banSupportConfig.whatsappNumber || '').replace(/[^\d]/g, '');
  const waFormatted = rawWa.startsWith('0') ? `62${rawWa.slice(1)}` : rawWa;
  const rawEmail = (banSupportConfig.emailAddress || '').trim();

  const identityName = currentAccount?.fullName || googleUser?.name || 'Nasabah Bank Nusantara';
  const identityEmail = googleUser?.email || currentAccount?.email || '-';
  const identityAcc = currentAccount?.accountNumber || 'Belum Ada Rekening';

  const prefilledText = [
    'Halo Admin Bank Nusantara,',
    'Saya ingin mengajukan peninjauan pembukaan status Banned pada akun saya:',
    `- Nama: ${identityName}`,
    `- Email Google: ${identityEmail}`,
    `- No. Rekening: ${identityAcc}`,
    `- Alasan Ban Tercatat: ${activeBanLockState.reason}`,
    '',
    'Mohon bantuannya untuk meninjau akun saya kembali. Terima kasih.',
  ].join('\n');

  const waHref = waFormatted
    ? `https://wa.me/${waFormatted}?text=${encodeURIComponent(prefilledText)}`
    : undefined;

  const emailSubject = `[Tinjauan Ban Akun] ${identityName} (${identityAcc})`;
  const emailHref = rawEmail
    ? `mailto:${encodeURIComponent(rawEmail)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(prefilledText)}`
    : undefined;

  const handleInAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSubmitting(true);
    try {
      const res = await submitUnifiedBanAppeal(appealMessage, 'in_app');
      setFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        setAppealMessage('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const countdown = formatCountdown(activeBanLockState.expiresAt);

  return (
    <div className="min-h-screen bg-[#07090f] text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background atmospheric glow */}
      <div className="absolute -top-36 -left-36 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -right-36 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-[#0c111d] border-2 border-rose-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative z-10">
        {/* Top Real-Time Sync Badge */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono border-b border-slate-800 pb-3">
          <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold uppercase tracking-wider">
            <ShieldBan className="w-4 h-4" />
            <span>Akses Diblokir Real-Time</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-bold ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : cloudSyncStatus === 'syncing'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}
          >
            <Cloud className="w-3 h-3" />
            <span>
              {cloudSyncStatus === 'synced'
                ? 'Cloud Tersinkronisasi'
                : cloudSyncStatus === 'syncing'
                ? 'Menyinkronkan...'
                : 'Offline'}
            </span>
          </span>
        </div>

        {/* Main Ban Heading */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-600/20">
            <ShieldBan className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Akun Anda Telah Dibanned
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Seluruh akses fitur dan sesi aktif telah dihentikan secara otomatis di seluruh perangkat yang terhubung dengan akun ini.
          </p>
        </div>

        {/* Account & Reason Box */}
        <div className="bg-rose-950/35 border border-rose-500/40 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2 border-b border-rose-500/20">
            <div>
              <span className="text-[10px] text-rose-300 uppercase font-mono block">Pemilik Akun</span>
              <span className="font-bold text-white">{identityName}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-300 uppercase font-mono block">Email &amp; Rekening</span>
              <span className="font-mono text-amber-300 block truncate">{identityEmail}</span>
              {currentAccount && (
                <span className="font-mono text-[11px] text-slate-300">Rek: {identityAcc}</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] text-rose-300 uppercase font-mono font-bold block mb-1">
              Alasan Pemblokiran:
            </span>
            <p className="text-sm text-white font-semibold bg-slate-950/70 border border-rose-500/30 rounded-xl p-3 leading-relaxed">
              {activeBanLockState.reason || 'Akun diblokir oleh Admin Bank Nusantara.'}
            </p>
          </div>

          {countdown && (
            <div className="flex items-center gap-2 text-amber-300 font-mono text-xs pt-1">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Sisa Durasi Blokir Otomatis: {countdown}</span>
            </div>
          )}
        </div>

        {/* Appeal Status Feedback from Cloud */}
        {activeBanLockState.appealStatus !== 'none' && (
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
              activeBanLockState.appealStatus === 'pending'
                ? 'bg-amber-500/10 border-amber-400/50 text-amber-200'
                : activeBanLockState.appealStatus === 'rejected'
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div className="font-black flex items-center gap-1.5">
              {activeBanLockState.appealStatus === 'pending' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span>Status Tinjauan: Menunggu Pemeriksaan Admin</span>
                </>
              ) : activeBanLockState.appealStatus === 'rejected' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Status Tinjauan: Ditolak Admin</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Status Tinjauan: Disetujui</span>
                </>
              )}
            </div>
            {activeBanLockState.appealNote && (
              <p className="text-[11px] opacity-90">Catatan Anda: &quot;{activeBanLockState.appealNote}&quot;</p>
            )}
            {activeBanLockState.appealAdminNote && (
              <p className="text-[11px] font-semibold text-white">
                Balasan Admin: {activeBanLockState.appealAdminNote}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-1">
          {/* Bright Yellow Small Text "Disarankan" directly above WhatsApp & Email buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.45)]">
                ★ Disarankan
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Hubungi Admin langsung untuk tinjauan cepat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {waHref ? (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    void submitUnifiedBanAppeal(
                      `Pengguna menghubungi WhatsApp Admin (+${waFormatted}) untuk peninjauan banned.`,
                      'whatsapp'
                    );
                  }}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Tinjau dengan WhatsApp</span>
                </a>
              ) : (
                <div className="py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-semibold text-center">
                  Nomor WhatsApp Admin belum diatur
                </div>
              )}

              {emailHref ? (
                <a
                  href={emailHref}
                  onClick={() => {
                    void submitUnifiedBanAppeal(
                      `Pengguna menghubungi Email Admin (${rawEmail}) untuk peninjauan banned.`,
                      'email'
                    );
                  }}
                  className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
                >
                  <Mail className="w-4 h-4 shrink-0" />
                  <span>Tinjau dengan Email</span>
                </a>
              ) : (
                <div className="py-3 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-[11px] font-semibold text-center">
                  Email Admin belum diatur
                </div>
              )}
            </div>
          </div>

          {/* Tinjau di Sini Button */}
          <button
            type="button"
            onClick={() => setShowInAppForm((v) => !v)}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-amber-300 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{showInAppForm ? 'Tutup Form Tinjau di Sini' : 'Tinjau di Sini (Kirim ke Panel Admin)'}</span>
          </button>

          {showInAppForm && (
            <form
              onSubmit={handleInAppSubmit}
              className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3 text-xs"
            >
              <label className="font-bold text-white block">
                Tuliskan Penjelasan / Permohonan Pembukaan Blokir:
              </label>
              <textarea
                rows={3}
                required
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                placeholder="Jelaskan kronologi atau alasan mengapa akun Anda layak ditinjau & dibuka kembali..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-semibold ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/40 text-rose-300'
                  }`}
                >
                  {feedback.text}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Mengirim ke Cloud...' : 'Kirim Permohonan Tinjauan'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Logout Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Ingin ganti akun Google lain?
          </span>
          <button
            type="button"
            onClick={logoutGoogle}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
