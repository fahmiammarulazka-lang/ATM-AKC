/**
 * Bank Nusantara — 25 Preset Peringatan Buatan Sistem, Galeri Ikon Vektor, dan Tema Warna
 */
import {
  AdminSystemWarningPreset,
  AdminWarningCategory,
  AdminWarningColorTheme,
  AdminWarningIconKey,
} from '../types/bank';

export const ADMIN_WARNING_CATEGORIES: Array<{
  key: 'all' | AdminWarningCategory;
  label: string;
}> = [
  { key: 'all', label: 'Semua (25)' },
  { key: 'perbaikan', label: 'Perbaikan' },
  { key: 'update', label: 'Update Fitur' },
  { key: 'keamanan', label: 'Keamanan' },
  { key: 'jaringan', label: 'Gangguan Jaringan' },
  { key: 'promo', label: 'Promo' },
  { key: 'pengumuman', label: 'Pengumuman' },
];

export const ADMIN_WARNING_ICON_OPTIONS: Array<{
  key: AdminWarningIconKey;
  label: string;
}> = [
  { key: 'wrench', label: 'Perbaikan' },
  { key: 'alert-triangle', label: 'Peringatan' },
  { key: 'shield-alert', label: 'Keamanan' },
  { key: 'info', label: 'Informasi' },
  { key: 'megaphone', label: 'Pengumuman' },
  { key: 'sparkles', label: 'Fitur Baru' },
  { key: 'wifi-off', label: 'Jaringan' },
  { key: 'server-crash', label: 'Server' },
  { key: 'lock', label: 'Terkunci' },
  { key: 'bell-ring', label: 'Notifikasi' },
  { key: 'clock', label: 'Jadwal' },
  { key: 'gift', label: 'Promo' },
  { key: 'ban', label: 'Pembatasan' },
  { key: 'check-circle', label: 'Normal' },
  { key: 'bug', label: 'Perbaikan Bug' },
  { key: 'zap', label: 'Cepat / Kilat' },
];

export const ADMIN_WARNING_THEME_OPTIONS: Array<{
  key: AdminWarningColorTheme;
  label: string;
  swatchClass: string;
  bannerClass: string;
  popupBorderClass: string;
  iconBgClass: string;
  accentTextClass: string;
  buttonClass: string;
}> = [
  {
    key: 'amber',
    label: 'Amber (Perbaikan)',
    swatchClass: 'bg-amber-500',
    bannerClass: 'bg-amber-950/95 border-amber-500/60 text-amber-100',
    popupBorderClass: 'border-amber-500/60',
    iconBgClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    accentTextClass: 'text-amber-300',
    buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
  },
  {
    key: 'rose',
    label: 'Merah (Kritis)',
    swatchClass: 'bg-rose-500',
    bannerClass: 'bg-rose-950/95 border-rose-500/60 text-rose-100',
    popupBorderClass: 'border-rose-500/60',
    iconBgClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    accentTextClass: 'text-rose-300',
    buttonClass: 'bg-rose-500 hover:bg-rose-400 text-white',
  },
  {
    key: 'sky',
    label: 'Biru (Info)',
    swatchClass: 'bg-sky-500',
    bannerClass: 'bg-sky-950/95 border-sky-500/60 text-sky-100',
    popupBorderClass: 'border-sky-500/60',
    iconBgClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    accentTextClass: 'text-sky-300',
    buttonClass: 'bg-sky-500 hover:bg-sky-400 text-slate-950',
  },
  {
    key: 'emerald',
    label: 'Hijau (Promo/Normal)',
    swatchClass: 'bg-emerald-500',
    bannerClass: 'bg-emerald-950/95 border-emerald-500/60 text-emerald-100',
    popupBorderClass: 'border-emerald-500/60',
    iconBgClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    accentTextClass: 'text-emerald-300',
    buttonClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
  },
  {
    key: 'indigo',
    label: 'Indigo (Update)',
    swatchClass: 'bg-indigo-500',
    bannerClass: 'bg-indigo-950/95 border-indigo-500/60 text-indigo-100',
    popupBorderClass: 'border-indigo-500/60',
    iconBgClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    accentTextClass: 'text-indigo-300',
    buttonClass: 'bg-indigo-500 hover:bg-indigo-400 text-white',
  },
  {
    key: 'slate',
    label: 'Netral (Resmi)',
    swatchClass: 'bg-slate-400',
    bannerClass: 'bg-slate-900/95 border-slate-600 text-slate-100',
    popupBorderClass: 'border-slate-600',
    iconBgClass: 'bg-slate-800 text-slate-200 border-slate-600',
    accentTextClass: 'text-slate-200',
    buttonClass: 'bg-slate-200 hover:bg-white text-slate-950',
  },
];

