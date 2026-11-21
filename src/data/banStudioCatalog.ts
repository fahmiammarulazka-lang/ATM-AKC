/**
 * Katalog Lengkap Studio Pengaturan & Live Preview Banned Bank Nusantara
 * - 30 Alasan Buatan Sistem (Resmi)
 * - 20 Preset Alasan Cepat (1-Klik)
 * - Konfigurasi Default & Preset Template Tampilan Banned
 */
import {
  BanScreenCustomizationConfig,
  BanConfigPreset,
  BanDurationUnit,
} from '../types/bank';

export interface SystemBanReasonItem {
  id: string;
  code: string;
  title: string;
  reasonText: string;
}

export interface QuickBanPresetItem {
  id: string;
  label: string;
  reasonText: string;
  suggestedDurationType: 'custom' | 'permanent';
  suggestedMinutes?: number;
}

export const SYSTEM_BAN_REASONS_30: SystemBanReasonItem[] = [
  {
    id: 'sys-01',
    code: 'SEC-001',
    title: 'Salah Memasukkan PIN Kartu 5x Berturut-turut',
    reasonText:
      'Salah memasukkan 6 digit PIN Kartu sebanyak 5 kali berturut-turut saat verifikasi masuk. Akun dikunci otomatis selama 1 hari (24 jam) demi keamanan rekening.',
  },
  {
    id: 'sys-02',
    code: 'SEC-002',
    title: 'Aktivitas Login Mencurigakan Lintas Perangkat',
    reasonText:
      'Sistem keamanan mendeteksi aktivitas login mencurigakan dari perangkat atau lokasi yang tidak dikenali secara berulang.',
  },
  {
    id: 'sys-03',
    code: 'SEC-003',
    title: 'Indikasi Penyalahgunaan Transfer Antar Rekening',
    reasonText:
      'Terdeteksi pola transaksi transfer beruntun yang tidak wajar dan melanggar batas kebijakan kepatuhan Bank Nusantara.',
  },
  {
    id: 'sys-04',
    code: 'SEC-004',
    title: 'Manipulasi Saldo atau Eksploitasi Fitur Sistem',
    reasonText:
      'Akun terdeteksi melakukan percobaan manipulasi nominal saldo atau eksploitasi celah fitur pada layanan digital Bank Nusantara.',
  },
  {
    id: 'sys-05',
    code: 'SEC-005',
    title: 'Penyalahgunaan Kode Redeem & Voucher Hadiah',
    reasonText:
      'Terdeteksi klaim berulang tidak sah atau penggunaan skrip otomatis pada fitur Kode Redeem dan Surat Hadiah.',
  },
  {
    id: 'sys-06',
    code: 'SEC-006',
    title: 'Data Identitas KTP (NIK) Tidak Valid / Duplikat',
    reasonText:
      'Verifikasi kepatuhan menemukan ketidaksesuaian atau duplikasi Nomor Induk Kependudukan (NIK) pada pendaftaran kartu.',
  },
  {
    id: 'sys-07',
    code: 'SEC-007',
    title: 'Tunggakan Pinjaman Online Melewati Batas Jatuh Tempo',
    reasonText:
      'Terdapat kewajiban angsuran Pinjaman Bank Nusantara yang telah melewati batas toleransi jatuh tempo pembayaran.',
  },
  {
    id: 'sys-08',
    code: 'SEC-008',
    title: 'Laporan Penipuan / Sengketa Transaksi dari Nasabah Lain',
    reasonText:
      'Rekening ini sedang dalam investigasi tim kepatuhan terkait laporan sengketa transaksi dari nasabah lain.',
  },
  {
    id: 'sys-09',
    code: 'SEC-009',
    title: 'Pelanggaran Syarat & Ketentuan Layanan (Terms of Service)',
    reasonText:
      'Akun terbukti melanggar Syarat dan Ketentuan Layanan Perbankan Digital PT Bank Nusantara (Persero) Tbk.',
  },
  {
    id: 'sys-10',
    code: 'SEC-010',
    title: 'Percobaan Akses Panel Otorisasi Tanpa Izin',
    reasonText:
      'Sistem mencatat upaya pembobolan kode otorisasi Admin atau akses fitur terbatas tanpa hak akses resmi.',
  },
  {
    id: 'sys-11',
    code: 'SEC-011',
    title: 'Spam Permohonan Upgrade Kartu Berulang',
    reasonText:
      'Mengirimkan permohonan upgrade tier kartu atau pembukaan blokir secara spam dalam waktu singkat.',
  },
  {
    id: 'sys-12',
    code: 'SEC-012',
    title: 'Penyalahgunaan Fitur Transfer Bebas Aset',
    reasonText:
      'Terdeteksi transaksi pengalihan aset tidak wajar pada fitur Transfer Bebas yang memerlukan audit Admin.',
  },
  {
    id: 'sys-13',
    code: 'SEC-013',
    title: 'Kecurangan Mini-Game Lowongan Kerja / Suit Jepang',
    reasonText:
      'Sistem anti-cheat mendeteksi aktivitas otomatisasi pada fitur Lowongan Pekerjaan dan klaim gaji.',
  },
  {
    id: 'sys-14',
    code: 'SEC-014',
    title: 'Manipulasi Putaran Spin the Wheel & Koin Spin',
    reasonText:
      'Terdeteksi anomali perolehan Koin Spin atau manipulasi putaran pada fitur Spin the Wheel.',
  },
  {
    id: 'sys-15',
    code: 'SEC-015',
    title: 'Transaksi Jual-Beli Emas 24K Tidak Wajar',
    reasonText:
      'Frekuensi transaksi beli/jual Emas 24K melebihi ambang kewajaran harian dan memerlukan peninjauan.',
  },
  {
    id: 'sys-16',
    code: 'SEC-016',
    title: 'Penyalahgunaan Fitur COD & Nomor Resi Pengiriman',
    reasonText:
      'Terdapat laporan pembatalan sepihak atau penyalahgunaan transaksi pembayaran resi COD.',
  },
  {
    id: 'sys-17',
    code: 'SEC-017',
    title: 'Spam Laporan Bug / Mintol Admin Tidak Relevan',
    reasonText:
      'Mengirimkan pesan spam, kata-kata tidak pantas, atau laporan palsu secara berulang ke ruang bantuan Admin.',
  },
  {
    id: 'sys-18',
    code: 'SEC-018',
    title: 'Pembekuan Sementara atas Permintaan Pemilik Akun',
    reasonText:
      'Akun dibekukan sementara atas permintaan pengamanan darurat dari pemilik rekening resmi.',
  },
  {
    id: 'sys-19',
    code: 'SEC-019',
    title: 'Audit Berkala Rekening Nominal Sultan / Unlimited',
    reasonText:
      'Rekening dengan limit transaksi besar sedang menjalani verifikasi audit berkala oleh Admin Utama.',
  },
  {
    id: 'sys-20',
    code: 'SEC-020',
    title: 'Kepemilikan Banyak Rekening Tanpa Izin (Multi-Account Abuse)',
    reasonText:
      'Terdeteksi pembuatan banyak kartu/rekening sekaligus untuk mengumpulkan bonus setoran awal secara tidak sah.',
  },
  {
    id: 'sys-21',
    code: 'SEC-021',
    title: 'Transaksi Tarik Tunai Tanpa Kartu (Cardless) Mencurigakan',
    reasonText:
      'Pembuatan token tarik tunai tanpa kartu berulang kali tanpa penyelesaian transaksi di mesin ATM.',
  },
  {
    id: 'sys-22',
    code: 'SEC-022',
    title: 'Perubahan Alamat / Identitas Tanpa Verifikasi Ulang',
    reasonText:
      'Perubahan data sensitif rekening memerlukan konfirmasi ulang melalui tim verifikasi Admin.',
  },
  {
    id: 'sys-23',
    code: 'SEC-023',
    title: 'Indikasi Phishing atau Pengambilalihan Akun (Account Takeover)',
    reasonText:
      'Akses akun dihentikan otomatis untuk melindungi dana nasabah dari indikasi pengambilalihan sesi.',
  },
  {
    id: 'sys-24',
    code: 'SEC-024',
    title: 'Penyalahgunaan Fitur Sultan Empire & Properti',
    reasonText:
      'Terdeteksi ketidakwajaran klaim pendapatan pasif pada portofolio aset Sultan Empire.',
  },
  {
    id: 'sys-25',
    code: 'SEC-025',
    title: 'Pelanggaran Etika Komunikasi pada Nusantara Chat',
    reasonText:
      'Akun dilaporkan mengirimkan pesan yang melanggar pedoman komunitas pada fitur Nusantara Chat.',
  },
  {
    id: 'sys-26',
    code: 'SEC-026',
    title: 'Pencairan Deposito Berjangka Sebelum Waktunya Secara Berulang',
    reasonText:
      'Pola pembukaan dan pembatalan sertifikat deposito berjangka secara beruntun memicu kunci pengaman sistem.',
  },
  {
    id: 'sys-27',
    code: 'SEC-027',
    title: 'Gagal Verifikasi Keamanan Dua Langkah (PIN & Sesi Cloud)',
    reasonText:
      'Sinkronisasi keamanan sesi Cloud mendeteksi kegagalan otorisasi berulang pada akun Anda.',
  },
  {
    id: 'sys-28',
    code: 'SEC-028',
    title: 'Penangguhan Sementara Selama Pemeliharaan Investigasi',
    reasonText:
      'Akun ditangguhkan sementara selama proses pemeriksaan log transaksi oleh tim teknis Bank Nusantara.',
  },
  {
    id: 'sys-29',
    code: 'SEC-029',
    title: 'Ketidaksesuaian Setoran Awal Pembukaan Rekening',
    reasonText:
      'Setoran awal pembukaan rekening tidak memenuhi ketentuan minimum tier kartu yang dipilih.',
  },
  {
    id: 'sys-30',
    code: 'SEC-030',
    title: 'Keputusan Mutlak Dewan Pengawas & Admin Utama',
    reasonText:
      'Akses akun dihentikan berdasarkan keputusan langsung Admin Utama Bank Nusantara.',
  },
];

