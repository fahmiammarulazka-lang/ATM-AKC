/**
 * Layar Blokir Real-Time (BanLockScreen) & Komponen Live Preview Interaktif Studio Banned
 * Mendukung 50 fitur kustomisasi penuh dari Panel Admin:
 * - Judul tetap "Akun Anda Telah Dibanned"
 * - Subjudul opsional (bisa diisi, dikosongkan, atau disembunyikan)
 * - Sembunyikan seluruh identitas akun (Nama, Email, No. Rekening) & Saldo demi privasi
 * - Jika tanpa alasan (kosong), kotak alasan disembunyikan sama sekali tanpa teks tambahan
 * - 4 Tema Warna (Merah Darurat, Kuning Peringatan, Biru Beku, Gelap Total)
 * - 4 Ikon Utama (Perisai, Gembok, Segitiga Peringatan, Palu Hukum)
 * - Centang independen untuk 3 tombol tinjauan (WhatsApp, Email, Tinjau di Sini) + label kuning "★ Disarankan"
 * - Hitung mundur real-time untuk Banned Trial (Sementara)
 * - Mode Live Preview interaktif untuk Panel Admin (HP / Laptop + Simulasi Status Banding)
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldBan,
  Lock,
  AlertTriangle,
  Gavel,
  MessageCircle,
  Mail,
  FileText,
  Send,
  LogOut,
  CheckCircle2,
  Clock,
  Cloud,
  Calendar,
  Hash,
  Volume2,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { BanScreenCustomizationConfig } from '../types/bank';
import {
  DEFAULT_BAN_SCREEN_CONFIG,
  APPEAL_CATEGORIES_LIST,
  formatBanAppealPrefillMessage,
} from '../data/banStudioCatalog';

function playBanSoundEffect(mode: 'siren' | 'warning') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = mode === 'siren' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(mode === 'siren' ? 680 : 480, ctx.currentTime);
    if (mode === 'siren') {
      osc.frequency.linearRampToValueAtTime(920, ctx.currentTime + 0.18);
      osc.frequency.linearRampToValueAtTime(640, ctx.currentTime + 0.36);
    }
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.42);
  } catch {
    // ignore audio autoplay restriction
  }
}

export interface BanLockPreviewProps {
  config: BanScreenCustomizationConfig;
  simulatedAppealStatus?: 'none' | 'pending' | 'rejected' | 'approved';
  simulatedAppealNote?: string;
  simulatedAdminReply?: string;
  simulatedAppealCount?: number;
  deviceMode?: 'mobile' | 'desktop';
  sampleAccountName?: string;
  sampleAccountEmail?: string;
  sampleAccountNumber?: string;
}

const formatCountdown = (expiresAt?: string, fallbackMinutes?: number): string | null => {
  if (expiresAt) {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Selesai — membebaskan blokir otomatis...';
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (days > 0) return `${days}h ${hours}j ${mins}m ${secs}d`;
    if (hours > 0) return `${hours}j ${mins}m ${secs}d`;
    return `${mins}m ${secs}d`;
  }
  if (fallbackMinutes && fallbackMinutes > 0) {
    const totalSec = Math.floor(fallbackMinutes * 60);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (days > 0) return `${days} Hari ${hours} Jam ${mins} Menit`;
    if (hours > 0) return `${hours} Jam ${mins} Menit`;
    return `${mins} Menit`;
  }
  return null;
};

export const BanLockScreen: React.FC<{ previewState?: BanLockPreviewProps }> = ({
  previewState,
}) => {
  const {
    activeBanLockState,
    banSupportConfig,
    currentAccount,
    googleUser,
    submitUnifiedBanAppeal,
    logoutGoogle,
    cloudSyncStatus,
  } = useBank();

  const isPreview = Boolean(previewState);
  const cfg: BanScreenCustomizationConfig = previewState
    ? previewState.config
    : activeBanLockState.customConfig || banSupportConfig.defaultTemplate || DEFAULT_BAN_SCREEN_CONFIG;

  const [showInAppForm, setShowInAppForm] = useState<boolean>(false);
  const [appealMessage, setAppealMessage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(APPEAL_CATEGORIES_LIST[0]);
  const [promiseChecked, setPromiseChecked] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [previewToast, setPreviewToast] = useState<string | null>(null);
  const [, setTick] = useState<number>(0);

  const effectiveExpiresAt = isPreview ? cfg.expiresAt : activeBanLockState.expiresAt || cfg.expiresAt;

  useEffect(() => {
    if (cfg.durationType !== 'custom') return;
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [cfg.durationType, effectiveExpiresAt]);

  // Play sound effect on real lock screen mount if configured
  useEffect(() => {
    if (isPreview) return;
    if (cfg.soundEffect === 'siren') {
      playBanSoundEffect('siren');
    } else if (cfg.soundEffect === 'warning' || cfg.soundEffect === 'alert') {
      playBanSoundEffect('warning');
    }
  }, [isPreview, cfg.soundEffect]);

  // Resolve WA & Email target (per-account override or global)
  const rawWaSource =
    (cfg.overrideWhatsAppNumber || cfg.overrideWhatsappNumber || '').trim() ||
    (banSupportConfig.whatsappNumber || '').trim();
  const rawWa = rawWaSource.replace(/[^\d]/g, '');
  const waFormatted = rawWa.startsWith('0') ? `62${rawWa.slice(1)}` : rawWa;

  const rawEmail =
    (cfg.overrideEmailAddress || '').trim() || (banSupportConfig.emailAddress || '').trim();

  // Used only for prefilling outgoing WhatsApp/Email messages (never displayed on screen per privacy rule Q15)
  const identityName = isPreview
    ? previewState?.sampleAccountName || 'Nasabah Contoh'
    : currentAccount?.fullName || googleUser?.name || 'Nasabah Bank Nusantara';
  const identityEmail = isPreview
    ? previewState?.sampleAccountEmail || 'nasabah@email.com'
    : googleUser?.email || currentAccount?.email || '-';
  const identityAcc = isPreview
    ? previewState?.sampleAccountNumber || '1234567890'
    : currentAccount?.accountNumber || 'Belum Ada Rekening';

  const cfgReasonStr = cfg.reason ?? cfg.reasonText ?? '';
  const resolvedReason =
    cfg.reasonMode === 'none' || !cfg.showReasonBox
      ? ''
      : (isPreview ? cfgReasonStr : activeBanLockState.reason || cfgReasonStr || '').trim();

  const shouldShowReasonBox = cfg.showReasonBox && cfg.reasonMode !== 'none' && Boolean(resolvedReason);

  const resolvedAppealTemplate =
    cfg.appealMessageTemplate !== undefined
      ? cfg.appealMessageTemplate
      : cfg.messageTemplate !== undefined
      ? cfg.messageTemplate
      : banSupportConfig.defaultTemplate?.appealMessageTemplate ??
        banSupportConfig.defaultTemplateConfig?.appealMessageTemplate;

  const prefilledText = formatBanAppealPrefillMessage(resolvedAppealTemplate, {
    nama: identityName,
    email: identityEmail,
    rekening: identityAcc,
    alasan: resolvedReason,
    caseId: cfg.caseId,
    durasi: cfg.durationLabel,
  });

  const waHref = waFormatted
    ? `https://wa.me/${waFormatted}?text=${encodeURIComponent(prefilledText)}`
    : undefined;

  const emailSubject = `[Tinjauan Ban Akun] ${cfg.caseId ? `${cfg.caseId} - ` : ''}${identityName}`;
  const emailHref = rawEmail
    ? `mailto:${encodeURIComponent(rawEmail)}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(prefilledText)}`
    : undefined;

  // Appeal state (real or simulated in preview)
  const effectiveAppealStatus = isPreview
    ? previewState?.simulatedAppealStatus || 'none'
    : activeBanLockState.appealStatus;
  const effectiveAppealNote = isPreview
    ? previewState?.simulatedAppealNote ||
      (effectiveAppealStatus !== 'none'
        ? 'Mohon tinjau kembali akun saya, saya siap melakukan verifikasi keamanan.'
        : undefined)
    : activeBanLockState.appealNote;
  const effectiveAdminReply = isPreview
    ? previewState?.simulatedAdminReply ||
      (effectiveAppealStatus === 'rejected'
        ? 'Bukti verifikasi belum lengkap. Silakan lampirkan kronologi lengkap.'
        : undefined)
    : activeBanLockState.appealAdminNote;
  const effectiveAppealCount = isPreview
    ? previewState?.simulatedAppealCount ?? (effectiveAppealStatus !== 'none' ? 1 : 0)
    : activeBanLockState.appealCount;

  // Check if in-app appeal submission is locked by rules
  const isBlockedByRejectRule =
    effectiveAppealStatus === 'rejected' && !cfg.allowResubmitAfterReject;
  const isBlockedByMaxAppeals =
    cfg.maxAppeals > 0 && effectiveAppealCount >= cfg.maxAppeals;

  const handleInAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (cfg.requireAppealCategoryAndPromise && !promiseChecked) {
      setFeedback({
        type: 'error',
        text: 'Anda wajib mencentang pernyataan janji kepatuhan sebelum mengirim permohonan tinjauan.',
      });
      return;
    }

    if (isPreview) {
      setFeedback({
        type: 'success',
        text: `[Simulasi Live Preview] Permohonan tinjauan berhasil diuji! Kategori: "${
          cfg.requireAppealCategoryAndPromise ? selectedCategory : 'Umum'
        }".`,
      });
      setAppealMessage('');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitUnifiedBanAppeal(
        appealMessage,
        'in_app',
        cfg.requireAppealCategoryAndPromise ? selectedCategory : undefined,
        cfg.requireAppealCategoryAndPromise ? promiseChecked : undefined
      );
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

  // Theme styles (Q16: Merah Darurat, Kuning Peringatan, Biru Beku, Gelap Total)
  const activeTheme = cfg.theme || cfg.themeVariant || 'emergency_red';
  const themeStyles = (() => {
    switch (activeTheme) {
      case 'warning_amber':
        return {
          outerBg: 'bg-[#0e0b05]',
          glowA: 'bg-amber-500/20',
          glowB: 'bg-yellow-500/10',
          cardBg: 'bg-[#151109] border-amber-500/65',
          accentText: 'text-amber-400',
          iconBox: 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-amber-500/20',
          badgeBg: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
          reasonBox: 'bg-amber-950/35 border-amber-500/40',
          reasonInner: 'bg-slate-950/80 border-amber-500/30',
        };
      case 'frozen_blue':
        return {
          outerBg: 'bg-[#050d16]',
          glowA: 'bg-cyan-500/20',
          glowB: 'bg-blue-500/15',
          cardBg: 'bg-[#091524] border-cyan-500/65',
          accentText: 'text-cyan-400',
          iconBox: 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/20',
          badgeBg: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200',
          reasonBox: 'bg-cyan-950/35 border-cyan-500/40',
          reasonInner: 'bg-slate-950/80 border-cyan-500/30',
        };
      case 'pitch_dark':
        return {
          outerBg: 'bg-[#030406]',
          glowA: 'bg-slate-600/10',
          glowB: 'bg-zinc-600/10',
          cardBg: 'bg-[#090b10] border-slate-700',
          accentText: 'text-slate-300',
          iconBox: 'bg-slate-800/80 border-slate-600 text-slate-200 shadow-black/40',
          badgeBg: 'bg-slate-800 border-slate-600 text-slate-200',
          reasonBox: 'bg-slate-900/70 border-slate-700',
          reasonInner: 'bg-black/70 border-slate-800',
        };
      case 'emergency_red':
      default:
        return {
          outerBg: 'bg-[#07090f]',
          glowA: 'bg-rose-600/20',
          glowB: 'bg-amber-500/10',
          cardBg: 'bg-[#0c111d] border-rose-500/65',
          accentText: 'text-rose-400',
          iconBox: 'bg-rose-600/20 border-rose-500 text-rose-400 shadow-rose-600/20',
          badgeBg: 'bg-rose-500/20 border-rose-400/50 text-rose-200',
          reasonBox: 'bg-rose-950/35 border-rose-500/40',
          reasonInner: 'bg-slate-950/75 border-rose-500/30',
        };
    }
  })();

  // Main Icon component (Q17: Perisai, Gembok, Segitiga Peringatan, Palu Hukum)
  const activeIcon = cfg.icon || cfg.iconVariant || 'shield';
  const renderMainIcon = (className: string) => {
    switch (activeIcon) {
      case 'lock':
        return <Lock className={className} />;
      case 'warning':
        return <AlertTriangle className={className} />;
      case 'gavel':
        return <Gavel className={className} />;
      case 'shield':
      default:
        return <ShieldBan className={className} />;
    }
  };

  const countdown =
    cfg.durationType === 'custom' && cfg.showCountdown
      ? formatCountdown(effectiveExpiresAt, cfg.durationMinutes)
      : null;

  const formattedBannedAt = (() => {
    const raw = isPreview ? cfg.bannedAt || new Date().toISOString() : activeBanLockState.bannedAt || cfg.bannedAt;
    if (!raw) return null;
    try {
      return new Date(raw).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  })();

  const statusBadgeLabel =
    (cfg.statusBadgeText || '').trim() ||
    (cfg.durationType === 'permanent' ? 'BANNED PERMANEN' : `BANNED SEMENTARA (${cfg.durationLabel})`);

  const anyAppealButtonEnabled =
    cfg.showWhatsAppButton || cfg.showEmailButton || cfg.showInAppAppealButton;
  const anyDirectContactEnabled = cfg.showWhatsAppButton || cfg.showEmailButton;

  return (
    <div
      className={`${
        isPreview
          ? 'w-full rounded-3xl p-4 sm:p-5 relative overflow-hidden border border-slate-800'
          : 'min-h-screen p-4 sm:p-6 flex items-center justify-center relative overflow-hidden'
      } ${themeStyles.outerBg} text-slate-100`}
    >
      {/* Background atmospheric glow */}
      <div
        className={`absolute -top-36 -left-36 w-80 h-80 ${themeStyles.glowA} rounded-full blur-3xl pointer-events-none`}
      />
      <div
        className={`absolute -bottom-36 -right-36 w-80 h-80 ${themeStyles.glowB} rounded-full blur-3xl pointer-events-none`}
      />

      <div
        className={`${
          isPreview && previewState?.deviceMode === 'mobile'
            ? 'max-w-[360px] mx-auto p-5'
            : 'max-w-xl w-full mx-auto p-6 sm:p-8'
        } ${themeStyles.cardBg} border-2 rounded-3xl shadow-2xl space-y-5 relative z-10 transition-all`}
      >
        {/* Top Real-Time Sync Bar */}
        <div className="flex items-center justify-between gap-2 text-[11px] font-mono border-b border-slate-800/90 pb-3">
          <span
            className={`inline-flex items-center gap-1.5 ${themeStyles.accentText} font-bold uppercase tracking-wider`}
          >
            {renderMainIcon('w-4 h-4')}
            <span>Akses Diblokir Real-Time</span>
          </span>
          <div className="flex items-center gap-1.5">
            {isPreview && cfg.soundEffect !== 'silent' && cfg.soundEffect !== 'mute' && (
              <button
                type="button"
                onClick={() =>
                  playBanSoundEffect(cfg.soundEffect === 'siren' ? 'siren' : 'warning')
                }
                title="Uji Efek Suara Banned"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer hover:border-amber-400"
              >
                <Volume2 className="w-3 h-3" />
                <span>{cfg.soundEffect === 'siren' ? 'Sirene' : 'Nada'}</span>
              </button>
            )}
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
        </div>

        {/* Main Ban Heading & Status Badges */}
        <div className="text-center space-y-3">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl border-2 flex items-center justify-center shadow-lg ${themeStyles.iconBox}`}
          >
            {renderMainIcon('w-8 h-8')}
          </div>

          {/* Optional Status Badge (Q20) */}
          {cfg.showStatusBadge && (
            <div className="flex items-center justify-center">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-black uppercase tracking-wider font-mono ${themeStyles.badgeBg}`}
              >
                {statusBadgeLabel}
              </span>
            </div>
          )}

          {/* Fixed Main Title (Q8: Judul utama tetap "Akun Anda Telah Dibanned") */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Akun Anda Telah Dibanned
          </h1>

          {/* Optional Subtitle (Q9: Opsional bisa diisi, dikosongkan, atau disembunyikan penuh) */}
          {cfg.showSubtitle && Boolean((cfg.subtitleText || '').trim()) && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {cfg.subtitleText}
            </p>
          )}

          {/* Optional Metadata Pills: Case ID (Q18) & Banned Timestamp (Q19) */}
          {(cfg.showCaseId || (cfg.showBannedAtTime && formattedBannedAt)) && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
              {cfg.showCaseId && cfg.caseId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-amber-300">
                  <Hash className="w-3 h-3" />
                  <span>ID Kasus: {cfg.caseId}</span>
                </span>
              )}
              {cfg.showBannedAtTime && formattedBannedAt && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                  <Calendar className="w-3 h-3" />
                  <span>Waktu: {formattedBannedAt}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Reason & Countdown Box
            CRITICAL RULE (Q3 & User Prompt):
            - Jika tidak ada alasan (kosong / reasonMode === 'none'), SEMBUNYIKAN kotak alasan sama sekali tanpa teks tambahan!
            - Seluruh identitas akun & saldo disembunyikan penuh demi privasi (Q15 & Q34).
        */}
        {(shouldShowReasonBox || countdown) && (
          <div className={`${themeStyles.reasonBox} border rounded-2xl p-4 space-y-3 text-xs`}>
            {shouldShowReasonBox && (
              <div>
                <span
                  className={`text-[10px] ${themeStyles.accentText} uppercase font-mono font-bold block mb-1.5`}
                >
                  Penjelasan / Alasan Pemblokiran:
                </span>
                <p
                  className={`text-sm text-white font-semibold ${themeStyles.reasonInner} border rounded-xl p-3 leading-relaxed`}
                >
                  {resolvedReason}
                </p>
              </div>
            )}

            {countdown && (
              <div className="flex items-center justify-between gap-2 text-amber-300 font-mono text-xs pt-0.5">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Sisa Durasi Banned Trial:</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/40 font-black text-amber-200">
                  {countdown}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Appeal Status & Admin Reply Box (Q27: Bisa dicentang tampil/sembunyi) */}
        {cfg.showAppealStatusBox && effectiveAppealStatus !== 'none' && (
          <div
            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
              effectiveAppealStatus === 'pending'
                ? 'bg-amber-500/10 border-amber-400/50 text-amber-200'
                : effectiveAppealStatus === 'rejected'
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div className="font-black flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5">
                {effectiveAppealStatus === 'pending' ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Status Tinjauan: Menunggu Pemeriksaan Admin</span>
                  </>
                ) : effectiveAppealStatus === 'rejected' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Status Tinjauan: Pengajuan Banding Ditolak</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Status Tinjauan: Disetujui</span>
                  </>
                )}
              </span>
              {cfg.maxAppeals > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/60">
                  Banding: {effectiveAppealCount}/{cfg.maxAppeals}x
                </span>
              )}
            </div>
            {effectiveAppealNote && (
              <p className="text-[11px] opacity-90">
                Permohonan Anda: &quot;{effectiveAppealNote}&quot;
              </p>
            )}
            {effectiveAdminReply && (
              <p className="text-[11px] font-semibold text-white bg-slate-950/60 p-2 rounded-lg border border-white/10">
                Balasan Admin: {effectiveAdminReply}
              </p>
            )}
          </div>
        )}

        {/* Preview Interactive Toast when clicking WA/Email inside Admin Live Preview */}
        {isPreview && previewToast && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-start justify-between gap-2">
            <div>
              <strong className="block text-emerald-300 font-bold">
                Simulasi Tombol Live Preview Aktif
              </strong>
              <p className="text-[11px] mt-0.5 whitespace-pre-line">{previewToast}</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewToast(null)}
              className="text-emerald-300 hover:text-white font-bold px-1.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 3 Independent Appeal Buttons (Q4 & Q5: Jika semua tidak dicentang, sembunyikan total!) */}
        {anyAppealButtonEnabled && (
          <div className="space-y-3 pt-1">
            {anyDirectContactEnabled && (
              <div className="space-y-1.5">
                {/* Bright Yellow Small Text "★ Disarankan" (Q10: Hanya bisa disembunyikan tanpa mengubah teksnya) */}
                {cfg.showRecommendedLabel && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.45)]">
                      ★ Disarankan
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Hubungi Admin langsung untuk tinjauan cepat
                    </span>
                  </div>
                )}

                <div
                  className={`grid grid-cols-1 ${
                    cfg.showWhatsAppButton && cfg.showEmailButton ? 'sm:grid-cols-2' : ''
                  } gap-2.5`}
                >
                  {cfg.showWhatsAppButton &&
                    (isPreview ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewToast(
                            `Membuka WhatsApp ke +${
                              waFormatted || '6281298765432'
                            }\nIsi Pesan Otomatis:\n"${prefilledText}"`
                          )
                        }
                        className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>Tinjau dengan WhatsApp</span>
                      </button>
                    ) : waHref ? (
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
                    ))}

                  {cfg.showEmailButton &&
                    (isPreview ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewToast(
                            `Membuka aplikasi Email ke ${
                              rawEmail || 'admin@banknusantara.id'
                            }\nSubjek: ${emailSubject}\nIsi Pesan:\n"${prefilledText}"`
                          )
                        }
                        className="py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span>Tinjau dengan Email</span>
                      </button>
                    ) : emailHref ? (
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
                    ))}
                </div>
              </div>
            )}

            {/* Tinjau di Sini Button (Fixed Label Q23: "Tinjau di Sini") */}
            {cfg.showInAppAppealButton && (
              <>
                <button
                  type="button"
                  onClick={() => setShowInAppForm((v) => !v)}
                  className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-amber-300 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Tinjau di Sini</span>
                </button>

                {showInAppForm && (
                  <form
                    onSubmit={handleInAppSubmit}
                    className="p-4 rounded-2xl bg-slate-950 border border-amber-400/40 space-y-3 text-xs"
                  >
                    {isBlockedByRejectRule ? (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 font-semibold">
                        Pengajuan tinjauan Anda sebelumnya telah ditolak oleh Admin dan pengiriman ulang dinonaktifkan untuk akun ini.
                      </div>
                    ) : isBlockedByMaxAppeals ? (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 font-semibold">
                        Anda telah mencapai batas maksimal pengajuan banding ({cfg.maxAppeals}x). Silakan tunggu pemeriksaan Admin.
                      </div>
                    ) : (
                      <>
                        {cfg.requireAppealCategoryAndPromise && (
                          <div>
                            <label className="font-bold text-slate-200 block mb-1">
                              Pilih Kategori Alasan Banding:
                            </label>
                            <select
                              value={selectedCategory}
                              onChange={(e) => setSelectedCategory(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
                            >
                              {APPEAL_CATEGORIES_LIST.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="font-bold text-white block mb-1">
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
                        </div>

                        {cfg.requireAppealCategoryAndPromise && (
                          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={promiseChecked}
                              onChange={(e) => setPromiseChecked(e.target.checked)}
                              className="mt-0.5 accent-amber-400 rounded"
                            />
                            <span className="text-[11px] text-slate-300 leading-relaxed">
                              Saya menyatakan data di atas benar dan berjanji mematuhi seluruh ketentuan keamanan Bank Nusantara.
                            </span>
                          </label>
                        )}

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
                          <span>
                            {submitting
                              ? 'Mengirim ke Cloud...'
                              : 'Kirim Permohonan Tinjauan'}
                          </span>
                        </button>
                      </>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        )}

        {/* Optional Footer Note (Q49) */}
        {(cfg.showFooterNote ?? Boolean((cfg.footerNote || '').trim())) &&
          Boolean((cfg.footerNote || '').trim()) && (
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 text-center leading-relaxed">
              {cfg.footerNote}
            </div>
          )}

        {/* Always Visible Logout / Switch Account Button (Q47) */}
        <div className="pt-3 border-t border-slate-800/90 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-400">
            Ingin beralih ke akun lain?
          </span>
          <button
            type="button"
            onClick={() => {
              if (isPreview) {
                setPreviewToast('Simulasi: Tombol "Keluar / Ganti Akun" ditekan.');
                return;
              }
              logoutGoogle();
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-200 hover:text-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar / Ganti Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
};
