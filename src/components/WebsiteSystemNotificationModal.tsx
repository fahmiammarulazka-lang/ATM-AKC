/**
 * Website System Notification Modal & Global Admin Chat Alert ("Pesan dari Admin" di Semua HP)
 */
import React from 'react';
import {
  Unlock,
  CheckCircle2,
  X,
  ShieldCheck,
  CreditCard,
  Megaphone,
  MessageSquare,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { VerifiedBadge } from './VerifiedBadge';

export const WebsiteSystemNotificationModal: React.FC = () => {
  const {
    activeWebsitePopups,
    dismissWebsitePopup,
    dismissAllWebsitePopups,
    accounts,
    setIsGlobalChatModalOpen,
  } = useBank();

  if (!activeWebsitePopups || activeWebsitePopups.length === 0) return null;

  const currentPopup = activeWebsitePopups[0];
  const relatedAccount = currentPopup.accountId
    ? accounts.find((a) => a.id === currentPopup.accountId)
    : undefined;

  const isUnban = currentPopup.type === 'unban';
  const isVerified = currentPopup.type === 'verified';
  const isAdminChat = currentPopup.type === 'admin_chat';

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div
        className={`relative max-w-md w-full rounded-3xl p-6 shadow-2xl border-2 text-white overflow-hidden ${
          isAdminChat
            ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950 border-amber-400 shadow-amber-500/30'
            : isUnban
            ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-emerald-400 shadow-emerald-500/30'
            : isVerified
            ? 'bg-gradient-to-br from-sky-950 via-slate-900 to-blue-950 border-sky-400 shadow-sky-500/30'
            : 'bg-gradient-to-br from-amber-950 via-slate-900 to-indigo-950 border-amber-400 shadow-amber-500/30'
        }`}
      >
        {/* Decorative background glow */}
        <div
          className={`absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
            isAdminChat
              ? 'bg-amber-500/30'
              : isUnban
              ? 'bg-emerald-500/25'
              : isVerified
              ? 'bg-sky-500/25'
              : 'bg-amber-500/25'
          }`}
        />

        {/* Top System Website Badge & Close Button */}
        <div className="relative z-10 flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-400/40">
              {isAdminChat
                ? '💬 CHAT GLOBAL • TAMPIL DI SEMUA HP'
                : '🌐 NOTIFIKASI SISTEM WEBSITE BANK NUSANTARA'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => dismissWebsitePopup(currentPopup.id)}
            title="Tutup Notifikasi"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/30 text-slate-200 hover:text-white border border-white/15 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold px-2.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Tutup</span>
          </button>
        </div>

        {/* Main Icon & Title */}
        <div className="relative z-10 flex items-start gap-3.5 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg ${
              isAdminChat
                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                : isUnban
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                : isVerified
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-300'
                : 'bg-amber-500/20 border-amber-400/60 text-amber-300'
            }`}
          >
            {isAdminChat ? (
              <MessageSquare className="w-6 h-6 text-amber-300" />
            ) : isUnban ? (
              <Unlock className="w-6 h-6" />
            ) : isVerified ? (
              <VerifiedBadge size="lg" />
            ) : (
              <Megaphone className="w-6 h-6" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 block font-bold">
              {isAdminChat ? 'SIARAN LANGSUNG CHAT GLOBAL ADMIN' : currentPopup.subtitle}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-snug mt-0.5 flex items-center gap-2">
              <span>{isAdminChat ? 'Pesan dari Admin' : currentPopup.title}</span>
              {isAdminChat && <VerifiedBadge size="md" />}
            </h3>
            {isAdminChat && (
              <span className="text-[11px] text-sky-300 font-semibold block mt-0.5">
                Dikirim oleh: {currentPopup.senderName || 'Admin Bank Nusantara'} ☑️
              </span>
            )}
          </div>
        </div>

        {/* Card / Account Details Box (for non-admin_chat or when specific account is attached) */}
        {!isAdminChat && currentPopup.accountName && (
          <div className="relative z-10 p-3.5 rounded-2xl bg-slate-950/90 border border-white/15 mb-4 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Informasi Kartu ATM:</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold text-[10px]">
                {isUnban ? '🔓 STATUS: TERBUKA & AKTIF' : '✓ AKTIF'}
              </span>
            </div>
            <div className="font-bold text-white text-sm flex items-center gap-1.5">
              <span>{currentPopup.accountName}</span>
              {(relatedAccount?.isVerified || isVerified) && <VerifiedBadge size="sm" />}
            </div>
            {currentPopup.accountNumber && (
              <div className="font-mono text-xs text-amber-300">
                No. Rekening: <strong>{currentPopup.accountNumber}</strong>
              </div>
            )}
          </div>
        )}

        {/* Notification Message Body */}
        <div
          className={`relative z-10 p-4 rounded-2xl border leading-relaxed mb-5 ${
            isAdminChat
              ? 'bg-slate-950/95 border-amber-400/60 text-white text-sm sm:text-base font-bold shadow-inner'
              : 'bg-black/40 border-white/10 text-xs sm:text-sm text-slate-100'
          }`}
        >
          {isAdminChat && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-1.5 font-extrabold">
              💬 ISI PESAN DARI ADMIN:
            </span>
          )}
          <div className="whitespace-pre-wrap break-words">{currentPopup.message}</div>
        </div>

        {/* Action Buttons to Close / Open Global Chat */}
        <div className="relative z-10 space-y-2">
          {isAdminChat && (
            <button
              type="button"
              onClick={() => {
                dismissWebsitePopup(currentPopup.id);
                setIsGlobalChatModalOpen(true);
              }}
              className="w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-lg cursor-pointer transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Buka Ruang Chat Global & Balas Pesan</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => dismissWebsitePopup(currentPopup.id)}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              isUnban
                ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                : isVerified
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-300 text-slate-950 shadow-sky-500/25'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 text-slate-950 shadow-amber-500/25'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isAdminChat
                ? 'Mengerti & Tutup Pesan dari Admin'
                : isUnban
                ? 'Saya Sudah Tahu Kartu Saya Dibuka — Tutup Notifikasi'
                : 'Mengerti & Tutup Notifikasi Website'}
            </span>
          </button>

          {activeWebsitePopups.length > 1 && (
            <button
              type="button"
              onClick={dismissAllWebsitePopups}
              className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Tutup Semua ({activeWebsitePopups.length} Notifikasi)
            </button>
          )}
        </div>

        <div className="relative z-10 mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isAdminChat
                ? 'Tersinkronisasi Real-Time ke Semua HP'
                : 'Notifikasi Resmi Internal Website Bank Nusantara'}
            </span>
          </span>
          <span className="font-mono">
            {new Date(currentPopup.timestamp).toLocaleTimeString('id-ID')} WIB
          </span>
        </div>
      </div>
    </div>
  );
};