export const QUICK_BAN_PRESETS_20: QuickBanPresetItem[] = [
  {
    id: 'qp-01',
    label: '1. Tanpa Alasan (Kosong)',
    reasonText: '',
    suggestedDurationType: 'permanent',
  },
  {
    id: 'qp-02',
    label: '2. Gagal PIN 5x (1 Hari)',
    reasonText:
      'Salah memasukkan 6 digit PIN Kartu sebanyak 5 kali berturut-turut saat verifikasi masuk.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 1440,
  },
  {
    id: 'qp-03',
    label: '3. Aktivitas Mencurigakan',
    reasonText: 'Terdeteksi aktivitas transaksi dan login mencurigakan pada rekening Anda.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 60,
  },
  {
    id: 'qp-04',
    label: '4. Pelanggaran Ketentuan (TOS)',
    reasonText: 'Akun melanggar Syarat & Ketentuan Layanan Perbankan Bank Nusantara.',
    suggestedDurationType: 'permanent',
  },
  {
    id: 'qp-05',
    label: '5. Penyalahgunaan Bug / Exploit',
    reasonText: 'Terdeteksi melakukan eksploitasi bug atau manipulasi sistem aplikasi.',
    suggestedDurationType: 'permanent',
  },
  {
    id: 'qp-06',
    label: '6. Spam Admin / Mintol',
    reasonText: 'Mengirimkan permintaan bantuan atau laporan palsu secara spam ke Admin.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 180,
  },
  {
    id: 'qp-07',
    label: '7. Transaksi Tidak Wajar',
    reasonText: 'Pola transfer atau mutasi saldo melebihi batas kewajaran keamanan harian.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 720,
  },
  {
    id: 'qp-08',
    label: '8. Penyalahgunaan Redeem/Hadiah',
    reasonText: 'Terdeteksi kecurangan dalam klaim Kode Redeem atau Surat Hadiah Event.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 1440,
  },
  {
    id: 'qp-09',
    label: '9. Multi-Akun / Duplikat KTP',
    reasonText: 'Terdeteksi kepemilikan banyak akun tidak sah atau duplikasi identitas NIK.',
    suggestedDurationType: 'permanent',
  },
  {
    id: 'qp-10',
    label: '10. Tunggakan Pinjaman',
    reasonText: 'Rekening dibekukan sementara karena tunggakan pinjaman yang belum diselesaikan.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 4320,
  },
  {
    id: 'qp-11',
    label: '11. Investigasi Keamanan (15 Menit)',
    reasonText: 'Akun sedang dalam pemeriksaan keamanan singkat selama 15 menit oleh Admin.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 15,
  },
  {
    id: 'qp-12',
    label: '12. Peringatan Ringan (30 Menit)',
    reasonText: 'Pembekuan peringatan selama 30 menit akibat aktivitas tidak sesuai prosedur.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 30,
  },
  {
    id: 'qp-13',
    label: '13. Audit Saldo Sultan (1 Jam)',
    reasonText: 'Rekening sedang menjalani verifikasi audit saldo selama 1 jam.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 60,
  },
  {
    id: 'qp-14',
    label: '14. Kecurangan Koin Spin',
    reasonText: 'Terdeteksi manipulasi perolehan koin pada fitur Spin the Wheel.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 1440,
  },
  {
    id: 'qp-15',
    label: '15. Kecurangan Lowongan Kerja',
    reasonText: 'Terdeteksi penggunaan skrip otomatis pada mini-game Lowongan Pekerjaan.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 1440,
  },
  {
    id: 'qp-16',
    label: '16. Sengketa Transfer Nasabah',
    reasonText: 'Akun ditangguhkan sementara menunggu penyelesaian sengketa transfer.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 2880,
  },
  {
    id: 'qp-17',
    label: '17. Percobaan Bobol Kode Admin',
    reasonText: 'Sistem mencatat percobaan memasukkan kode otorisasi Admin secara tidak sah.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 10080,
  },
  {
    id: 'qp-18',
    label: '18. Pelanggaran Chat Komunitas',
    reasonText: 'Melanggar etika komunikasi pada fitur pesan Bank Nusantara.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 360,
  },
  {
    id: 'qp-19',
    label: '19. Banned Trial 7 Hari',
    reasonText: 'Penangguhan akses layanan selama 7 hari untuk evaluasi kepatuhan akun.',
    suggestedDurationType: 'custom',
    suggestedMinutes: 10080,
  },
  {
    id: 'qp-20',
    label: '20. Banned Permanen Final',
    reasonText: 'Akun ditutup secara permanen berdasarkan keputusan final Admin Bank Nusantara.',
    suggestedDurationType: 'permanent',
  },
];