export function getAdminWarningThemeMeta(theme: AdminWarningColorTheme) {
  return (
    ADMIN_WARNING_THEME_OPTIONS.find((t) => t.key === theme) || ADMIN_WARNING_THEME_OPTIONS[0]
  );
}

/**
 * 25 Preset Peringatan Buatan Sistem (6 Kategori)
 */
export const ADMIN_WARNING_PRESETS_25: AdminSystemWarningPreset[] = [
  // 1-5: PERBAIKAN
  {
    id: 'preset-01',
    category: 'perbaikan',
    name: 'Perbaikan Sistem Umum',
    title: 'Aplikasi Sedang Dalam Perbaikan',
    message:
      'Tim teknis sedang melakukan pemeliharaan dan penyempurnaan sistem. Beberapa layanan mungkin mengalami jeda singkat hingga perbaikan selesai.',
    iconKey: 'wrench',
    colorTheme: 'amber',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: true,
    suggestedShowPermanentLabel: true,
    suggestedDismissible: false,
  },
  {
    id: 'preset-02',
    category: 'perbaikan',
    name: 'Maintenance Server Inti',
    title: 'Pemeliharaan Server Inti Berlangsung',
    message:
      'Kami sedang meningkatkan kapasitas server utama agar transaksi lebih stabil. Mohon tunggu beberapa saat sebelum melakukan transaksi bernominal besar.',
    iconKey: 'server-crash',
    colorTheme: 'amber',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: true,
    suggestedShowPermanentLabel: true,
    suggestedDismissible: true,
  },
  {
    id: 'preset-03',
    category: 'perbaikan',
    name: 'Perbaikan Jalur QRIS',
    title: 'Pemeliharaan Layanan Pembayaran QRIS',
    message:
      'Sistem pembayaran QRIS sedang menjalani kalibrasi rutin. Apabila pembayaran Anda masih berstatus menunggu, saldo akan otomatis masuk setelah sinkronisasi selesai.',
    iconKey: 'wrench',
    colorTheme: 'amber',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-04',
    category: 'perbaikan',
    name: 'Perbaikan Bug Tampilan',
    title: 'Perbaikan Bug & Stabilitas Aplikasi',
    message:
      'Kami sedang menerapkan tambalan untuk kendala tampilan yang dilaporkan nasabah. Muat ulang halaman setelah perbaikan rampung agar perubahan langsung aktif.',
    iconKey: 'bug',
    colorTheme: 'indigo',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-05',
    category: 'perbaikan',
    name: 'Maintenance Darurat Terkunci',
    title: 'Pemeliharaan Darurat Sedang Aktif',
    message:
      'Akses transaksi sementara dibatasi untuk menjaga keamanan data seluruh rekening. Peringatan ini akan dicabut otomatis begitu sistem kembali normal.',
    iconKey: 'lock',
    colorTheme: 'rose',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: true,
    suggestedShowPermanentLabel: true,
    suggestedDismissible: false,
  },

  // 6-9: UPDATE FITUR
  {
    id: 'preset-06',
    category: 'update',
    name: 'Pembaruan Fitur Baru',
    title: 'Pembaruan Fitur Baru Telah Tersedia',
    message:
      'Nikmati peningkatan terbaru di Bank Nusantara! Cek tab Update untuk melihat daftar lengkap fitur baru dan penyempurnaan sistem hari ini.',
    iconKey: 'sparkles',
    colorTheme: 'indigo',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-07',
    category: 'update',
    name: 'Peningkatan Kecepatan Sistem',
    title: 'Peningkatan Performa & Sinkronisasi',
    message:
      'Kami baru saja mengoptimalkan jalur sinkronisasi real-time agar perpindahan saldo, mutasi, dan notifikasi berjalan lebih cepat di semua perangkat.',
    iconKey: 'zap',
    colorTheme: 'sky',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-08',
    category: 'update',
    name: 'Pembaruan Katalog Toko',
    title: 'Pembaruan Katalog & Input Harga Custom',
    message:
      'Kini Anda dapat membeli berdasarkan jumlah maupun nominal Rupiah secara langsung dengan kalkulasi instan di menu Toko.',
    iconKey: 'sparkles',
    colorTheme: 'sky',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-09',
    category: 'update',
    name: 'Pembaruan Menu Profil',
    title: 'Tampilan Statistik Profil Baru',
    message:
      'Klik ikon profil di pojok kanan atas untuk melihat ringkasan lengkap aset, transaksi, progres level karir, keluarga, dan status keamanan akun Anda.',
    iconKey: 'info',
    colorTheme: 'indigo',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },

  // 10-14: KEAMANAN
  {
    id: 'preset-10',
    category: 'keamanan',
    name: 'Jaga Kerahasiaan PIN',
    title: 'Peringatan Keamanan: Jaga PIN Anda',
    message:
      'Jangan pernah membagikan 6 digit PIN kartu atau akses akun Google Anda kepada siapa pun. Administrator resmi tidak pernah meminta PIN nasabah.',
    iconKey: 'shield-alert',
    colorTheme: 'rose',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: true,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-11',
    category: 'keamanan',
    name: 'Waspada Akun & Tautan Palsu',
    title: 'Waspada Penipuan & Tautan Tidak Resmi',
    message:
      'Pastikan Anda hanya mengakses Bank Nusantara melalui alamat resmi. Abaikan pesan pihak tidak dikenal yang menjanjikan saldo gratis di luar aplikasi.',
    iconKey: 'alert-triangle',
    colorTheme: 'rose',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-12',
    category: 'keamanan',
    name: 'Tautkan Email Google',
    title: 'Segera Hubungkan Akun ke Google Cloud',
    message:
      'Demi mencegah kehilangan data saat berganti perangkat, pastikan akun Anda sudah tertaut dengan email Google melalui menu Profil.',
    iconKey: 'lock',
    colorTheme: 'amber',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-13',
    category: 'keamanan',
    name: 'Audit Aktivitas Rekening',
    title: 'Pemeriksaan Keamanan Rutin Sedang Berjalan',
    message:
      'Sistem keamanan sedang memverifikasi integritas transaksi terbaru. Pastikan seluruh mutasi pada akun Anda dikenali dan sesuai.',
    iconKey: 'shield-alert',
    colorTheme: 'amber',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-14',
    category: 'keamanan',
    name: 'Peringatan Pelanggaran Aturan',
    title: 'Peringatan Kepatuhan Penggunaan Layanan',
    message:
      'Terdeteksi aktivitas tidak wajar pada sebagian akun. Mohon patuhi ketentuan penggunaan layanan agar status kartu Anda tetap aktif tanpa pembatasan.',
    iconKey: 'ban',
    colorTheme: 'rose',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: true,
    suggestedShowPermanentLabel: true,
    suggestedDismissible: true,
  },

  // 15-18: GANGGUAN JARINGAN
  {
    id: 'preset-15',
    category: 'jaringan',
    name: 'Gangguan Koneksi Sementara',
    title: 'Gangguan Koneksi Server Terdeteksi',
    message:
      'Sebagian perangkat mungkin mengalami keterlambatan respon saat memuat data. Tim kami sedang memulihkan stabilitas jalur koneksi.',
    iconKey: 'wifi-off',
    colorTheme: 'amber',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: true,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-16',
    category: 'jaringan',
    name: 'Sinkronisasi Real-Time Melambat',
    title: 'Antrean Sinkronisasi Sedang Padat',
    message:
      'Trafik pengguna sedang tinggi sehingga pembaruan mutasi antar perangkat membutuhkan beberapa detik lebih lama. Data Anda tetap tercatat aman.',
    iconKey: 'clock',
    colorTheme: 'amber',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-17',
    category: 'jaringan',
    name: 'Koneksi Gateway Pembayaran',
    title: 'Gangguan Sementara Verifikasi QRIS',
    message:
      'Koneksi ke penyedia pembayaran sedang mengalami lonjakan trafik. Jika status belum berubah setelah bayar, tunggu 1–2 menit lalu tekan Cek Status.',
    iconKey: 'wifi-off',
    colorTheme: 'rose',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-18',
    category: 'jaringan',
    name: 'Pemulihan Jaringan Selesai',
    title: 'Koneksi & Layanan Kembali Normal',
    message:
      'Gangguan jaringan sebelumnya telah teratasi sepenuhnya. Seluruh layanan transaksi dan sinkronisasi real-time kini kembali berjalan optimal.',
    iconKey: 'check-circle',
    colorTheme: 'emerald',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },

  // 19-21: PROMO
  {
    id: 'preset-19',
    category: 'promo',
    name: 'Promo Diskon Toko Aktif',
    title: 'Promo Diskon Spesial Sedang Berlangsung!',
    message:
      'Manfaatkan potongan harga aktif di menu Toko sekarang juga. Pembelian custom dengan budget yang sama kini menghasilkan lebih banyak saldo.',
    iconKey: 'gift',
    colorTheme: 'emerald',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-20',
    category: 'promo',
    name: 'Event Kode Redeem & Hadiah',
    title: 'Event Kode Redeem & Hadiah Nasabah',
    message:
      'Pantau pengumuman terbaru dan segera tukarkan kode redeem spesial di tab Kode Redeem sebelum kuota habis!',
    iconKey: 'gift',
    colorTheme: 'indigo',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-21',
    category: 'promo',
    name: 'Penawaran Waktu Terbatas',
    title: 'Flash Promo Hari Ini — Jangan Lewatkan',
    message:
      'Harga spesial dan bonus event hanya berlaku dalam waktu terbatas hari ini. Cek segera di halaman Toko dan Spin the Wheel.',
    iconKey: 'zap',
    colorTheme: 'emerald',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },

  // 22-25: PENGUMUMAN
  {
    id: 'preset-22',
    category: 'pengumuman',
    name: 'Pengumuman Resmi Admin',
    title: 'Pengumuman Resmi Administrator',
    message:
      'Harap perhatikan informasi resmi dari tim pengelola Bank Nusantara. Pastikan Anda selalu membaca pengumuman terbaru sebelum bertransaksi.',
    iconKey: 'megaphone',
    colorTheme: 'sky',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-23',
    category: 'pengumuman',
    name: 'Perubahan Batas Transaksi',
    title: 'Informasi Penyesuaian Batas Pembelian',
    message:
      'Batas maksimal pembelian saat ini ditetapkan hingga 11.099 dengan harga dasar maksimal Rp 998.910 agar proses verifikasi QRIS lebih lancar.',
    iconKey: 'info',
    colorTheme: 'sky',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-24',
    category: 'pengumuman',
    name: 'Jadwal Pemeliharaan Berkala',
    title: 'Pemberitahuan Jadwal Pemeliharaan Mendatang',
    message:
      'Sistem akan menjalani pemeliharaan rutin terjadwal demi peningkatan kualitas layanan. Mohon selesaikan transaksi penting Anda sebelumnya.',
    iconKey: 'clock',
    colorTheme: 'slate',
    suggestedDisplayMode: 'banner',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
  {
    id: 'preset-25',
    category: 'pengumuman',
    name: 'Apresiasi & Terima Kasih',
    title: 'Terima Kasih Telah Menggunakan Bank Nusantara',
    message:
      'Kami sangat menghargai dukungan dan masukan Anda. Laporkan kendala kapan saja melalui menu Bantuan agar layanan kami terus berkembang.',
    iconKey: 'bell-ring',
    colorTheme: 'emerald',
    suggestedDisplayMode: 'popup',
    suggestedPermanent: false,
    suggestedShowPermanentLabel: false,
    suggestedDismissible: true,
  },
];
