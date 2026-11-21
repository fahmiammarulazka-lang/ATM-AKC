import { SupportContactConfig, SupportFaqCategory, SupportFaqItem } from '../types/bank';
import {
  DEFAULT_SUPPORT_PRESET_CATEGORIES,
  cloneDefaultPresetCategories,
  getResolvedPresetCategories,
  combineSubOptionExplanations,
} from './supportPresetCatalog';
import {
  buildRandomized350SupportFaqs,
  shuffleSupportFaqsList,
  ensureUpgraded350SupportFaqs,
} from './supportFaq350Generator';

export {
  DEFAULT_SUPPORT_PRESET_CATEGORIES,
  cloneDefaultPresetCategories,
  getResolvedPresetCategories,
  combineSubOptionExplanations,
  shuffleSupportFaqsList,
  ensureUpgraded350SupportFaqs,
};

export interface SupportFaqCategoryMeta {
  id: SupportFaqCategory;
  label: string;
  shortLabel: string;
  description: string;
  accentClass: string;
}

export const SUPPORT_FAQ_CATEGORIES: SupportFaqCategoryMeta[] = [
  {
    id: 'akun',
    label: 'Pengelolaan Akun & Profil',
    shortLabel: 'Akun & Profil',
    description: 'Pendaftaran, login Google/Buat Akun/OA/Guest, alamat 38 provinsi, sinkronisasi cloud, dan profil.',
    accentClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
  },
  {
    id: 'kartu',
    label: 'Penggunaan Kartu ATM & Tier',
    shortLabel: 'Kartu & Tier',
    description: 'Aktivasi kartu, saldo awal Rp 0, tier kartu, ubah/reset PIN, bekukan kartu, dan banding blokir.',
    accentClass: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
  },
  {
    id: 'atm',
    label: 'Operasional Mesin ATM & Tunai',
    shortLabel: 'Mesin ATM',
    description: 'Simulator ATM, tarik/setor tunai, token tanpa kartu, ganti PIN di ATM, dan struk digital.',
    accentClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
  },
  {
    id: 'pinjaman',
    label: 'Pinjaman Daring & Kotak Hutang',
    shortLabel: 'Pinjaman & Hutang',
    description: 'Pengajuan pinjaman daring, cicilan bulanan, pelunasan dipercepat, dan hitung mundur Kotak Hutang.',
    accentClass: 'text-violet-300 bg-violet-500/15 border-violet-500/40',
  },
  {
    id: 'keamanan',
    label: 'Keamanan, PIN & Privasi',
    shortLabel: 'Keamanan & PIN',
    description: 'Proteksi PIN/CVV, anti-phishing, VIP Shield, laporan bug, 10 notifikasi, dan darurat akun.',
    accentClass: 'text-rose-300 bg-rose-500/15 border-rose-500/40',
  },
  {
    id: 'transfer',
    label: 'Transfer Dana & Mutasi Rekening',
    shortLabel: 'Transfer & Mutasi',
    description: 'Transfer antar rekening, multi-kartu, nomor referensi mutasi, kantong tabungan, dan deposito.',
    accentClass: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
  },
  {
    id: 'emas',
    label: 'Investasi Emas 24K & Buyback',
    shortLabel: 'Emas 24K',
    description: 'Beli gramasi Emas 24K, jual/buyback ke Rupiah, transfer emas antar nasabah, dan cetak fisik.',
    accentClass: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/40',
  },
  {
    id: 'spin',
    label: 'Spin Wheel, Koin & Surat Hadiah',
    shortLabel: 'Spin & Hadiah',
    description: 'Putaran Spin the Wheel, Coin Nusantara, Kode Redeem, serta Amplop Surat & Kotak Hadiah Admin.',
    accentClass: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/40',
  },
  {
    id: 'oa_guest',
    label: 'Akun OA, Guest & Buat Akun Lobi',
    shortLabel: 'OA, Guest & Lobi',
    description: 'Panduan khusus Login Akun OA, Akun Guest Tanpa Alamat, dan Tab Buat Akun Tanpa Wajib Google.',
    accentClass: 'text-teal-300 bg-teal-500/15 border-teal-500/40',
  },
  {
    id: 'umum',
    label: 'Layanan Nasabah, Banned & Umum',
    shortLabel: 'Umum & Layanan',
    description: 'Contact Us 24 Jam, banding akun Banned, tabungan berjangka, dan informasi umum Bank Nusantara.',
    accentClass: 'text-slate-300 bg-slate-500/15 border-slate-500/40',
  },
];

export interface SupportContactTopicOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const SUPPORT_CONTACT_TOPICS: SupportContactTopicOption[] =
  DEFAULT_SUPPORT_PRESET_CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    shortLabel: cat.shortLabel,
    description: cat.description,
  }));

export const SUPPORT_TEMPLATE_VARIABLES: Array<{
  token: string;
  label: string;
  sample: string;
}> = [
  { token: '{nama}', label: 'Nama Lengkap', sample: 'Budi Santoso' },
  { token: '{no_rek}', label: 'No. Rekening', sample: '8829104421' },
  { token: '{user_id}', label: 'ID User 16 Digit', sample: '4029-8812-3301-9942' },
  { token: '{tier}', label: 'Tier Kartu', sample: 'GOLD' },
  { token: '{email}', label: 'Email Akun', sample: 'budi.santoso@gmail.com' },
  {
    token: '{domisili}',
    label: 'Alamat Domisili',
    sample: 'RT 003/RW 005, Kel. Menteng, Kec. Menteng, Jakarta Pusat, DKI Jakarta 10310',
  },
  { token: '{status_kartu}', label: 'Status Kartu', sample: 'AKTIF' },
  { token: '{topik}', label: 'Kategori Topik', sample: '2. Penggunaan Kartu ATM, Aktivasi & Upgrade Tier' },
  { token: '{sub_topik}', label: 'Sub-Pilihan Kendala', sample: 'Permohonan Persetujuan (Approval) Kartu Baru yang Masih Pending' },
  {
    token: '{penjelasan}',
    label: 'Penjelasan Kendala (Preset/Edit)',
    sample:
      'Kartu Bank Nusantara saya saat ini masih berstatus "Menunggu Persetujuan Admin" (Pending Approval). Seluruh data identitas dan alamat KTP sudah saya isi dengan benar. Mohon bantuan Tim Admin untuk meninjau dan menyetujui aktivasi kartu saya.',
  },
  { token: '{waktu}', label: 'Tanggal & Waktu', sample: '21 Nov 2026, 09:30 WIB' },
];

export const DEFAULT_SUPPORT_CONTACT_CONFIG: SupportContactConfig = {
  serviceName: 'Layanan Nasabah Resmi Bank Nusantara',
  whatsappNumber: '6281234567890',
  whatsappEnabled: true,
  whatsappAutoMessage: [
    'Halo Tim Layanan Nasabah & Admin Resmi PT Bank Nusantara (Persero) Tbk,',
    '',
    'Perkenalkan, saya nasabah aktif Bank Nusantara yang ingin mengajukan tiket bantuan resmi melalui layanan Contact Us.',
    '',
    '====================================',
    'RINGKASAN TIKET LAYANAN NASABAH',
    '====================================',
    '• Kategori Topik   : {topik}',
    '• Sub-Pilihan      : {sub_topik}',
    '• Waktu Pengajuan  : {waktu}',
    '',
    'DATA LENGKAP AKUN & REKENING',
    '• Nama Lengkap     : {nama}',
    '• Nomor Rekening   : {no_rek}',
    '• ID User 16 Digit : {user_id}',
    '• Jenis/Tier Kartu : {tier}',
    '• Status Kartu     : {status_kartu}',
    '• Alamat Email     : {email}',
    '• Alamat Domisili  : {domisili}',
    '',
    'PENJELASAN & KRONOLOGI KENDALA',
    '{penjelasan}',
    '',
    'Demikian laporan bantuan ini saya sampaikan dengan data yang sebenar-benarnya agar dapat segera ditindaklanjuti oleh Tim Admin Bank Nusantara.',
    'Atas perhatian, waktu, dan bantuannya saya ucapkan terima kasih.',
  ].join('\n'),
  emailAddress: 'cs@banknusantara.id',
  emailEnabled: true,
  emailAutoSubject: '[Tiket Bantuan Resmi Bank Nusantara] {topik} ({sub_topik}) — {nama} (Rek. {no_rek})',
  emailAutoBody: [
    'Yth. Tim Layanan Nasabah & Admin Resmi PT Bank Nusantara (Persero) Tbk,',
    '',
    'Dengan hormat,',
    'Melalui surat elektronik ini, saya bermaksud mengajukan permohonan bantuan/pengecekan layanan resmi pada akun Bank Nusantara milik saya.',
    '',
    '----------------------------------------------------------------',
    '1. RINGKASAN TIKET LAYANAN',
    '----------------------------------------------------------------',
    '- Kategori Topik Kendala : {topik}',
    '- Sub-Pilihan Spesifik   : {sub_topik}',
    '- Tanggal & Waktu Kirim  : {waktu}',
    '',
    '----------------------------------------------------------------',
    '2. IDENTITAS LENGKAP REKENING NASABAH',
    '----------------------------------------------------------------',
    '- Nama Pemilik Rekening  : {nama}',
    '- Nomor Rekening         : {no_rek}',
    '- ID User 16 Digit       : {user_id}',
    '- Jenis / Tier Kartu     : {tier}',
    '- Status Kartu Saat Ini  : {status_kartu}',
    '- Alamat Email Terdaftar : {email}',
    '- Alamat Domisili        : {domisili}',
    '',
    '----------------------------------------------------------------',
    '3. PENJELASAN & KRONOLOGI LENGKAP KENDALA',
    '----------------------------------------------------------------',
    '{penjelasan}',
    '',
    'Catatan Keamanan: Saya memahami bahwa pihak Bank Nusantara tidak pernah meminta kode PIN 6 Digit maupun kode CVV kartu.',
    '',
    'Demikian permohonan bantuan ini saya sampaikan. Besar harapan saya agar tiket ini dapat segera ditinjau dan diselesaikan. Atas kerja sama dan pelayanan terbaik dari PT Bank Nusantara (Persero) Tbk, saya ucapkan terima kasih.',
    '',
    'Hormat saya,',
    '{nama}',
    'No. Rekening: {no_rek}',
  ].join('\n'),
  operatingHours: '24 Jam Nonstop (Senin – Minggu)',
  responseEstimate: 'Rata-rata balas 1–5 menit',
  presetCategories: cloneDefaultPresetCategories(),
};

