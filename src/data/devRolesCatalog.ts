import { DevRoleBadgeColor, DevRoleConfig } from '../types/bank';

export const DEV_BADGE_COLOR_PALETTE: {
  id: DevRoleBadgeColor;
  label: string;
  pillClass: string;
  borderClass: string;
  quickBtnClass: string;
  dotClass: string;
}[] = [
  {
    id: 'amber',
    label: 'Emas Sultan',
    pillClass: 'bg-amber-400/20 text-amber-300 border-amber-400/60',
    borderClass: 'border-amber-400/60',
    quickBtnClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-amber-500/30',
    dotClass: 'bg-amber-400',
  },
  {
    id: 'orange',
    label: 'Oranye Api',
    pillClass: 'bg-orange-400/20 text-orange-300 border-orange-400/60',
    borderClass: 'border-orange-400/60',
    quickBtnClass: 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 text-slate-950 shadow-orange-500/30',
    dotClass: 'bg-orange-400',
  },
  {
    id: 'cyan',
    label: 'Cyan Neon',
    pillClass: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/60',
    borderClass: 'border-cyan-400/60',
    quickBtnClass: 'bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 text-slate-950 shadow-cyan-500/30',
    dotClass: 'bg-cyan-400',
  },
  {
    id: 'indigo',
    label: 'Indigo Royal',
    pillClass: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/60',
    borderClass: 'border-indigo-400/60',
    quickBtnClass: 'bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 text-slate-950 shadow-indigo-500/30',
    dotClass: 'bg-indigo-400',
  },
  {
    id: 'rose',
    label: 'Merah Crimson',
    pillClass: 'bg-rose-500/20 text-rose-300 border-rose-400/60',
    borderClass: 'border-rose-400/60',
    quickBtnClass: 'bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 text-slate-950 shadow-rose-500/30',
    dotClass: 'bg-rose-400',
  },
  {
    id: 'purple',
    label: 'Ungu VIP',
    pillClass: 'bg-purple-500/20 text-purple-300 border-purple-400/60',
    borderClass: 'border-purple-400/60',
    quickBtnClass: 'bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 text-slate-950 shadow-purple-500/30',
    dotClass: 'bg-purple-400',
  },
  {
    id: 'emerald',
    label: 'Hijau Zamrud',
    pillClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60',
    borderClass: 'border-emerald-400/60',
    quickBtnClass: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 shadow-emerald-500/30',
    dotClass: 'bg-emerald-400',
  },
  {
    id: 'teal',
    label: 'Teal Cyber',
    pillClass: 'bg-teal-500/20 text-teal-300 border-teal-400/60',
    borderClass: 'border-teal-400/60',
    quickBtnClass: 'bg-gradient-to-r from-teal-300 via-emerald-400 to-cyan-400 text-slate-950 shadow-teal-500/30',
    dotClass: 'bg-teal-400',
  },
  {
    id: 'sky',
    label: 'Biru Langit',
    pillClass: 'bg-sky-500/20 text-sky-300 border-sky-400/60',
    borderClass: 'border-sky-400/60',
    quickBtnClass: 'bg-gradient-to-r from-sky-300 via-cyan-400 to-blue-400 text-slate-950 shadow-sky-500/30',
    dotClass: 'bg-sky-400',
  },
  {
    id: 'slate',
    label: 'Perak Eksekutif',
    pillClass: 'bg-slate-400/20 text-slate-200 border-slate-400/60',
    borderClass: 'border-slate-500/60',
    quickBtnClass: 'bg-gradient-to-r from-slate-200 via-zinc-300 to-slate-400 text-slate-950 shadow-slate-400/20',
    dotClass: 'bg-slate-300',
  },
];

export const getDevBadgeColorStyle = (color?: DevRoleBadgeColor) => {
  return (
    DEV_BADGE_COLOR_PALETTE.find((p) => p.id === color) ||
    DEV_BADGE_COLOR_PALETTE[0]
  );
};

export const DEFAULT_DEV_ROLES_10: DevRoleConfig[] = [
  {
    id: 'dev_1',
    slotNumber: 1,
    name: 'Founder & Owner',
    badgeColor: 'amber',
    canQuickOpenAdmin: true,
    bypassAdminPin: true,
    description: 'Pemegang kendali penuh sistem perbankan & akses cepat tanpa PIN.',
  },
  {
    id: 'dev_2',
    slotNumber: 2,
    name: 'Co-Owner',
    badgeColor: 'orange',
    canQuickOpenAdmin: true,
    bypassAdminPin: true,
    description: 'Wakil pemilik dengan otoritas penuh manajemen nasabah & event.',
  },
  {
    id: 'dev_3',
    slotNumber: 3,
    name: 'Chief Developer',
    badgeColor: 'cyan',
    canQuickOpenAdmin: true,
    bypassAdminPin: true,
    description: 'Kepala pengembang sistem dengan tombol lompat instan ke Panel Admin.',
  },
  {
    id: 'dev_4',
    slotNumber: 4,
    name: 'System Architect',
    badgeColor: 'indigo',
    canQuickOpenAdmin: true,
    bypassAdminPin: true,
    description: 'Arsitek fitur & konfigurasi keamanan perbankan digital.',
  },
  {
    id: 'dev_5',
    slotNumber: 5,
    name: 'Super Admin',
    badgeColor: 'rose',
    canQuickOpenAdmin: true,
    bypassAdminPin: true,
    description: 'Administrator utama untuk persetujuan cepat & Super Tools.',
  },
  {
    id: 'dev_6',
    slotNumber: 6,
    name: 'Head Admin',
    badgeColor: 'purple',
    canQuickOpenAdmin: true,
    bypassAdminPin: false,
    description: 'Kepala operasional admin (tombol cepat tampil, wajib PIN Admin).',
  },
  {
    id: 'dev_7',
    slotNumber: 7,
    name: 'Senior Moderator',
    badgeColor: 'emerald',
    canQuickOpenAdmin: true,
    bypassAdminPin: false,
    description: 'Moderator senior pengawas transaksi, PayChat, dan laporan bug.',
  },
  {
    id: 'dev_8',
    slotNumber: 8,
    name: 'Security Ops',
    badgeColor: 'teal',
    canQuickOpenAdmin: true,
    bypassAdminPin: false,
    description: 'Tim keamanan kartu, ban/unban, serta reset PIN nasabah.',
  },
  {
    id: 'dev_9',
    slotNumber: 9,
    name: 'Finance Auditor',
    badgeColor: 'sky',
    canQuickOpenAdmin: true,
    bypassAdminPin: false,
    description: 'Auditor mutasi, pinjaman, emas 24K, dan saldo brankas ATM.',
  },
  {
    id: 'dev_10',
    slotNumber: 10,
    name: 'Support Staff',
    badgeColor: 'slate',
    canQuickOpenAdmin: true,
    bypassAdminPin: false,
    description: 'Staf dukungan layanan nasabah dengan akses cepat ber-PIN.',
  },
];
