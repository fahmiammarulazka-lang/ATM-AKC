import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  BellOff,
  KeyRound,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import {
  LobbySecurityPolicyConfig,
  loadLobbySecurityPolicy,
  saveLobbySecurityPolicy,
  subscribeLobbySecurityPolicy,
} from '../utils/lobbySecurityPolicy';

export const AdminLobbyPrivacyCard: React.FC = () => {
  const [policy, setPolicy] = useState<LobbySecurityPolicyConfig>(() =>
    loadLobbySecurityPolicy()
  );
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    return subscribeLobbySecurityPolicy(setPolicy);
  }, []);

  const handleToggleStrictMode = (nextEnabled: boolean) => {
    const saved = saveLobbySecurityPolicy({ strictLobbyPrivacyMode: nextEnabled });
    setPolicy(saved);
    setFeedback(
      nextEnabled
        ? 'Mode Privasi Lobi Ketat (Anti-Intip & Anti-Curi) AKTIF. Semua banner persetujuan kartu, auto-masuk, toast/suara pra-login, dan bocoran PIN di Lobi ditutup rapat.'
        : 'Mode Privasi Lobi Ketat dinonaktifkan sementara. Demi keamanan dari orang asing, sangat disarankan untuk selalu mengaktifkannya.'
    );
  };

  return (
    <div className="bg-slate-900/95 border-2 border-emerald-500/45 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-[10px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>PROTEKSI LOBI DAFTAR &amp; LOGIN ANTI-CURI</span>
          </span>
          <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mode Privasi Lobi Ketat (Zero-Leak Anti-Intip)</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
            Melindungi nasabah baru ketika kartu disetujui Admin agar tidak ada pemberitahuan, nomor rekening, atau tombol masuk langsung yang muncul di Lobi perangkat bersama.
          </p>
        </div>

        <label className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-950 border border-emerald-400/50 cursor-pointer shrink-0 select-none">
          <input
            type="checkbox"
            checked={policy.strictLobbyPrivacyMode}
            onChange={(e) => handleToggleStrictMode(e.target.checked)}
            className="w-4 h-4 accent-emerald-400 cursor-pointer"
          />
          <span
            className={`text-xs font-black whitespace-nowrap ${
              policy.strictLobbyPrivacyMode ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {policy.strictLobbyPrivacyMode ? 'Privasi Ketat: AKTIF' : 'Privasi Ketat: NONAKTIF'}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
            <EyeOff className="w-3.5 h-3.5 shrink-0" />
            <span>Nol Banner Persetujuan</span>
          </div>
          <p className="text-slate-400 leading-snug">
            Banner &ldquo;Kartu Disetujui Admin&rdquo; dan tombol masuk instan dihapus total dari Lobi.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Wajib Login PIN Manual</span>
          </div>
          <p className="text-slate-400 leading-snug">
            Auto-masuk dimatikan total. Pemilik wajib masuk manual pakai No. Rek, ID 16 Digit &amp; PIN.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <BellOff className="w-3.5 h-3.5 shrink-0" />
            <span>Blokir Push &amp; Suara Lobi</span>
          </div>
          <p className="text-slate-400 leading-snug">
            Semua notifikasi push, toast mengambang, dan efek suara diblokir selama belum login PIN.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-purple-300">
            <KeyRound className="w-3.5 h-3.5 shrink-0" />
            <span>Lupa PIN Terverifikasi</span>
          </div>
          <p className="text-slate-400 leading-snug">
            PIN hasil persetujuan Admin tersembunyi sampai pemilik memverifikasi NIK &amp; No. HP/ID.
          </p>
        </div>
      </div>

      {!policy.strictLobbyPrivacyMode && (
        <div className="p-3 rounded-2xl bg-rose-950/75 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Peringatan: Proteksi Lobi Ketat sedang dimatikan. Aktifkan kembali agar notifikasi pra-login tetap tertutup rapat.
          </span>
        </div>
      )}

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-950/75 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