export function normalizeWhatsappNumber(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

export function formatWhatsappDisplay(raw: string): string {
  const normalized = normalizeWhatsappNumber(raw);
  if (!normalized) return 'Belum diatur Admin';
  if (normalized.startsWith('62') && normalized.length >= 10) {
    const rest = normalized.slice(2);
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  }
  return `+${normalized}`;
}

export interface SupportTemplateVars {
  nama: string;
  no_rek: string;
  user_id: string;
  tier: string;
  email?: string;
  domisili?: string;
  status_kartu?: string;
  topik: string;
  sub_topik?: string;
  penjelasan?: string;
  waktu: string;
}

export function interpolateSupportTemplate(
  template: string,
  vars: SupportTemplateVars
): string {
  const raw = String(template || '');
  const hasPenjelasanToken = /\{penjelasan\}/i.test(raw);
  const hasSubTopikToken = /\{sub_topik\}/i.test(raw);

  let result = raw
    .replace(/\{nama\}/gi, vars.nama || '-')
    .replace(/\{no_rek\}/gi, vars.no_rek || '-')
    .replace(/\{user_id\}/gi, vars.user_id || '-')
    .replace(/\{tier\}/gi, vars.tier || '-')
    .replace(/\{email\}/gi, vars.email?.trim() || 'Tidak terhubung / Akun Tanpa Email')
    .replace(/\{domisili\}/gi, vars.domisili?.trim() || 'Belum diisi / Akun Guest Tanpa Alamat')
    .replace(/\{status_kartu\}/gi, vars.status_kartu || 'AKTIF')
    .replace(/\{topik\}/gi, vars.topik || 'Bantuan Layanan')
    .replace(/\{sub_topik\}/gi, vars.sub_topik?.trim() || vars.topik || 'Bantuan Layanan')
    .replace(
      /\{penjelasan\}/gi,
      vars.penjelasan?.trim() ||
        'Saya ingin mengajukan permohonan bantuan dan pengecekan resmi pada rekening Bank Nusantara milik saya.'
    )
    .replace(/\{waktu\}/gi, vars.waktu || '-');

  // Jika template lama belum memiliki token {penjelasan} dan tidak sedang merender baris subjek pendek,
  // sisipkan sub-topik & penjelasan yang telah dipilih/diatur secara otomatis agar selalu muncul lengkap.
  if (!hasPenjelasanToken && raw.includes('\n') && vars.penjelasan?.trim()) {
    const subLine = !hasSubTopikToken && vars.sub_topik?.trim()
      ? `SUB-PILIHAN KENDALA:\n• ${vars.sub_topik.trim()}\n\n`
      : '';
    result = `${result}\n\n${subLine}PENJELASAN & KRONOLOGI KENDALA:\n${vars.penjelasan.trim()}`;
  }

  return result;
}

export function buildWhatsAppSupportUrl(
  config: SupportContactConfig,
  vars: SupportTemplateVars,
  extraNote?: string
): string {
  const phone = normalizeWhatsappNumber(config.whatsappNumber);
  if (!phone) return '';
  const baseText = interpolateSupportTemplate(config.whatsappAutoMessage, vars);
  const fullText = extraNote?.trim()
    ? `${baseText}\n\nCATATAN TAMBAHAN NASABAH:\n${extraNote.trim()}`
    : baseText;
  return `https://wa.me/${phone}?text=${encodeURIComponent(fullText)}`;
}

export function buildEmailSupportUrl(
  config: SupportContactConfig,
  vars: SupportTemplateVars,
  extraNote?: string
): string {
  const email = (config.emailAddress || '').trim();
  if (!email) return '';
  const subject = interpolateSupportTemplate(config.emailAutoSubject, vars);
  const baseBody = interpolateSupportTemplate(config.emailAutoBody, vars);
  const fullBody = extraNote?.trim()
    ? `${baseBody}\n\nCATATAN TAMBAHAN NASABAH:\n${extraNote.trim()}`
    : baseBody;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(fullBody)}`;
}

export const BASE_50_SUPPORT_FAQS: SupportFaqItem[] = [
  // ============================================================================
  // KATEGORI 1: PENGELOLAAN AKUN & PROFIL (FAQ #01 - #10)
  // ============================================================================
  {
    id: 'faq-01',
    category: 'akun',
    question: 'Bagaimana cara mendaftar akun baru di Bank Nusantara menggunakan akun Google?',
    answer:
      'Anda dapat mendaftar akun Bank Nusantara secara aman menggunakan tombol "Sign in with Google" di Lobi Awal. Akun Google berfungsi untuk mengikat kepemilikan rekening Anda ke penyimpanan Cloud sehingga seluruh saldo, kartu, dan riwayat transaksi dapat dibuka kembali dari perangkat mana saja.',
    steps: [
      'Buka halaman Lobi Awal Bank Nusantara dan pilih tombol "Sign in with Google".',
      'Pilih akun Google aktif Anda pada jendela verifikasi.',
      'Lengkapi data pendaftaran kartu seperti Nama Lengkap, NIK 16 Digit, Nomor HP, PIN Kartu 6 Digit, serta Alamat Wilayah lengkap (Provinsi hingga RT/RW).',
      'Klik tombol "Ajukan Kartu Baru" dan tunggu persetujuan Admin agar kartu berstatus Aktif.',
    ],
    tip: 'Pastikan alamat email Google yang dipilih adalah milik pribadi dan selalu aktif agar sinkronisasi lintas perangkat berjalan lancar.',
    keywords: ['daftar', 'registrasi', 'google', 'sign in', 'akun baru', 'lobi'],
    isActive: true,
  },
  {
    id: 'faq-02',
    category: 'akun',
    question: 'Bagaimana cara masuk menggunakan tombol "Login Ke Akun" tanpa Google?',
    answer:
      'Menu "Login Ke Akun" dirancang untuk masuk langsung ke seluruh jenis akun nasabah (baik akun Google yang sudah terdaftar, akun Biasa Tanpa Google buatan Admin, maupun akun Guest) menggunakan 3 kredensial resmi: Nomor Rekening, User ID 16 Digit, dan PIN Kartu 6 Digit. Menu ini tidak berlaku untuk Akun OA.',
    steps: [
      'Pada halaman Lobi Awal, pilih tombol "Login Ke Akun" yang berada tepat di atas tombol Akun OA.',
      'Masukkan Nomor Rekening Anda (tanpa spasi atau tanda strip).',
      'Masukkan User ID 16 Digit permanen milik akun Anda.',
      'Masukkan PIN Kartu 6 Digit, lalu klik tombol "Masuk ke Akun Sekarang".',
    ],
    tip: 'Simpan Nomor Rekening dan User ID 16 Digit Anda di catatan pribadi yang aman agar mudah login kapan pun dibutuhkan.',
    keywords: ['login ke akun', 'tanpa google', 'no rekening', 'user id', 'masuk'],
    isActive: true,
  },
  {
    id: 'faq-03',
    category: 'akun',
    question: 'Apa itu Akun OA dan bagaimana cara login ke Akun OA?',
    answer:
      'Akun OA (Official Admin / Otoritas Resmi) adalah akun khusus yang dibuat dan diberi otorisasi langsung oleh Panel Admin dengan lapisan verifikasi tambahan berupa PIN Admin OA 6 Digit. Akun OA hanya dapat diakses melalui pintu khusus "Login Dengan Akun OA".',
    steps: [
      'Buka Lobi Awal dan klik tab/tombol "Login Dengan Akun OA".',
      'Masukkan Nomor Rekening Akun OA dan User ID 16 Digit.',
      'Masukkan PIN Kartu 6 Digit serta PIN Admin OA 6 Digit yang diberikan Admin.',
      'Tekan tombol masuk untuk membuka Dashboard khusus Akun OA.',
    ],
    tip: 'Akun OA secara sengaja diblokir dari menu "Login Ke Akun" biasa untuk menjaga keamanan otoritas tinggi.',
    keywords: ['akun oa', 'official admin', 'pin admin oa', 'login oa'],
    isActive: true,
  },
  {
    id: 'faq-04',
    category: 'akun',
    question: 'Apa ketentuan pembuatan Akun Guest di Lobi Awal?',
    answer:
      'Akun Guest memungkinkan pengguna baru mencoba layanan Bank Nusantara dengan cepat tanpa perlu menautkan akun Google dan tanpa mengisi formulir alamat. Demi mencegah penyalahgunaan, di Lobi Awal setiap perangkat dibatasi maksimal membuat 1 Akun Guest. Setelah terdaftar, kartu Guest mulai dengan saldo Rp 0.',
    steps: [
      'Di Lobi Awal, pilih tab "Login Lewat Guest".',
      'Isi Nama Lengkap, NIK/No. HP, dan buat PIN Kartu 6 Digit (tidak perlu mengisi alamat).',
      'Klik tombol buat Akun Guest, lalu catat Nomor Rekening dan User ID 16 Digit yang tampil.',
      'Jika suatu saat keluar (logout), Anda dapat masuk kembali ke Akun Guest tersebut melalui tombol "Login Ke Akun".',
    ],
    tip: 'Perlu lebih dari 1 Akun Guest untuk keperluan tim atau keluarga? Admin dapat membuatkan Akun Guest tanpa batas melalui Panel Admin.',
    keywords: ['guest', 'tamu', 'batas 1', 'tanpa alamat', 'lobi'],
    isActive: true,
  },
  {
    id: 'faq-05',
    category: 'akun',
    question: 'Di mana saya bisa melihat User ID 16 Digit permanen milik saya?',
    answer:
      'Setiap rekening Bank Nusantara memiliki User ID 16 Digit unik yang bersifat permanen dan selalu ditampilkan di atas nama profil nasabah. ID ini digunakan untuk verifikasi login, identifikasi akun ke Admin, dan pengiriman hadiah atau transfer khusus.',
    steps: [
      'Masuk ke Dashboard utama Bank Nusantara.',
      'Perhatikan banner ID 16 Digit (format 4x4 digit) yang terletak tepat di atas nama lengkap Anda.',
      'Klik ikon "Salin" di sebelah nomor ID tersebut untuk menyalin 16 digit tanpa salah ketik.',
    ],
    tip: 'User ID 16 Digit berbeda dengan Nomor Kartu ATM 16 Digit dan Nomor Rekening 10 Digit. Pastikan Anda menyalin kode yang tepat saat login.',
    keywords: ['user id', '16 digit', 'id permanen', 'salin id'],
    isActive: true,
  },
  {
    id: 'faq-06',
    category: 'akun',
    question: 'Bagaimana cara mengisi alamat domisili berjenjang 38 provinsi dan Kode Pos otomatis?',
    answer:
      'Formulir pendaftaran dan pembaruan profil Bank Nusantara menggunakan pemilih wilayah resmi seluruh 38 Provinsi Indonesia secara berurutan dari atas ke bawah. Saat Anda memilih Kabupaten/Kota, Kecamatan, dan Desa/Kelurahan, sistem akan mengisi Kode Pos 5 digit secara otomatis dan tetap mengizinkan pengeditan manual.',
    steps: [
      'Pilih Provinsi terlebih dahulu dari daftar 38 provinsi (gunakan kotak pencarian bila perlu).',
      'Lanjutkan memilih Kabupaten/Kota, kemudian Kecamatan, lalu Desa/Kelurahan secara berurutan.',
      'Periksa kolom Kode Pos 5 digit yang terisi otomatis; ubah manual jika kode pos wilayah Anda berbeda.',
      'Isi kotak angka RT (3 digit, contoh 001) dan RW (3 digit, contoh 005) secara wajib; Alamat Jalan bersifat opsional.',
      'Jika nama desa belum terdaftar atau sedang offline, aktifkan tombol "Ketik Manual" pada tingkat wilayah tersebut.',
    ],
    tip: 'Hasil alamat otomatis diformat sesuai standar resmi KTP lengkap. Anda juga dapat membuka tab "Peta Maps (Opsional)" bila ingin menandai titik lokasi.',
    keywords: ['alamat', 'provinsi', 'kabupaten', 'kecamatan', 'desa', 'kode pos', 'rt rw'],
    isActive: true,
  },
  {
    id: 'faq-07',
    category: 'akun',
    question: 'Bagaimana cara mendapatkan lencana Centang Biru (Terverifikasi) di profil saya?',
    answer:
      'Lencana Centang Biru menandakan bahwa identitas rekening nasabah telah diverifikasi secara resmi oleh Admin Bank Nusantara. Lencana ini meningkatkan kepercayaan saat bertransaksi, mengirim pesan di Nusantara Chat, maupun menerima layanan prioritas.',
    steps: [
      'Pastikan seluruh data profil Anda (Nama, NIK, Nomor HP, dan Alamat lengkap) sudah benar dan valid.',
      'Aktifkan kartu Anda dan gunakan rekening secara aktif tanpa pelanggaran aturan.',
      'Hubungi Admin melalui menu Contact Us (WhatsApp/Email) untuk mengajukan peninjauan Verifikasi Centang Biru.',
      'Setelah disetujui Admin, lencana Centang Biru otomatis muncul di samping nama Anda secara real-time.',
    ],
    tip: 'Waspadai pihak luar yang menawarkan jasa centang biru berbayar; verifikasi resmi hanya diberikan langsung oleh Admin Bank Nusantara.',
    keywords: ['centang biru', 'verifikasi', 'verified', 'lencana'],
    isActive: true,
  },
  {
    id: 'faq-08',
    category: 'akun',
    question: 'Bagaimana cara mengubah data profil seperti Nama, Nomor HP, atau Alamat?',
    answer:
      'Demi menjaga integritas data kependudukan dan kepatuhan KYC (Know Your Customer), perubahan data identitas utama seperti Nama pada Kartu, NIK, Email tertaut, dan Alamat Domisili diverifikasi melalui Admin agar tidak disalahgunakan oleh pihak tidak bertanggung jawab.',
    steps: [
      'Buka tombol Logo WhatsApp (Contact Us & Bantuan) di pojok kanan bawah Dashboard.',
      'Pilih tab "Contact Us" dan pilih topik perubahan data profil.',
      'Kirimkan permohonan perubahan data beserta data baru yang benar melalui WhatsApp atau Email resmi.',
      'Setelah Admin memperbarui identitas Anda melalui Panel Admin, data terbaru langsung tersinkronisasi otomatis ke perangkat Anda.',
    ],
    tip: 'Sertakan Nomor Rekening dan User ID 16 Digit (otomatis terisi di pesan Contact Us) agar proses pembaruan jauh lebih cepat.',
    keywords: ['ubah profil', 'ganti nama', 'ganti alamat', 'ubah nomor hp', 'kyc'],
    isActive: true,
  },
  {
    id: 'faq-09',
    category: 'akun',
    question: 'Bagaimana cara mengajukan penghapusan akun secara permanen?',
    answer:
      'Penghapusan akun dilakukan melalui prosedur persetujuan berlapis guna melindungi nasabah dari penghapusan tidak sengaja atau kehilangan dana. Permohonan yang Anda kirim akan ditinjau terlebih dahulu oleh Admin sebelum diproses permanen.',
    steps: [
      'Pastikan Anda tidak memiliki sisa pinjaman daring aktif, cicilan tertunggak, atau sengketa transaksi.',
      'Buka menu Pengaturan Akun / Keamanan di Dashboard dan pilih opsi "Ajukan Hapus Akun".',
      'Pilih kategori alasan, tulis penjelasan lengkap, dan centang seluruh pertanyaan konfirmasi.',
      'Kirim permohonan dan pantau statusnya hingga Admin menyetujui atau memberikan catatan keputusan.',
    ],
    tip: 'Tarik atau transfer seluruh saldo dan aset Emas 24K Anda terlebih dahulu karena penghapusan akun yang telah disetujui bersifat permanen.',
    keywords: ['hapus akun', 'tutup rekening', 'permanen', 'delete account'],
    isActive: true,
  },
  {
    id: 'faq-10',
    category: 'akun',
    question: 'Apakah data rekening saya tetap aman saat membuka Bank Nusantara di HP atau laptop lain?',
    answer:
      'Ya. Seluruh data rekening, saldo, kartu, tabungan, deposito, pinjaman, dan mutasi Bank Nusantara tersinkronisasi otomatis ke Cloud Firestore secara real-time. Anda cukup login menggunakan akun Google yang sama atau lewat tombol "Login Ke Akun" di perangkat baru.',
    steps: [
      'Buka aplikasi Bank Nusantara di perangkat baru Anda.',
      'Login dengan akun Google yang tertaut, atau gunakan "Login Ke Akun" dengan No. Rekening + ID 16 Digit + PIN.',
      'Tunggu 1–2 detik hingga sinkronisasi Cloud selesai memuat seluruh saldo dan riwayat transaksi terbaru.',
    ],
    tip: 'Selalu klik Logout saat selesai menggunakan perangkat pinjaman atau komputer publik agar sesi tidak tetap terbuka.',
    keywords: ['sinkronisasi', 'cloud', 'ganti hp', 'perangkat lain', 'backup'],
    isActive: true,
  },

  // ============================================================================
  // KATEGORI 2: PENGGUNAAN KARTU ATM & TIER KARTU (FAQ #11 - #20)
  // ============================================================================
  {
    id: 'faq-11',
    category: 'kartu',
    question: 'Mengapa saldo awal kartu saya Rp 0 saat pertama kali mendaftar?',
    answer:
      'Sesuai kebijakan resmi Bank Nusantara, setiap pendaftaran kartu baru dari Lobi maupun pembuatan kartu tambahan otomatis dimulai dengan saldo Rp 0 tanpa kolom pengisian saldo mandiri. Hal ini memastikan seluruh perputaran dana bersifat adil, transparan, dan terverifikasi.',
    steps: [
      'Selesaikan pendaftaran kartu baru dan pastikan status kartu sudah disetujui menjadi "Aktif" oleh Admin.',
      'Setelah kartu aktif, Anda dapat langsung mulai mengumpulkan saldo resmi dari fitur Kerja Gajian.',
      'Anda juga dapat menerima kiriman dana melalui Transfer dari nasabah lain, hadiah resmi, atau suntikan saldo dari Admin.',
    ],
    tip: 'Saldo Rp 0 pada akun baru adalah kondisi normal. Kartu harus berstatus Aktif terlebih dahulu sebelum digunakan untuk transaksi.',
    keywords: ['saldo 0', 'saldo awal', 'setoran awal', 'aktivasi kartu'],
    isActive: true,
  },
  {
    id: 'faq-12',
    category: 'kartu',
    question: 'Bagaimana cara resmi mendapatkan uang/saldo setelah kartu diterima dan aktif?',
    answer:
      'Setelah kartu disetujui Admin dan berstatus Aktif, nasabah memiliki beberapa jalur resmi untuk memperoleh penghasilan dan saldo di Bank Nusantara tanpa bisa mengetik saldo secara manual.',
    steps: [
      'Buka menu "Lowongan Kerja / Kerja Gajian" di navigasi utama untuk bekerja, meningkatkan level karir, dan menerima gaji langsung ke rekening.',
      'Terima kiriman dana melalui fitur Transfer antar rekening dari teman atau rekan bisnis Anda.',
      'Klaim hadiah dari Surat & Kotak Hadiah Admin, Kode Redeem resmi, atau hasil keuntungan Emas 24K & Deposito.',
    ],
    tip: 'Tingkatkan Level Kerja dan Salary Multiplier secara bertahap agar penghasilan harian Anda tumbuh jauh lebih cepat.',
    keywords: ['cara dapat uang', 'tambah saldo', 'kerja', 'gajian', 'penghasilan'],
    isActive: true,
  },
  {
    id: 'faq-13',
    category: 'kartu',
    question: 'Apa perbedaan 5 jenis tier kartu ATM Bank Nusantara (Reguler, Emas, Premium, Platinum, Admin)?',
    answer:
      'Setiap tier kartu memiliki limit transaksi harian, manfaat eksklusif, tampilan visual kartu, dan fasilitas khusus yang berbeda. Semakin tinggi tier kartu Anda, semakin besar limit transaksi, fitur perlindungan, serta keleluasaan layanan yang didapatkan.',
    steps: [
      'Kartu Reguler: Cocok untuk pemula dan transaksi harian dasar dengan limit standar.',
      'Kartu Emas (Gold): Limit transaksi lebih tinggi dan biaya layanan lebih ringan.',
      'Kartu Premium & Platinum VIP: Limit harian sangat besar, akses transaksi internasional, cashback lebih tinggi, dan prioritas layanan.',
      'Kartu Admin: Kartu otoritas khusus dengan masa berlaku tak terbatas yang hanya diterbitkan melalui Panel Admin.',
    ],
    tip: 'Buka tab "Kartu Saya" di Dashboard untuk melihat rincian limit dan benefit kartu yang sedang aktif pada rekening Anda.',
    keywords: ['tier kartu', 'reguler', 'emas', 'premium', 'platinum', 'jenis kartu'],
    isActive: true,
  },
  {
    id: 'faq-14',
    category: 'kartu',
    question: 'Bagaimana cara mengajukan Upgrade Tier Kartu ATM ke tingkat lebih tinggi?',
    answer:
      'Nasabah dapat meningkatkan kartu Reguler menuju Emas, Premium, atau Platinum langsung dari Dashboard. Permohonan upgrade akan masuk ke antrean peninjauan Admin dan kartu Anda langsung berubah secara instan begitu disetujui.',
    steps: [
      'Buka Dashboard dan masuk ke bagian manajemen Kartu ATM.',
      'Klik tombol "Ajukan Upgrade Kartu" dan pilih tier kartu tujuan yang diinginkan.',
      'Periksa syarat biaya atau saldo minimum yang berlaku, lalu konfirmasi dengan PIN Kartu 6 Digit.',
      'Pantau notifikasi hingga Admin menyetujui permohonan upgrade kartu Anda.',
    ],
    tip: 'Upgrade tier kartu tidak mengubah Nomor Rekening ataupun saldo Anda; seluruh data transaksi lama tetap utuh.',
    keywords: ['upgrade kartu', 'naik tier', 'platinum', 'gold', 'premium'],
    isActive: true,
  },
  {
    id: 'faq-15',
    category: 'kartu',
    question: 'Bagaimana cara membekukan (Freeze) dan mengaktifkan kembali kartu ATM saya?',
    answer:
      'Fitur Bekukan Kartu (Freeze) berguna sebagai pengaman cepat saat Anda mencurigai kartu dipakai tanpa izin atau ingin menonaktifkan transaksi keluar sementara waktu tanpa menutup rekening.',
    steps: [
      'Buka menu Kartu ATM atau Pusat Keamanan di Dashboard.',
      'Klik tombol "Bekukan Kartu Sementara (Freeze)" dan konfirmasi permintaan Anda.',
      'Saat kartu berstatus Dibekukan, seluruh penarikan ATM, transfer keluar, dan pembayaran otomatis diblokir.',
      'Jika situasi sudah aman, klik tombol "Aktifkan Kembali (Unfreeze)" atau hubungi Admin bila pembekuan dilakukan oleh sistem.',
    ],
    tip: 'Segera bekukan kartu Anda dan ganti PIN jika pernah memasukkan nomor kartu pada halaman mencurigakan.',
    keywords: ['freeze', 'bekukan kartu', 'blokir sementara', 'unfreeze', 'kartu hilang'],
    isActive: true,
  },
  {
    id: 'faq-16',
    category: 'kartu',
    question: 'Bagaimana cara mengubah PIN Kartu ATM 6 Digit saya?',
    answer:
      'Anda tetap dapat mengganti PIN Kartu ATM 6 Digit kapan saja demi menjaga keamanan rekening. Perubahan PIN langsung tersimpan ke Cloud secara real-time dan seketika berlaku untuk login, transaksi transfer, dan mesin ATM.',
    steps: [
      'Masuk ke Dashboard dan buka menu "Keamanan / Ubah PIN Kartu".',
      'Masukkan PIN Kartu 6 Digit lama Anda untuk verifikasi.',
      'Ketikkan PIN 6 Digit baru yang kuat (hindari tanggal lahir atau angka berurutan) lalu ketik ulang pada kolom konfirmasi.',
      'Klik "Simpan PIN Baru" dan tunggu pesan konfirmasi sukses.',
    ],
    tip: 'Ganti PIN secara berkala setiap 1–3 bulan dan pastikan tidak menggunakan kombinasi mudah ditebak seperti 123456 atau 000000.',
    keywords: ['ubah pin', 'ganti pin', 'pin kartu', '6 digit', 'password'],
    isActive: true,
  },
  {
    id: 'faq-17',
    category: 'kartu',
    question: 'Apa yang harus dilakukan jika saya lupa PIN Kartu 6 Digit?',
    answer:
      'Jika Anda lupa PIN Kartu sehingga tidak bisa bertransaksi di ATM atau masuk lewat "Login Ke Akun", Anda dapat mengajukan Reset PIN resmi yang akan diverifikasi oleh Admin demi mencegah pengambilalihan akun.',
    steps: [
      'Buka opsi "Lupa PIN Kartu" di Pusat Keamanan / ATM, atau hubungi Admin melalui menu Contact Us.',
      'Isi data verifikasi identitas seperti Nama Lengkap, Nomor Rekening, User ID 16 Digit, dan alasan lupa PIN.',
      'Kirim permohonan Reset PIN agar masuk ke antrean Tinjauan Lupa PIN di Panel Admin.',
      'Setelah Admin menyetujui dan menetapkan PIN sementara/baru, segera ubah menjadi PIN pribadi Anda sendiri.',
    ],
    tip: 'Jangan pernah meminta orang lain di chat publik untuk meresetkan PIN Anda. Hanya Admin resmi yang berwenang memproses reset PIN.',
    keywords: ['lupa pin', 'reset pin', 'tidak ingat pin', 'pin salah'],
    isActive: true,
  },
  {
    id: 'faq-18',
    category: 'kartu',
    question: 'Apa fungsi Nomor Kartu 16 Digit, kode CVV 3 Digit, dan Masa Berlaku (Expiry Date)?',
    answer:
      'Nomor Kartu 16 Digit mengidentifikasi kartu ATM/Debit Anda di jaringan pembayaran. Masa Berlaku menunjukkan batas aktif kartu (format MM/YY), sedangkan CVV 3 Digit adalah kode pengaman rahasia di bagian belakang kartu untuk verifikasi transaksi digital.',
    steps: [
      'Lihat tampak depan kartu virtual di Dashboard untuk memeriksa Nomor Kartu 16 Digit dan Masa Berlaku.',
      'Klik fitur balik kartu atau "Tampilkan CVV" bila Anda perlu melihat kode CVV 3 Digit.',
      'Sembunyikan kembali detail kartu saat berada di tempat umum atau saat membagikan tangkapan layar.',
    ],
    tip: 'JANGAN PERNAH membagikan kode CVV 3 Digit maupun foto bagian belakang kartu kepada siapa pun, termasuk pihak yang mengaku petugas bank.',
    keywords: ['cvv', 'nomor kartu', 'masa berlaku', 'expiry', 'kartu virtual'],
    isActive: true,
  },
  {
    id: 'faq-19',
    category: 'kartu',
    question: 'Bagaimana cara mengatur limit transaksi harian dan akses transaksi internasional?',
    answer:
      'Anda dapat membatasi nilai maksimal transaksi keluar harian untuk mengontrol pengeluaran sekaligus memperkecil risiko kerugian bila terjadi akses tidak sah. Akses transaksi internasional juga bisa dinyalakan atau dimatikan sesuai kebutuhan.',
    steps: [
      'Buka menu Dashboard lalu masuk ke pengaturan Kartu ATM / Kontrol Transaksi.',
      'Sesuaikan batas limit pengeluaran harian (Spending Limit) sesuai tier kartu Anda.',
      'Aktifkan atau nonaktifkan tombol "Transaksi Internasional" bila Anda tidak berencana bertransaksi lintas negara.',
      'Simpan pengaturan dengan memasukkan PIN Kartu 6 Digit.',
    ],
    tip: 'Matikan fitur transaksi internasional jika sedang tidak digunakan untuk memberikan lapisan keamanan ekstra.',
    keywords: ['limit transaksi', 'batas harian', 'internasional', 'spending limit'],
    isActive: true,
  },
  {
    id: 'faq-20',
    category: 'kartu',
    question: 'Mengapa kartu saya berstatus Dibanned/Diblokir dan bagaimana cara mengajukan banding?',
    answer:
      'Status Banned diterapkan oleh sistem keamanan atau Admin apabila terdeteksi pelanggaran ketentuan layanan, aktivitas mencurigakan, atau penyalahgunaan fitur. Anda dapat melihat alasan, durasi blokir (sementara atau permanen), serta mengajukan banding resmi.',
    steps: [
      'Baca rincian alasan pemblokiran dan sisa waktu hitung mundur pada layar informasi Banned.',
      'Klik tombol "Ajukan Banding / Tinjauan" yang tersedia pada layar status Banned.',
      'Tuliskan klarifikasi secara jujur dan sopan, atau hubungi kontak WhatsApp/Email resmi yang tertera.',
      'Tunggu tim Admin meninjau banding Anda; bila disetujui, akses kartu akan pulih seketika.',
    ],
    tip: 'Hindari membuat akun duplikat untuk mengakali sanksi blokir karena sistem dapat memperpanjang masa penangguhan.',
    keywords: ['banned', 'diblokir', 'banding', 'suspend', 'tinjauan'],
    isActive: true,
  },

  // ============================================================================
  // KATEGORI 3: OPERASIONAL ATM & TRANSAKSI (FAQ #21 - #30)
  // ============================================================================
  {
    id: 'faq-21',
    category: 'atm',
    question: 'Bagaimana cara menggunakan Simulator Mesin ATM Bank Nusantara?',
    answer:
      'Simulator ATM Bank Nusantara menghadirkan pengalaman operasional mesin ATM nyata lengkap dengan layar interaktif, papan tombol PIN, pilihan nominal cepat, suara mesin ATM, serta cetak struk digital yang langsung tercatat di mutasi rekening.',
    steps: [
      'Klik menu "Mesin ATM" pada bilah navigasi utama.',
      'Pilih kartu ATM aktif milik Anda untuk dimasukkan ke slot kartu mesin ATM.',
      'Masukkan PIN Kartu 6 Digit menggunakan keypad layar atau keyboard.',
      'Pilih layanan yang diinginkan: Cek Saldo, Tarik Tunai, Setor Tunai, Transfer, Ganti PIN, atau Transaksi Tanpa Kartu.',
      'Setelah selesai, selalu tekan "Keluarkan Kartu / Selesai" untuk menutup sesi ATM dengan aman.',
    ],
    tip: 'Pastikan status kartu Anda adalah "Aktif" (tidak Pending, Frozen, atau Banned) agar kartu dapat dibaca oleh mesin ATM.',
    keywords: ['atm', 'mesin atm', 'simulator', 'cara pakai atm'],
    isActive: true,
  },
  {
    id: 'faq-22',
    category: 'atm',
    question: 'Bagaimana cara melakukan Tarik Tunai di Mesin ATM Bank Nusantara?',
    answer:
      'Anda dapat melakukan penarikan uang tunai dari saldo rekening melalui mesin ATM menggunakan nominal pecahan cepat maupun nominal custom sesuai kelipatan pecahan yang didukung mesin ATM.',
    steps: [
      'Masuk ke menu "Mesin ATM", masukkan kartu Anda, dan verifikasi PIN 6 Digit.',
      'Pilih menu "Tarik Tunai" pada layar utama ATM.',
      'Pilih nominal cepat (misalnya Rp 100.000, Rp 500.000, Rp 1.000.000) atau pilih "Nominal Lain" untuk mengetik jumlah tertentu.',
      'Konfirmasi transaksi, ambil uang tunai simulasi beserta struk digital, lalu periksa pengurangan saldo pada Mutasi.',
    ],
    tip: 'Periksa sisa saldo dan limit tarik tunai harian kartu Anda sebelum menarik dana dalam jumlah besar.',
    keywords: ['tarik tunai', 'withdraw', 'ambil uang', 'atm'],
    isActive: true,
  },
  {
    id: 'faq-23',
    category: 'atm',
    question: 'Bagaimana cara melakukan Setor Tunai melalui Mesin ATM (CRM)?',
    answer:
      'Layanan Setor Tunai ATM memungkinkan Anda menyetorkan dana tunai resmi ke rekening sendiri sesuai ketentuan sistem dan izin fitur yang berlaku pada akun Anda.',
    steps: [
      'Buka menu "Mesin ATM" dan login menggunakan kartu aktif serta PIN 6 Digit.',
      'Pilih menu "Setor Tunai" pada layar utama ATM.',
      'Masukkan nominal uang yang akan disetorkan sesuai batas transaksi yang tersedia.',
      'Verifikasi ringkasan setoran pada layar, lalu klik Konfirmasi untuk menyelesaikan transaksi.',
    ],
    tip: 'Jika tombol Setor Tunai sedang dibatasi oleh kebijakan keamanan Admin, Anda dapat menambah saldo melalui Kerja Gajian atau Transfer masuk.',
    keywords: ['setor tunai', 'deposit', 'crm', 'atm'],
    isActive: true,
  },
  {
    id: 'faq-24',
    category: 'atm',
    question: 'Bagaimana cara Transfer Dana antar rekening Bank Nusantara?',
    answer:
      'Fitur Transfer Reguler memungkinkan Anda mengirim dana secara real-time ke rekening Bank Nusantara lain hanya dengan Nomor Rekening tujuan. Dana langsung masuk dalam hitungan detik lengkap dengan bukti struk resmi.',
    steps: [
      'Buka menu "Transfer" di navigasi utama (atau melalui layar ATM).',
      'Masukkan Nomor Rekening tujuan, lalu pastikan nama pemilik rekening yang muncul sudah benar.',
      'Isi nominal transfer dan tambahkan catatan/berita transfer jika diperlukan.',
      'Periksa rincian biaya admin (jika ada), masukkan PIN Kartu 6 Digit, dan klik "Kirim Sekarang".',
    ],
    tip: 'Selalu periksa ulang nama penerima sebelum menekan konfirmasi karena transaksi transfer yang sudah sukses tidak dapat dibatalkan sepihak.',
    keywords: ['transfer', 'kirim uang', 'rekening tujuan', 'biaya admin'],
    isActive: true,
  },
  {
    id: 'faq-25',
    category: 'atm',
    question: 'Apa itu fitur Transfer Bebas dan Transfer Emas 24K?',
    answer:
      'Selain transfer rupiah biasa, Bank Nusantara menyediakan mode Transfer Bebas lintas aset termasuk pengiriman Emas 24K antar nasabah sesuai ketentuan biaya/pajak pasar yang dikonfigurasi Admin.',
    steps: [
      'Buka tab "Transfer" lalu pilih mode "Transfer Bebas" atau klik "Transfer Emas" dari menu Tab Emas.',
      'Pilih jenis aset yang ingin dikirim (Saldo Rupiah atau Gram Emas 24K).',
      'Masukkan Nomor Rekening tujuan dan jumlah gram/nominal yang hendak dikirim.',
      'Tinjau estimasi potongan biaya pasar yang ditampilkan, masukkan PIN 6 Digit, dan selesaikan transaksi.',
    ],
    tip: 'Pastikan saldo Emas 24K Anda mencukupi termasuk biaya transaksi agar pengiriman tidak gagal.',
    keywords: ['transfer bebas', 'transfer emas', 'kirim emas', '24k'],
    isActive: true,
  },
  {
    id: 'faq-26',
    category: 'atm',
    question: 'Bagaimana cara memakai fitur Transaksi Tanpa Kartu (Cardless Token) di ATM?',
    answer:
      'Fitur Cardless memungkinkan Anda menarik uang di ATM tanpa membawa/memasukkan kartu fisik. Sistem akan menghasilkan Kode Token sekali pakai dengan batas masa berlaku singkat demi keamanan tinggi.',
    steps: [
      'Buka Dashboard dan pilih menu "Tarik Tanpa Kartu / Cardless Token".',
      'Tentukan nominal penarikan dan konfirmasi dengan PIN Kartu 6 Digit untuk menerbitkan Kode Token rahasia.',
      'Buka menu "Mesin ATM" dan pilih opsi "Transaksi Tanpa Kartu" di layar awal.',
      'Masukkan Nomor HP/Rekening dan Kode Token tersebut sebelum kedaluwarsa untuk mencairkan dana.',
    ],
    tip: 'Jangan bagikan Kode Token Cardless kepada orang lain. Jika token tidak terpakai hingga kedaluwarsa, saldo Anda tetap aman di rekening.',
    keywords: ['cardless', 'tanpa kartu', 'kode token', 'tarik tunai tanpa kartu'],
    isActive: true,
  },
  {
    id: 'faq-27',
    category: 'atm',
    question: 'Bagaimana cara membeli Pulsa, Token Listrik PLN, dan Voucher di Bank Nusantara?',
    answer:
      'Anda dapat membeli Pulsa seluler, Token Listrik PLN (kWh), dan berbagai voucher digital langsung dari saldo rekening. Setiap kode voucher/token yang berhasil dibeli tersimpan otomatis di riwayat pembelian Anda.',
    steps: [
      'Masuk ke Dashboard dan buka sub-tab "Bayar & Beli / PPOB".',
      'Pilih jenis layanan: Pulsa, Token Listrik PLN, atau Voucher Digital.',
      'Masukkan nomor HP / nomor meteran PLN tujuan dan pilih nominal yang diinginkan.',
      'Konfirmasi pembayaran dengan PIN 6 Digit; kode token 20 digit atau saldo pulsa akan langsung terbit.',
    ],
    tip: 'Cek kembali nomor meteran PLN atau nomor HP Anda sebelum membayar karena pembelian produk digital bersifat final.',
    keywords: ['pulsa', 'token listrik', 'pln', 'voucher', 'ppob', 'tagihan'],
    isActive: true,
  },
  {
    id: 'faq-28',
    category: 'atm',
    question: 'Bagaimana cara melihat Mutasi Rekening dan bukti transaksi saya?',
    answer:
      'Seluruh uang masuk (kredit) dan uang keluar (debit) dari transfer, ATM, gaji kerja, pinjaman, deposito, hingga pembelian emas tercatat otomatis secara kronologis pada tab Mutasi Rekening.',
    steps: [
      'Buka Dashboard dan klik sub-tab "Mutasi / Riwayat Transaksi".',
      'Gunakan filter jenis transaksi (Masuk, Keluar, Transfer, ATM, Emas) atau kotak pencarian untuk menemukan transaksi tertentu.',
      'Klik salah satu baris transaksi untuk melihat detail nomor referensi, waktu, penerima/pengirim, dan catatan.',
    ],
    tip: 'Periksa Mutasi Rekening secara rutin minimal seminggu sekali untuk memastikan tidak ada transaksi mencurigakan.',
    keywords: ['mutasi', 'riwayat transaksi', 'struk', 'rekening koran', 'bukti transfer'],
    isActive: true,
  },
  {
    id: 'faq-29',
    category: 'atm',
    question: 'Bagaimana cara menyimpan Rekening Favorit dan membuat Pembayaran Terjadwal?',
    answer:
      'Rekening Favorit mempercepat proses transfer ke tujuan yang sering Anda kirimi dana tanpa perlu mengetik ulang nomor rekening. Sementara Pembayaran Terjadwal membantu mengotomatiskan tagihan rutin Anda.',
    steps: [
      'Saat melakukan transfer, aktifkan centang "Simpan ke Rekening Favorit" atau tambahkan manual di daftar Favorit.',
      'Untuk transaksi rutin, buka menu "Pembayaran Terjadwal" di Dashboard.',
      'Tentukan rekening tujuan, nominal, jadwal tanggal, dan frekuensi pengulangan.',
      'Pastikan saldo rekening Anda mencukupi menjelang tanggal eksekusi agar jadwal tidak gagal.',
    ],
    tip: 'Anda dapat menghapus rekening favorit atau membatalkan jadwal pembayaran kapan saja sebelum tanggal eksekusi.',
    keywords: ['favorit', 'pembayaran terjadwal', 'auto debit', 'transfer rutin'],
    isActive: true,
  },
  {
    id: 'faq-30',
    category: 'atm',
    question: 'Mengapa transaksi ATM atau Transfer saya ditolak atau berstatus Tertunda (Pending)?',
    answer:
      'Transaksi dapat ditolak karena saldo tidak mencukupi, PIN salah, limit harian terlampaui, atau kartu belum aktif/dibekukan. Sementara transaksi bernilai sangat besar atau transaksi tertentu dapat berstatus Pending karena memerlukan peninjauan keamanan Admin.',
    steps: [
      'Periksa pesan keterangan pada notifikasi error (misalnya saldo kurang, limit harian habis, atau kartu dibekukan).',
      'Cek status kartu di Dashboard untuk memastikan kartu berstatus "Aktif".',
      'Jika transaksi berstatus "Menunggu Tinjauan Keuangan Admin", pantau tab Mutasi atau hubungi Admin melalui Contact Us dengan melampirkan nomor referensi.',
    ],
    tip: 'Jangan mengulang transfer berkali-kali saat status masih Pending agar tidak terjadi pengiriman ganda.',
    keywords: ['transaksi gagal', 'ditolak', 'pending', 'tertunda', 'limit'],
    isActive: true,
  },

  // ============================================================================
  // KATEGORI 4: PINJAMAN DARING, HUTANG & TABUNGAN (FAQ #31 - #40)
  // ============================================================================
  {
    id: 'faq-31',
    category: 'pinjaman',
    question: 'Bagaimana cara mengajukan Pinjaman Daring di aplikasi Bank Nusantara?',
    answer:
      'Bank Nusantara menyediakan layanan Pinjaman Daring transparan untuk membantu kebutuhan modal usaha, investasi, maupun kebutuhan darurat nasabah. Pengajuan dilakukan langsung dari Dashboard dengan persetujuan cepat dari Admin.',
    steps: [
      'Buka Dashboard dan pilih menu "Pinjaman Daring" (atau melalui tab "Kotak Hutang").',
      'Pilih nominal pinjaman yang dibutuhkan dan tentukan jangka waktu cicilan (tenor).',
      'Periksa simulasi suku bunga, total pengembalian, serta tenggat jatuh tempo secara teliti.',
      'Isi tujuan penggunaan dana, konfirmasi dengan PIN 6 Digit, lalu kirim pengajuan untuk ditinjau Admin.',
    ],
    tip: 'Pinjamlah sesuai kemampuan bayar bulanan Anda agar skor kredit dan kelancaran akun tetap terjaga baik.',
    keywords: ['pinjaman', 'pinjol', 'pinjaman daring', 'ajukan pinjaman', 'kredit'],
    isActive: true,
  },
  {
    id: 'faq-32',
    category: 'pinjaman',
    question: 'Apa syarat kelayakan agar pengajuan Pinjaman Daring saya disetujui?',
    answer:
      'Persetujuan pinjaman mempertimbangkan status aktif kartu, kelengkapan profil identitas, riwayat transaksi yang sehat, serta tidak adanya tunggakan hutang aktif yang melewati jatuh tempo.',
    steps: [
      'Pastikan kartu ATM Anda berstatus "Aktif" (bukan Pending, Frozen, atau Banned).',
      'Pastikan tidak ada tagihan hutang macet di menu "Kotak Hutang".',
      'Isi tujuan pinjaman secara jelas dan ajukan nominal yang wajar sesuai profil/tier kartu Anda.',
      'Tunggu notifikasi persetujuan Admin; begitu disetujui, dana cair otomatis ke saldo rekening utama.',
    ],
    tip: 'Nasabah dengan lencana Centang Biru dan riwayat pelunasan tepat waktu memiliki peluang persetujuan jauh lebih tinggi.',
    keywords: ['syarat pinjaman', 'kelayakan', 'disetujui', 'tenor', 'bunga'],
    isActive: true,
  },
  {
    id: 'faq-33',
    category: 'pinjaman',
    question: 'Bagaimana cara membayar cicilan atau melunasi Pinjaman Daring lebih awal?',
    answer:
      'Anda dapat membayar cicilan sebagian maupun melunasi seluruh sisa pinjaman sekaligus kapan saja sebelum jatuh tempo melalui menu Pinjaman / Kotak Hutang menggunakan saldo rekening utama Anda.',
    steps: [
      'Buka tab "Kotak Hutang" (di sisi kiri logo navbar) atau menu "Pinjaman" di Dashboard.',
      'Pilih tagihan pinjaman aktif yang ingin Anda bayar.',
      'Pilih opsi "Bayar Cicilan" atau "Lunasi Semua Sekarang".',
      'Masukkan PIN Kartu 6 Digit untuk menyelesaikan pembayaran dan terima bukti pelunasan resmi.',
    ],
    tip: 'Melunasi pinjaman tepat waktu atau lebih awal menghindarkan Anda dari denda keterlambatan dan menjaga reputasi akun.',
    keywords: ['bayar cicilan', 'pelunasan', 'lunasi hutang', 'jatuh tempo'],
    isActive: true,
  },
  {
    id: 'faq-34',
    category: 'pinjaman',
    question: 'Apa fungsi menu "Kotak Hutang" dan banner hitung mundur tenggat waktu?',
    answer:
      'Kotak Hutang adalah pusat pemantauan seluruh kewajiban hutang aktif Anda—baik yang berasal dari pinjaman daring maupun risiko rugi transaksi/usaha. Banner peringatan di atas layar menampilkan hitung mundur real-time agar Anda tidak pernah lupa tanggal jatuh tempo.',
    steps: [
      'Klik tab "Kotak Hutang" pada bilah navigasi atau klik langsung pada Banner Peringatan Hutang.',
      'Pantau rincian pokok hutang, denda (jika ada), serta sisa waktu hingga tenggat berakhir.',
      'Gunakan tombol pembayaran di dalam Kotak Hutang untuk mencicil atau melunasi kewajiban sebelum waktu habis.',
    ],
    tip: 'Begitu seluruh saldo hutang mencapai Rp 0, banner peringatan otomatis hilang dan akun kembali bersih.',
    keywords: ['kotak hutang', 'tenggat waktu', 'hitung mundur', 'banner hutang'],
    isActive: true,
  },
  {
    id: 'faq-35',
    category: 'pinjaman',
    question: 'Apa konsekuensi jika saya terlambat membayar hutang melewati jatuh tempo?',
    answer:
      'Keterlambatan pembayaran melewati tenggat waktu dapat memicu denda keterlambatan, pembatasan sementara pada fitur transaksi tertentu, peringatan berulang pada layar Dashboard, hingga peninjauan sanksi kartu oleh Admin.',
    steps: [
      'Segera kumpulkan saldo melalui fitur Kerja Gajian atau jual sebagian aset Emas/Kantong Tabungan Anda.',
      'Masuk ke tab "Kotak Hutang" dan bayar cicilan secepatnya untuk menghentikan akumulasi risiko.',
      'Jika mengalami kendala berat, segera hubungi Admin via Contact Us untuk meminta keringanan atau penjadwalan ulang.',
    ],
    tip: 'Sisihkan minimal 20% dari setiap penghasilan Kerja Gajian ke Kantong khusus pelunasan hutang.',
    keywords: ['telat bayar', 'denda', 'jatuh tempo', 'risiko rugi', 'macet'],
    isActive: true,
  },
  {
    id: 'faq-36',
    category: 'pinjaman',
    question: 'Bagaimana cara membuat dan mengelola Kantong Tabungan (Pockets)?',
    answer:
      'Kantong Tabungan (Pockets) memudahkan Anda memisahkan dana berdasarkan tujuan keuangan—seperti Dana Darurat, Tabungan Liburan, atau Modal Usaha—sehingga tidak tercampur dengan saldo belanja harian.',
    steps: [
      'Buka Dashboard dan pilih sub-tab "Kantong Tabungan (Pockets)".',
      'Klik "Buat Kantong Baru", beri nama tujuan, pilih ikon, dan tetapkan target nominal tabungan.',
      'Gunakan tombol "Tambah Dana" untuk memindahkan saldo utama ke kantong, atau "Tarik ke Rekening" kapan pun diperlukan.',
    ],
    tip: 'Dana di dalam Kantong Tabungan tetap aman 100% milik Anda dan bisa ditarik kembali ke saldo utama tanpa penalti.',
    keywords: ['kantong tabungan', 'pockets', 'menabung', 'target tabungan'],
    isActive: true,
  },
  {
    id: 'faq-37',
    category: 'pinjaman',
    question: 'Bagaimana cara membuka Deposito Berjangka dan mencairkan bunganya?',
    answer:
      'Deposito Berjangka menawarkan imbal hasil bunga lebih tinggi dibandingkan tabungan biasa dengan pilihan tenor penyimpanan yang fleksibel. Bunga deposito akan terhitung otomatis dan cair saat jatuh tempo.',
    steps: [
      'Masuk ke Dashboard lalu buka sub-tab "Deposito Berjangka".',
      'Tentukan jumlah penempatan dana deposito dan pilih tenor yang tersedia.',
      'Periksa estimasi bunga yang akan diterima pada saat jatuh tempo, lalu konfirmasi dengan PIN 6 Digit.',
      'Setelah tenor selesai (atau saat Anda memilih pencairan), dana pokok beserta bunga otomatis masuk ke saldo utama.',
    ],
    tip: 'Gunakan dana dingin yang tidak akan dipakai dalam waktu dekat untuk penempatan Deposito agar imbal hasil maksimal.',
    keywords: ['deposito', 'bunga', 'investasi', 'simpanan berjangka'],
    isActive: true,
  },
  {
    id: 'faq-38',
    category: 'pinjaman',
    question: 'Bagaimana cara membeli, menjual, dan memantau harga Emas 24K di Bank Nusantara?',
    answer:
      'Menu Emas 24K memungkinkan Anda berinvestasi logam mulia digital mulai dari pecahan gram kecil. Harga beli dan jual emas diperbarui secara dinamis sehingga Anda bisa membeli saat harga turun dan menjual saat harga naik.',
    steps: [
      'Klik tab "Emas 24K" pada bilah navigasi utama.',
      'Pantau grafik harga beli dan harga jual per gram hari ini.',
      'Pilih "Beli Emas", masukkan nominal Rupiah atau jumlah Gram, lalu konfirmasi dengan PIN 6 Digit.',
      'Untuk mencairkan keuntungan ke saldo Rupiah, pilih "Jual Emas" dan masukkan jumlah gram yang ingin dijual.',
    ],
    tip: 'Selain dijual ke Rupiah, saldo Emas 24K juga bisa dikirim langsung ke rekening teman melalui fitur Transfer Emas.',
    keywords: ['emas', 'emas 24k', 'investasi emas', 'beli emas', 'jual emas'],
    isActive: true,
  },
  {
    id: 'faq-39',
    category: 'pinjaman',
    question: 'Bagaimana cara mengatur Anggaran Bulanan (Budgeting) agar keuangan terkendali?',
    answer:
      'Fitur Anggaran (Budgeting) secara otomatis mengelompokkan pengeluaran Anda ke dalam kategori (seperti Makan, Tagihan, Transportasi, Hiburan) dan memberikan peringatan jika pengeluaran mendekati batas bulanan.',
    steps: [
      'Buka menu "Anggaran" pada navigasi utama.',
      'Buat atau edit kategori anggaran serta tentukan batas pengeluaran maksimal per bulan.',
      'Anda juga dapat mencatat pengeluaran manual atau memetakan transaksi mutasi ke kategori yang sesuai.',
      'Pantau batang progres anggaran agar pengeluaran tetap berada di bawah batas aman.',
    ],
    tip: 'Terapkan aturan 50/30/20 (50% kebutuhan pokok, 30% keinginan, 20% tabungan/emas) untuk kesehatan finansial jangka panjang.',
    keywords: ['anggaran', 'budgeting', 'pengeluaran', 'atur keuangan'],
    isActive: true,
  },
  {
    id: 'faq-40',
    category: 'pinjaman',
    question: 'Bagaimana cara mengikuti Kerja Gajian, Spin The Wheel, dan menukar Kode Redeem?',
    answer:
      'Bank Nusantara menghadirkan ekosistem penghasilan dan apresiasi lengkap: fitur Kerja untuk memperoleh gaji rutin, Spin The Wheel untuk memutar hadiah menggunakan Koin Spin, serta penukaran Kode Redeem resmi dari Admin.',
    steps: [
      'Buka menu "Lowongan Kerja" untuk bekerja, naik level karir, dan menerima gaji langsung ke saldo aktif.',
      'Kumpulkan Koin Spin dari aktivitas atau hadiah, lalu buka menu "Spin Wheel" untuk memutar roda keberuntungan.',
      'Untuk Kode Redeem, buka menu "Tukar Kode Redeem" di Dashboard, tempel kode resmi dari Admin, lalu klik "Klaim Hadiah".',
    ],
    tip: 'Setiap Kode Redeem memiliki batas kuota dan masa berlaku. Segera klaim begitu Admin membagikan kode di Broadcast atau Chat Global.',
    keywords: ['kerja', 'spin wheel', 'kode redeem', 'hadiah', 'koin spin'],
    isActive: true,
  },

  // ============================================================================
  // KATEGORI 5: KEAMANAN, PRIVASI & PRAKTIK TERBAIK (FAQ #41 - #50)
  // ============================================================================
  {
    id: 'faq-41',
    category: 'keamanan',
    question: 'Bagaimana praktik terbaik membuat dan menjaga PIN Kartu 6 Digit yang aman?',
    answer:
      'PIN 6 Digit adalah kunci utama otorisasi setiap transaksi finansial di Bank Nusantara. Memilih kombinasi angka yang kuat dan menjaganya tetap rahasia adalah pertahanan pertama melawan pembobolan rekening.',
    steps: [
      'Hindari angka berurutan (123456, 654321), angka kembar (111111), tanggal lahir, atau 6 digit terakhir nomor HP Anda.',
      'Gunakan kombinasi acak yang hanya mudah Anda ingat sendiri dan berbeda dari PIN aplikasi lain.',
      'Jangan pernah menulis PIN di tempat yang mudah dilihat orang lain atau mengirimkannya lewat chat.',
      'Ganti PIN secara berkala melalui menu Ubah PIN di Dashboard.',
    ],
    tip: 'Admin Bank Nusantara TIDAK PERNAH meminta Anda menyebutkan PIN 6 Digit melalui telepon, WhatsApp, atau chat publik.',
    keywords: ['keamanan pin', 'tips pin', 'pin kuat', 'password aman'],
    isActive: true,
  },
  {
    id: 'faq-42',
    category: 'keamanan',
    question: 'Bagaimana cara melindungi Nomor Kartu, CVV, dan User ID dari phishing?',
    answer:
      'Phishing adalah upaya penipuan untuk mencuri data kredensial Anda melalui tautan palsu, formulir tiruan, atau pesan yang mengatasnamakan bank. Melindungi data sensitif mencegah pengambilalihan rekening.',
    steps: [
      'Selalu pastikan Anda mengakses halaman resmi aplikasi Bank Nusantara sebelum memasukkan kredensial login.',
      'Jangan pernah membagikan tangkapan layar yang memperlihatkan kode CVV 3 Digit atau PIN Kartu Anda.',
      'Tolak segala permintaan pengisian data rekening pada formulir eksternal di luar aplikasi Bank Nusantara.',
      'Segera tutup halaman mencurigakan dan laporkan melalui menu Contact Us atau Laporan Bug.',
    ],
    tip: 'Jika Anda sudah terlanjur membagikan kode sensitif, segera bekukan kartu (Freeze) dan ganti PIN Anda dalam hitungan detik.',
    keywords: ['phishing', 'penipuan', 'link palsu', 'lindungi cvv', 'privasi'],
    isActive: true,
  },
  {
    id: 'faq-43',
    category: 'keamanan',
    question: 'Bagaimana cara mengenali penipuan yang mengatasnamakan Admin atau CS Bank Nusantara?',
    answer:
      'Penipu kerap mengaku sebagai petugas bank atau Admin dengan janji hadiah instan, ancaman pemblokiran mendadak, atau permintaan transfer verifikasi. Kenali ciri saluran resmi Bank Nusantara agar selalu aman.',
    steps: [
      'Gunakan hanya kontak WhatsApp dan Email resmi yang tercantum langsung di tombol Contact Us pada Dashboard aplikasi.',
      'Perhatikan bahwa Admin resmi tidak pernah meminta biaya transfer pribadi untuk mencairkan Hadiah & Surat Admin.',
      'Hadiah resmi dari Admin selalu dikirim langsung ke fitur "Surat & Hadiah Admin" di pojok kanan bawah aplikasi.',
      'Jika ada akun di Chat yang mengaku Admin tanpa lencana Role Dev/Admin & Centang Biru resmi, segera abaikan dan laporkan.',
    ],
    tip: 'Selalu lakukan verifikasi silang melalui tombol Contact Us resmi di dalam aplikasi bila menerima pesan mencurigakan.',
    keywords: ['penipuan', 'scam', 'admin palsu', 'cs palsu', 'hoaks'],
    isActive: true,
  },
  {
    id: 'faq-44',
    category: 'keamanan',
    question: 'Apa itu fitur VIP Shield dan bagaimana cara kerjanya melindungi akun saya?',
    answer:
      'VIP Shield adalah lapisan perlindungan keamanan premium yang memberikan proteksi ekstra terhadap risiko tertentu, pengawasan transaksi abnormal, serta indikator perisai keamanan khusus pada profil rekening Anda.',
    steps: [
      'Periksa status VIP Shield Anda pada kartu profil di Dashboard atau Pusat Keamanan.',
      'VIP Shield dapat aktif secara permanen pada tier kartu tertentu, dari hadiah resmi Admin, atau masa uji coba (Trial).',
      'Saat aktif, ikon Perisai VIP akan tampil pada profil Anda sebagai tanda perlindungan tingkat lanjut.',
    ],
    tip: 'Meskipun VIP Shield aktif, tetap terapkan kebiasaan aman seperti menjaga kerahasiaan PIN dan rutin mengecek mutasi.',
    keywords: ['vip shield', 'perisai', 'proteksi akun', 'perlindungan'],
    isActive: true,
  },
  {
    id: 'faq-45',
    category: 'keamanan',
    question: 'Apa yang harus diperhatikan saat login Bank Nusantara di perangkat umum atau pinjaman?',
    answer:
      'Membuka akun perbankan di perangkat milik orang lain atau komputer publik berisiko meninggalkan sesi login aktif bila Anda lupa keluar. Ikuti langkah aman berikut setiap kali memakai perangkat bersama.',
    steps: [
      'Gunakan mode penyamaran (Incognito / Private Window) di browser saat membuka aplikasi di perangkat umum.',
      'Jangan pernah memilih opsi "Simpan Sandi / Auto-fill" pada browser perangkat orang lain.',
      'Setelah seluruh transaksi selesai, klik tombol "Logout / Keluar Akun" dari navbar sebelum menutup tab.',
      'Tutup seluruh jendela browser agar data sesi sementara bersih sempurna.',
    ],
    tip: 'Jika lupa logout di perangkat lain, segera login dari perangkat pribadi Anda lalu ubah PIN Kartu 6 Digit.',
    keywords: ['perangkat umum', 'warnet', 'logout', 'incognito', 'sesi'],
    isActive: true,
  },
  {
    id: 'faq-46',
    category: 'keamanan',
    question: 'Bagaimana cara membedakan Akun Resmi (Centang Biru / Akun OA / Role Staff) dengan akun biasa?',
    answer:
      'Bank Nusantara menampilkan lencana identitas yang tidak bisa dipalsukan dengan teks nama biasa. Memahami lencana resmi membantu Anda bertransaksi dan berinteraksi di Nusantara Chat dengan tenang.',
    steps: [
      'Centang Biru: Lencana centang biru berbingkai resmi di samping nama menandakan nasabah telah diverifikasi Admin.',
      'Lencana Akun OA: Menandakan akun otoritas resmi yang diterbitkan langsung oleh Panel Admin.',
      'Lencana Role Dev/Staff: Lencana berwarna khusus (Owner, Developer, Admin, Moderator) hanya dapat diberikan dari Panel Admin.',
    ],
    tip: 'Pengguna biasa yang menambahkan emoji centang pada kolom nama tidak akan memiliki lencana verifikasi resmi sistem.',
    keywords: ['akun resmi', 'role staff', 'centang biru', 'badge', 'verifikasi'],
    isActive: true,
  },
  {
    id: 'faq-47',
    category: 'keamanan',
    question: 'Bagaimana cara melaporkan Bug, celah keamanan, atau perilaku pengguna mencurigakan?',
    answer:
      'Partisipasi nasabah sangat membantu menjaga keandalan sistem Bank Nusantara. Jika menemukan bug tampilan, kesalahan hitung, atau indikasi kecurangan pengguna lain, Anda dapat melaporkannya langsung ke tim Admin.',
    steps: [
      'Buka tombol "Lapor Bug" di aplikasi atau klik tombol Logo WhatsApp (Contact Us) di pojok kanan bawah.',
      'Jelaskan kronologi kejadian, menu tempat bug terjadi, dan sertakan tangkapan layar jika menghubungi lewat WhatsApp/Email.',
      'Kirim laporan; setiap laporan yang masuk akan tampil langsung di tab Laporan Bug Panel Admin untuk segera diperbaiki.',
    ],
    tip: 'Dilarang memanfaatkan celah bug untuk keuntungan pribadi (exploit). Laporkan secara bertanggung jawab untuk mendapatkan apresiasi resmi.',
    keywords: ['lapor bug', 'celah keamanan', 'report', 'kendala teknis', 'error'],
    isActive: true,
  },
  {
    id: 'faq-48',
    category: 'keamanan',
    question: 'Bagaimana cara memantau Pusat Keamanan & status sinkronisasi Cloud rekening saya?',
    answer:
      'Pusat Keamanan (Security Command Center) menampilkan ringkasan kesehatan keamanan akun, status kunci kartu, status verifikasi, serta status sinkronisasi Cloud real-time.',
    steps: [
      'Klik ikon perisai "Pusat Keamanan" di navbar atau Dashboard.',
      'Periksa indikator status kartu, kelengkapan pengaman PIN, dan status sinkronisasi Cloud.',
      'Aktifkan notifikasi aplikasi agar Anda langsung menerima peringatan real-time setiap ada transaksi masuk atau keluar.',
    ],
    tip: 'Menyalakan izin notifikasi browser membantu Anda mendeteksi aktivitas akun secara instan.',
    keywords: ['pusat keamanan', 'security center', 'notifikasi', 'audit keamanan'],
    isActive: true,
  },
  {
    id: 'faq-49',
    category: 'keamanan',
    question: 'Bagaimana keamanan fitur "Surat & Hadiah Admin" dan transfer Kotak Hadiah ke teman?',
    answer:
      'Setiap Surat & Hadiah yang dikirim Admin dilengkapi segel dan tanda tangan digital resmi. Anda bebas membaca isi surat kapan saja tanpa membuka Kotak Hadiah. Namun begitu Kotak Hadiah dibuka, seluruh isinya langsung masuk otomatis ke rekening Anda dan fitur Transfer ke Teman otomatis terkunci.',
    steps: [
      'Klik tombol "Surat & Hadiah Admin" di pojok kanan bawah Dashboard untuk melihat daftar paket resmi.',
      'Klik Amplop Surat jika hanya ingin membaca pesan resmi dari Admin.',
      'Jika ingin menghadiahkan paket tersebut kepada teman, lakukan "Transfer Kotak Hadiah" SEBELUM menekan tombol "Buka Kotak Hadiah".',
      'Jika ingin mengklaim untuk diri sendiri, klik "Buka Kotak Hadiah" dan pastikan hadiah masuk ke saldo/aset Anda.',
    ],
    tip: 'Jangan pernah percaya pihak luar yang meminta Anda mentransfer Kotak Hadiah dengan iming-iming hadiah berlipat.',
    keywords: ['surat hadiah', 'kotak hadiah', 'transfer hadiah', 'klaim hadiah'],
    isActive: true,
  },
  {
    id: 'faq-50',
    category: 'keamanan',
    question: 'Apa langkah darurat yang harus dilakukan jika akun saya diduga diakses orang lain?',
    answer:
      'Jika Anda melihat mutasi asing, menerima notifikasi transaksi yang tidak dilakukan sendiri, atau merasa PIN bocor, bertindak cepat dalam 1 menit pertama sangat krusial untuk menyelamatkan seluruh saldo dan aset Anda.',
    steps: [
      'Langkah 1: Segera aktifkan "Bekukan Kartu (Freeze)" dari Dashboard untuk menghentikan semua transaksi keluar seketika.',
      'Langkah 2: Masuk ke menu "Ubah PIN Kartu" dan ganti PIN 6 Digit Anda dengan kombinasi baru yang benar-benar acak.',
      'Langkah 3: Periksa tab Mutasi Rekening dan catat nomor referensi transaksi mencurigakan.',
      'Langkah 4: Klik tombol Logo WhatsApp (Contact Us) di pojok kanan bawah dan segera laporkan kejadian darurat ke Admin melalui WhatsApp atau Email resmi.',
    ],
    tip: 'Simpan kontak resmi Contact Us dan jangan panik—semakin cepat kartu dibekukan dan PIN diganti, semakin aman dana Anda.',
    keywords: ['darurat', 'akun dibajak', 'hack', 'transaksi asing', 'akses ilegal'],
    isActive: true,
  },
];

export const DEFAULT_SUPPORT_FAQS_350: SupportFaqItem[] =
  buildRandomized350SupportFaqs(BASE_50_SUPPORT_FAQS);

export const DEFAULT_SUPPORT_FAQS_50: SupportFaqItem[] = DEFAULT_SUPPORT_FAQS_350;