export const APPEAL_CATEGORIES_LIST: string[] = [
  'Salah Memasukkan PIN Kartu (Lupa / Tidak Sengaja)',
  'Ketidaksengajaan / Salah Tekan Fitur',
  'Akun Dipakai Orang Lain Tanpa Izin',
  'Kesalahpahaman Sistem / Tidak Melakukan Pelanggaran',
  'Permohonan Maaf & Janji Mematuhi Aturan',
];

export const generateBanCaseId = (): string => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BN-CASE-${num}`;
};

export const BAN_TEMPLATE_VARIABLES: Array<{
  token: string;
  label: string;
  sample: string;
}> = [
  { token: '{nama}', label: 'Nama Nasabah', sample: 'Budi Santoso' },
  { token: '{email}', label: 'Email Akun', sample: 'budi.santoso@gmail.com' },
  { token: '{rekening}', label: 'No. Rekening', sample: '8829104421' },
  { token: '{alasan}', label: 'Alasan Banned', sample: 'Salah Memasukkan PIN Kartu 5x Berturut-turut' },
  { token: '{caseId}', label: 'Kode Kasus', sample: 'BN-CASE-481920' },
  { token: '{durasi}', label: 'Durasi Banned', sample: '1 Hari (24 Jam)' },
];

export const DEFAULT_BAN_MESSAGE_TEMPLATE = [
  'Yth. Tim Kepatuhan & Admin Resmi PT Bank Nusantara (Persero) Tbk,',
  '',
  'Dengan hormat,',
  'Melalui pesan ini saya bermaksud mengajukan permohonan peninjauan resmi (banding) atas penangguhan/pembekuan (Banned) yang saat ini berlaku pada rekening Bank Nusantara saya.',
  '',
  '====================================',
  'DATA PERMOHONAN PENINJAUAN BANNED',
  '====================================',
  '• Kode Referensi Kasus : {caseId}',
  '• Nama Pemilik Akun    : {nama}',
  '• Nomor Rekening       : {rekening}',
  '• Alamat Email Akun    : {email}',
  '• Status & Durasi Ban  : {durasi}',
  '• Alasan Tercatat      : {alasan}',
  '',
  'KLARIFIKASI & KRONOLOGI SINGKAT',
  '1. Penjelasan kejadian dari pihak saya:',
  '   (Tuliskan kronologi atau klarifikasi Anda dengan jujur dan jelas)',
  '2. Pernyataan komitmen keamanan:',
  '   Saya menyatakan bersedia mengikuti seluruh prosedur verifikasi identitas serta mematuhi Syarat & Ketentuan Layanan PT Bank Nusantara (Persero) Tbk ke depannya.',
  '',
  'Besar harapan saya agar Tim Admin Bank Nusantara berkenan meninjau kembali status akun saya dan memulihkan akses rekening jika seluruh persyaratan verifikasi telah terpenuhi.',
  '',
  'Atas perhatian, kebijakan, dan bantuannya saya ucapkan terima kasih.',
  '',
  'Hormat saya,',
  '{nama} ({rekening})',
].join('\n');

export const DEFAULT_BAN_SCREEN_CONFIG: BanScreenCustomizationConfig = {
  durationType: 'custom',
  durationValue: 1,
  durationUnit: 'days',
  durationMinutes: 1440,
  durationLabel: '1 Hari (24 Jam)',
  reasonMode: 'system_30',
  systemReasonId: 'sys-01',
  selectedSystemReasonId: 'sys-01',
  reasonText: SYSTEM_BAN_REASONS_30[0].reasonText,
  reason: SYSTEM_BAN_REASONS_30[0].reasonText,
  showReasonBox: true,
  showSubtitle: true,
  subtitleText:
    'Seluruh akses fitur dan sesi aktif telah dihentikan secara otomatis di seluruh perangkat yang terhubung dengan akun ini.',
  showWhatsAppButton: true,
  showEmailButton: true,
  showInAppAppealButton: true,
  showRecommendedLabel: true,
  showCountdown: true,
  showCaseId: true,
  caseId: 'BN-CASE-100201',
  showBannedAtTime: true,
  showStatusBadge: true,
  statusBadgeText: 'BANNED TRIAL · 1 HARI',
  showAppealStatusBox: true,
  themeVariant: 'emergency_red',
  theme: 'emergency_red',
  iconVariant: 'shield',
  icon: 'shield',
  soundEffect: 'alert',
  showFooterNote: false,
  footerNote: '',
  maxAppeals: 3,
  allowResubmitAfterReject: true,
  requireAppealCategoryAndPromise: false,
  overrideWhatsappNumber: '',
  overrideWhatsAppNumber: '',
  overrideEmailAddress: '',
  messageTemplate: DEFAULT_BAN_MESSAGE_TEMPLATE,
  appealMessageTemplate: DEFAULT_BAN_MESSAGE_TEMPLATE,
  internalAdminNote: '',
  adminInternalNote: '',
};

export const DEFAULT_BAN_CONFIG_PRESETS: BanConfigPreset[] = [
  {
    id: 'preset-pin-5x-1day',
    name: 'Default Trial 1 Hari (Gagal PIN 5x & Umum)',
    description: 'Digunakan otomatis saat gagal PIN 5x atau ban sementara 24 jam dengan 3 tombol tinjau aktif.',
    createdAt: '2026-01-01T00:00:00.000Z',
    config: { ...DEFAULT_BAN_SCREEN_CONFIG },
  },
  {
    id: 'preset-silent-no-reason-no-buttons',
    name: 'Banned Senyap Tanpa Alasan & Tanpa Tombol Banding',
    description: 'Hanya menampilkan judul Akun Anda Telah Dibanned tanpa penjelasan dan tanpa 3 tombol tinjau.',
    createdAt: '2026-01-01T00:00:00.000Z',
    config: {
      ...DEFAULT_BAN_SCREEN_CONFIG,
      durationType: 'permanent',
      durationMinutes: undefined,
      durationLabel: 'PERMANEN',
      reasonMode: 'none',
      reasonText: '',
      reason: '',
      showReasonBox: false,
      showSubtitle: false,
      subtitleText: '',
      showWhatsAppButton: false,
      showEmailButton: false,
      showInAppAppealButton: false,
      showRecommendedLabel: false,
      showCountdown: false,
      showCaseId: false,
      showBannedAtTime: false,
      showStatusBadge: true,
      statusBadgeText: 'BANNED PERMANEN',
      themeVariant: 'pitch_dark',
      theme: 'pitch_dark',
      iconVariant: 'lock',
      icon: 'lock',
      soundEffect: 'mute',
    },
  },
  {
    id: 'preset-warning-trial-1h',
    name: 'Peringatan Kuning Trial 1 Jam (WA & Email Saja)',
    description: 'Tema Kuning Peringatan selama 1 jam dengan tombol WA & Email aktif.',
    createdAt: '2026-01-01T00:00:00.000Z',
    config: {
      ...DEFAULT_BAN_SCREEN_CONFIG,
      durationType: 'custom',
      durationValue: 1,
      durationUnit: 'hours',
      durationMinutes: 60,
      durationLabel: '1 Jam (Trial)',
      reasonMode: 'preset_20',
      presetReasonId: 'qp-03',
      selectedPresetReasonId: 'qp-03',
      reasonText: QUICK_BAN_PRESETS_20[2].reasonText,
      reason: QUICK_BAN_PRESETS_20[2].reasonText,
      showReasonBox: true,
      showWhatsAppButton: true,
      showEmailButton: true,
      showInAppAppealButton: false,
      showRecommendedLabel: true,
      showCountdown: true,
      statusBadgeText: 'PERINGATAN TRIAL · 1 JAM',
      themeVariant: 'warning_amber',
      theme: 'warning_amber',
      iconVariant: 'warning',
      icon: 'warning',
    },
  },
  {
    id: 'preset-frozen-blue-7d',
    name: 'Pembekuan Audit Biru 7 Hari (Lengkap)',
    description: 'Tema Biru Beku selama 7 hari untuk pemeriksaan audit keamanan.',
    createdAt: '2026-01-01T00:00:00.000Z',
    config: {
      ...DEFAULT_BAN_SCREEN_CONFIG,
      durationType: 'custom',
      durationValue: 7,
      durationUnit: 'days',
      durationMinutes: 10080,
      durationLabel: '7 Hari (Audit)',
      reasonMode: 'system_30',
      systemReasonId: 'sys-19',
      selectedSystemReasonId: 'sys-19',
      reasonText: SYSTEM_BAN_REASONS_30[18].reasonText,
      reason: SYSTEM_BAN_REASONS_30[18].reasonText,
      showReasonBox: true,
      statusBadgeText: 'PEMBEKUAN AUDIT · 7 HARI',
      themeVariant: 'frozen_blue',
      theme: 'frozen_blue',
      iconVariant: 'gavel',
      icon: 'gavel',
    },
  },
];

export function computeDurationMinutesAndLabel(
  durationTypeOrConfig: 'custom' | 'permanent' | BanScreenCustomizationConfig,
  valueArg?: number,
  unitArg?: BanDurationUnit,
  specificEndDateArg?: string
): { durationMinutes?: number; durationLabel: string; expiresAt?: string } {
  const durationType =
    typeof durationTypeOrConfig === 'object'
      ? durationTypeOrConfig.durationType
      : durationTypeOrConfig;
  const value =
    typeof durationTypeOrConfig === 'object'
      ? durationTypeOrConfig.durationValue || 1
      : valueArg || 1;
  const unit: BanDurationUnit =
    typeof durationTypeOrConfig === 'object'
      ? durationTypeOrConfig.durationUnit || 'days'
      : unitArg || 'days';
  const specificEndDate =
    typeof durationTypeOrConfig === 'object'
      ? durationTypeOrConfig.specificEndDate
      : specificEndDateArg;

  if (durationType === 'permanent') {
    return {
      durationMinutes: undefined,
      durationLabel: 'PERMANEN',
      expiresAt: undefined,
    };
  }

  const now = Date.now();
  if (unit === 'specific_date' && specificEndDate) {
    const targetMs = new Date(specificEndDate).getTime();
    if (!Number.isNaN(targetMs) && targetMs > now) {
      const diffMins = Math.max(1, Math.round((targetMs - now) / 60000));
      const formattedDate = new Date(targetMs).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        durationMinutes: diffMins,
        durationLabel: `Sampai ${formattedDate}`,
        expiresAt: new Date(targetMs).toISOString(),
      };
    }
  }

  const safeVal = Math.max(1, Number(value) || 1);
  let mins = safeVal;
  let unitLabel = 'Menit';

  if (unit === 'minutes') {
    mins = safeVal;
    unitLabel = `${safeVal} Menit`;
  } else if (unit === 'hours') {
    mins = safeVal * 60;
    unitLabel = `${safeVal} Jam`;
  } else if (unit === 'days') {
    mins = safeVal * 1440;
    unitLabel = safeVal === 1 ? '1 Hari (24 Jam)' : `${safeVal} Hari`;
  } else if (unit === 'weeks') {
    mins = safeVal * 10080;
    unitLabel = `${safeVal} Minggu`;
  } else if (unit === 'months') {
    mins = safeVal * 43200;
    unitLabel = `${safeVal} Bulan`;
  }

  return {
    durationMinutes: mins,
    durationLabel: `${unitLabel} (Trial)`,
    expiresAt: new Date(now + mins * 60000).toISOString(),
  };
}

export function formatBanAppealPrefillMessage(
  paramsOrTemplate?:
    | string
    | {
        template?: string;
        name?: string;
        email?: string;
        accountNumber?: string;
        reason?: string;
        caseId?: string;
        durationLabel?: string;
      },
  varsArg?: {
    nama?: string;
    email?: string;
    rekening?: string;
    alasan?: string;
    caseId?: string;
    durasi?: string;
  }
): string {
  const isStringTemplate = typeof paramsOrTemplate === 'string' || paramsOrTemplate === undefined;
  const rawCandidate = isStringTemplate ? paramsOrTemplate : paramsOrTemplate.template;
  const raw = (rawCandidate !== undefined ? rawCandidate : DEFAULT_BAN_MESSAGE_TEMPLATE).trim();
  const resolvedName = isStringTemplate ? varsArg?.nama : paramsOrTemplate.name;
  const resolvedEmail = isStringTemplate ? varsArg?.email : paramsOrTemplate.email;
  const resolvedAcc = isStringTemplate ? varsArg?.rekening : paramsOrTemplate.accountNumber;
  const resolvedReasonRaw = isStringTemplate ? varsArg?.alasan : paramsOrTemplate.reason;
  const resolvedCaseId = isStringTemplate ? varsArg?.caseId : paramsOrTemplate.caseId;
  const resolvedDuration = isStringTemplate ? varsArg?.durasi : paramsOrTemplate.durationLabel;

  const safeReason =
    resolvedReasonRaw && resolvedReasonRaw.trim().length > 0
      ? resolvedReasonRaw.trim()
      : 'Status Banned';
  return raw
    .replace(/\{nama\}/gi, resolvedName || 'Nasabah')
    .replace(/\{email\}/gi, resolvedEmail || '-')
    .replace(/\{rekening\}/gi, resolvedAcc || '-')
    .replace(/\{alasan\}/gi, safeReason)
    .replace(/\{caseId\}/gi, resolvedCaseId || 'BN-CASE')
    .replace(/\{durasi\}/gi, resolvedDuration || 'Banned');
}
