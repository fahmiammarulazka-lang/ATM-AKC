import React, { useState } from 'react';
import {
  Crown,
  Zap,
  Lock,
  Unlock,
  RotateCcw,
  Users,
  CheckCircle2,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { DEV_BADGE_COLOR_PALETTE, getDevBadgeColorStyle } from '../data/devRolesCatalog';
import { DevRoleBadgeColor } from '../types/bank';

export const AdminDevRolesPanel: React.FC = () => {
  const {
    accounts,
    devRoles,
    adminUpdateDevRole,
    adminResetDevRoles,
    adminAssignAccountDevRole,
  } = useBank();

  const [feedback, setFeedback] = useState<string>('');
  const [accountQuery, setAccountQuery] = useState<string>('');

  const filteredAccounts = accounts.filter((acc) => {
    const q = accountQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.accountNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-cyan-950/80 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>MANAJEMEN 10 ROLE DEV / OWNER / ADMIN &amp; TOMBOL CEPAT</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Atur 10 Nama Role Dev, Warna Badge &amp; Tombol Cepat Panel Admin
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Kustomisasi nama ke-10 role (seperti Owner, Co-Owner, Chief Dev, Super Admin, Moderator, dll.), warna badge, izin tombol akses cepat di Navbar &amp; Dashboard, serta aturan bebas PIN atau wajib PIN per role.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const res = adminResetDevRoles();
              setFeedback(res.message);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-amber-300 font-black cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset 10 Role ke Bawaan</span>
          </button>
        </div>

        {feedback && (
          <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-400/60 text-emerald-200 font-bold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
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

      {/* 10 Role Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {devRoles.map((role) => {
          const style = getDevBadgeColorStyle(role.badgeColor);
          const assignedCount = accounts.filter((a) => a.devRoleId === role.id).length;

          return (
            <div
              key={role.id}
              className={`p-5 rounded-3xl bg-slate-900/95 border-2 ${style.borderClass} shadow-xl space-y-3.5`}
            >
              {/* Role Header Preview */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono font-black text-slate-300 text-[11px] tabular-nums">
                    Slot #{role.slotNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full border font-black text-[11px] flex items-center gap-1.5 ${style.pillClass}`}
                  >
                    <Crown className="w-3 h-3" />
                    <span>{role.name}</span>
                  </span>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 font-mono text-[10px] font-bold tabular-nums">
                  {assignedCount} Akun Terpasang
                </span>
              </div>

              {/* Custom Role Name Input */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Nama Role #{role.slotNumber} (Bisa Diganti Bebas)
                </label>
                <input
                  type="text"
                  value={role.name}
                  onChange={(e) => {
                    adminUpdateDevRole(role.id, { name: e.target.value });
                  }}
                  placeholder={`Nama Role #${role.slotNumber}`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 text-white font-bold text-xs outline-none"
                />
              </div>

              {/* Color Badge Picker */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  Warna Badge &amp; Tombol Cepat ({style.label})
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {DEV_BADGE_COLOR_PALETTE.map((palette) => (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => {
                        adminUpdateDevRole(role.id, {
                          badgeColor: palette.id as DevRoleBadgeColor,
                        });
                        setFeedback(`Warna role "${role.name}" diubah ke ${palette.label}.`);
                      }}
                      title={palette.label}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer flex items-center gap-1.5 transition-all ${
                        role.badgeColor === palette.id
                          ? 'bg-slate-800 border-white text-white scale-105'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${palette.dotClass}`} />
                      <span className="hidden sm:inline">{palette.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Access & PIN Mode & Auto-Approve Switches */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    adminUpdateDevRole(role.id, {
                      canQuickOpenAdmin: !role.canQuickOpenAdmin,
                    });
                    setFeedback(
                      `Tombol cepat Panel Admin untuk "${role.name}" ${
                        !role.canQuickOpenAdmin ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'
                      }.`
                    );
                  }}
                  className={`p-2.5 rounded-xl border font-bold text-[11px] cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    role.canQuickOpenAdmin
                      ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Tombol Cepat</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-[9px] shrink-0">
                    {role.canQuickOpenAdmin ? 'AKTIF' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    adminUpdateDevRole(role.id, {
                      bypassAdminPin: !role.bypassAdminPin,
                    });
                    setFeedback(
                      `Mode masuk "${role.name}": ${
                        !role.bypassAdminPin ? 'Bebas PIN (Langsung Masuk)' : 'Wajib PIN Admin'
                      }.`
                    );
                  }}
                  className={`p-2.5 rounded-xl border font-bold text-[11px] cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    role.bypassAdminPin
                      ? 'bg-cyan-950/60 border-cyan-400/60 text-cyan-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {role.bypassAdminPin ? (
                      <Unlock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="truncate">Otorisasi PIN</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-[9px] shrink-0">
                    {role.bypassAdminPin ? 'BEBAS' : 'WAJIB'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    adminUpdateDevRole(role.id, {
                      autoApproveAccount: !role.autoApproveAccount,
                    });
                    setFeedback(
                      `Aturan persetujuan role "${role.name}": ${
                        !role.autoApproveAccount ? 'Tanpa Persetujuan (Langsung Aktif)' : 'Wajib Persetujuan Admin'
                      }.`
                    );
                  }}
                  className={`p-2.5 rounded-xl border font-bold text-[11px] cursor-pointer flex items-center justify-between gap-2 transition-all ${
                    role.autoApproveAccount
                      ? 'bg-emerald-950/60 border-emerald-400/60 text-emerald-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Tanpa ACC</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 font-mono text-[9px] shrink-0">
                    {role.autoApproveAccount ? 'OTOMATIS' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Role to Customer Accounts */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span>Pasang Role Dev/Own/Admin ke Akun Nasabah ({accounts.length} Akun)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Akun yang diberi Role Dev aktif akan langsung melihat Badge Role dan tombol cepat buka Panel Admin di Navbar atas serta Dashboard utama.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={accountQuery}
              onChange={(e) => setAccountQuery(e.target.value)}
              placeholder="Cari nama atau no. rekening..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {filteredAccounts.map((acc) => {
            const activeRole = devRoles.find((r) => r.id === acc.devRoleId) || null;
            const badgeStyle = activeRole ? getDevBadgeColorStyle(activeRole.badgeColor) : null;

            return (
              <div
                key={acc.id}
                className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  activeRole
                    ? `bg-slate-950 ${badgeStyle?.borderClass}`
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-black text-white text-xs truncate">{acc.fullName}</span>
                    {activeRole && badgeStyle ? (
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-black inline-flex items-center gap-1 ${badgeStyle.pillClass}`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span>{activeRole.name}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                        Nasabah Biasa
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block tabular-nums">
                    {acc.accountNumber} • {acc.cardTier.toUpperCase()}
                  </span>
                </div>

                <select
                  value={acc.devRoleId || ''}
                  onChange={(e) => {
                    const nextRoleId = e.target.value || null;
                    const res = adminAssignAccountDevRole(acc.id, nextRoleId);
                    setFeedback(res.message);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-[11px] cursor-pointer shrink-0"
                >
                  <option value="">-- Nasabah Biasa (Tanpa Role) --</option>
                  {devRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      #{r.slotNumber} • {r.name} ({r.bypassAdminPin ? 'Bebas PIN' : 'Wajib PIN'})
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
