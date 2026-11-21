import {
  SupportContactCategoryPreset,
  SupportContactSubOptionPreset,
} from '../types/bank';

/**
 * Katalog 10 Kategori Topik & 70 Sub-Pilihan Preset Pesan Otomatis WhatsApp & Email
 * - Setiap kategori memiliki 7 sub-pilihan spesifik (total 70 sub-pilihan).
 * - Setiap sub-pilihan memiliki penjelasan & kronologi preset yang dapat diatur/diedit
 *   baik oleh Nasabah di layar Contact Us maupun oleh Admin di Panel Admin.
 */
export const DEFAULT_SUPPORT_PRESET_CATEGORIES: SupportContactCategoryPreset[] = [
  // ============================================================================
  // 1. AKUN & PROFIL NASABAH
  // ============================================================================
  {
    id: 'akun',
    label: '1. Pengelolaan Akun, Pendaftaran & Profil',
    shortLabel: 'Akun & Profil',
    description: 'Pendaftaran Tab Buat Akun, Login 3 Kredensial, Sambung Google, Alamat 38 Provinsi, & Profil.',
    accentClass: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'akun-buat-tanpa-google',
        categoryId: 'akun',
        label: 'Pendaftaran Akun Baru via Tab "Buat Akun" (Tanpa Google)',
        shortLabel: 'Daftar Tab Buat Akun',
        explanation:
          'Saya baru saja mendaftar rekening baru melalui tab "Buat Akun" di Lobi Awal tanpa sambungan Google dan telah melengkapi identitas KTP, NIK 16 Digit, PIN 6 Digit, serta alamat 38 provinsi. Mohon bantuan pengecekan status registrasi rekening saya agar dapat digunakan secara optimal.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'akun-login-3-kredensial',
        categoryId: 'akun',
        label: 'Kendala Masuk di Tab "Login Ke Akun" (No. Rek, ID 16 Digit & PIN)',
        shortLabel: 'Kendala Login Ke Akun',
        explanation:
          'Saya mengalami kendala saat mencoba masuk melalui tab "Login Ke Akun" menggunakan kombinasi Nomor Rekening, ID User 16 Digit, dan PIN Kartu 6 Digit. Mohon bantuan verifikasi kecocokan data kredensial akun saya agar dapat kembali mengakses Dashboard.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'akun-sambung-google',
        categoryId: 'akun',
        label: 'Bantuan Menyambungkan Rekening ke Akun Google (Zero-Loss Merge)',
        shortLabel: 'Sambungkan ke Google',
        explanation:
          'Saya ingin menyambungkan rekening Bank Nusantara saya yang saat ini belum terhubung ke Google agar tersinkronisasi penuh ke Cloud dan digabungkan secara aman tanpa menghapus kartu yang sudah ada. Mohon panduan atau pengecekan status tautan email Google pada akun saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'akun-alamat-38-provinsi',
        categoryId: 'akun',
        label: 'Pembaruan Data Alamat Domisili KTP (38 Provinsi hingga RT/RW)',
        shortLabel: 'Ubah Alamat Domisili',
        explanation:
          'Saya mengajukan pembaruan data alamat domisili lengkap sesuai KTP (mulai dari Provinsi, Kabupaten/Kota, Kecamatan, Desa/Kelurahan, Kode Pos, hingga RT/RW) pada profil rekening saya. Mohon bantuan pembaruan dan validasi data domisili terbaru saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'akun-lupa-userid-norek',
        categoryId: 'akun',
        label: 'Permohonan Cek Ulang ID User 16 Digit atau Nomor Rekening',
        shortLabel: 'Lupa ID 16 Digit / No. Rek',
        explanation:
          'Saya membutuhkan bantuan pengecekan kembali informasi Nomor Rekening 10 Digit dan ID User 16 Digit milik saya karena catatan kredensial sebelumnya tidak tersimpan di perangkat ini.Saya siap melakukan verifikasi identitas Nama Lengkap dan NIK KTP.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'akun-perubahan-biodata',
        categoryId: 'akun',
        label: 'Koreksi Nama Lengkap, NIK 16 Digit, atau Nomor HP Terdaftar',
        shortLabel: 'Koreksi Biodata & HP',
        explanation:
          'Terdapat kesalahan penulisan pada biodata profil akun saya (Nama Lengkap / NIK 16 Digit / Nomor HP aktif). Mohon bantuan Tim Admin untuk menyesuaikan data identitas profil rekening saya agar sesuai dengan dokumen KTP resmi.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'akun-sinkronisasi-perangkat',
        categoryId: 'akun',
        label: 'Sinkronisasi Data Akun Saat Pindah Perangkat (HP ke Laptop)',
        shortLabel: 'Pindah HP / Laptop',
        explanation:
          'Saya sedang mengakses akun Bank Nusantara dari perangkat baru (HP/Laptop) dan ingin memastikan seluruh saldo, daftar kartu, serta riwayat mutasi tersinkronisasi penuh dengan data terbaru di server Cloud.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 2. KARTU DEBIT & KREDIT
  // ============================================================================
  {
    id: 'kartu',
    label: '2. Penggunaan Kartu ATM, Aktivasi & Upgrade Tier',
    shortLabel: 'Kartu & Tier',
    description: 'Persetujuan kartu baru, upgrade tier Reguler/Gold/Platinum/Prioritas, buka beku, & limit.',
    accentClass: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'kartu-persetujuan-admin',
        categoryId: 'kartu',
        label: 'Permohonan Persetujuan (Approval) Kartu Baru yang Masih Pending',
        shortLabel: 'Aktivasi Kartu Pending',
        explanation:
          'Kartu Bank Nusantara saya saat ini masih berstatus "Menunggu Persetujuan Admin" (Pending Approval). Seluruh data identitas dan alamat KTP sudah saya isi dengan benar. Mohon bantuan Tim Admin untuk meninjau dan menyetujui aktivasi kartu saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'kartu-upgrade-tier',
        categoryId: 'kartu',
        label: 'Pengajuan Upgrade Tier Kartu (Reguler ke Gold / Platinum / Prioritas)',
        shortLabel: 'Upgrade Tier Kartu',
        explanation:
          'Saya ingin meningkatkan (upgrade) jenis kartu rekening saya ke tier yang lebih tinggi agar memperoleh limit transaksi harian dan plafon pinjaman yang lebih besar. Mohon informasi persyaratan dan bantuan pemrosesan upgrade tier kartu saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'kartu-buka-freeze',
        categoryId: 'kartu',
        label: 'Permohonan Membuka Pembekuan Kartu (Unfreeze Kartu)',
        shortLabel: 'Buka Beku (Unfreeze)',
        explanation:
          'Kartu saya saat ini sedang dalam kondisi Dibekukan (Frozen) sehingga tidak dapat melakukan transaksi keluar. Saya mengonfirmasi bahwa rekening sudah aman di tangan saya dan memohon bantuan pembukaan status beku kartu.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'kartu-limit-transaksi',
        categoryId: 'kartu',
        label: 'Penyesuaian Limit Transaksi Harian Kartu ATM',
        shortLabel: 'Atur Limit Kartu',
        explanation:
          'Saya membutuhkan penyesuaian atau pengecekan batas limit transaksi harian pada kartu aktif saya karena hendak melakukan transaksi dengan nominal di atas batas standar.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'kartu-tambah-multi-kartu',
        categoryId: 'kartu',
        label: 'Pembuatan Kartu Tambahan (Multi-Kartu) dalam Satu Akun',
        shortLabel: 'Tambah Kartu Baru',
        explanation:
          'Saya ingin mengajukan penerbitan kartu tambahan di dalam akun Bank Nusantara saya untuk memisahkan dana tabungan dan transaksi harian. Mohon bantuan verifikasi pengajuan kartu tambahan saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'kartu-ditolak-admin',
        categoryId: 'kartu',
        label: 'Klarifikasi & Pengajuan Ulang Kartu yang Berstatus Ditolak',
        shortLabel: 'Klarifikasi Kartu Ditolak',
        explanation:
          'Pengajuan kartu saya sebelumnya berstatus Ditolak (Rejected). Saya telah memperbaiki kelengkapan data identitas dan alamat domisili sesuai ketentuan, serta memohon peninjauan ulang aktivasi kartu saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'kartu-cvv-masa-berlaku',
        categoryId: 'kartu',
        label: 'Pengecekan Masa Berlaku (Expiry Date) & Tampilan Visual Kartu',
        shortLabel: 'Masa Berlaku & Visual Kartu',
        explanation:
          'Saya ingin menanyakan informasi terkait masa berlaku kartu virtual/fisik pada Dashboard serta memastikan nomor kartu 16 digit saya tetap aktif untuk seluruh layanan.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 3. OPERASIONAL ATM & TUNAI
  // ============================================================================
  {
    id: 'atm',
    label: '3. Operasional Mesin ATM, Tarik & Setor Tunai',
    shortLabel: 'Operasional ATM',
    description: 'Simulator ATM, tarik/setor tunai, token tanpa kartu, ganti PIN di ATM, & struk digital.',
    accentClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'atm-tarik-tunai-kendala',
        categoryId: 'atm',
        label: 'Kendala Tarik Tunai pada Mesin Simulator ATM',
        shortLabel: 'Kendala Tarik Tunai ATM',
        explanation:
          'Saya mengalami kendala saat melakukan penarikan tunai pada menu Mesin ATM (transaksi gagal atau saldo terpotong namun struk penarikan belum keluar). Mohon bantuan pengecekan log transaksi ATM pada rekening saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'atm-setor-tunai-belum-masuk',
        categoryId: 'atm',
        label: 'Setor Tunai di Mesin ATM (CDM) Saldo Belum Bertambah',
        shortLabel: 'Setor Tunai Belum Masuk',
        explanation:
          'Saya telah melakukan transaksi Setor Tunai melalui menu Mesin ATM Bank Nusantara, namun nominal saldo utama belum bertambah sesuai jumlah uang yang disetorkan. Mohon bantuan rekonsiliasi saldo setoran saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'atm-token-tanpa-kartu',
        categoryId: 'atm',
        label: 'Kendala Kode Token Tarik Tunai Tanpa Kartu (Cardless)',
        shortLabel: 'Token Tanpa Kartu',
        explanation:
          'Saya membuat kode token Tarik Tunai Tanpa Kartu (Cardless Withdrawal), namun kode token tersebut tidak dapat diproses atau kedaluwarsa sebelum dana ditarik di mesin ATM. Mohon pengecekan status dana saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'atm-ganti-pin-mesin',
        categoryId: 'atm',
        label: 'Bantuan Penggantian PIN 6 Digit Melalui Menu Mesin ATM',
        shortLabel: 'Ganti PIN di ATM',
        explanation:
          'Saya baru saja melakukan perubahan PIN Kartu 6 Digit melalui antarmuka Mesin ATM dan ingin memastikan PIN terbaru saya sudah aktif tersinkronisasi untuk login dan transaksi.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'atm-struk-digital',
        categoryId: 'atm',
        label: 'Permohonan Salinan Struk Digital Transaksi Mesin ATM',
        shortLabel: 'Salinan Struk ATM',
        explanation:
          'Saya membutuhkan salinan bukti struk digital resmi atas transaksi yang saya lakukan di Mesin ATM Bank Nusantara sebagai bukti pembayaran/penarikan yang sah.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'atm-pecahan-limit',
        categoryId: 'atm',
        label: 'Informasi Pecahan Uang & Batas Maksimal Sekali Tarik di ATM',
        shortLabel: 'Pecahan & Limit ATM',
        explanation:
          'Saya mengalami penolakan nominal saat memasukkan angka penarikan di Mesin ATM dan ingin memastikan aturan kelipatan pecahan uang serta batas maksimal penarikan per transaksi.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'atm-kartu-tertelan-sesi',
        categoryId: 'atm',
        label: 'Sesi Mesin ATM Terputus Sebelum Kartu Dikeluarkan (Eject)',
        shortLabel: 'Sesi ATM Terputus',
        explanation:
          'Koneksi atau layar perangkat saya tertutup saat kartu masih berada di dalam sesi Mesin ATM. Mohon bantuan memastikan sesi ATM saya telah ditutup dengan aman dan tidak ada transaksi ganda.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 4. PINJAMAN DARING & KOTAK HUTANG
  // ============================================================================
  {
    id: 'pinjaman',
    label: '4. Pinjaman Daring, Cicilan & Kotak Hutang',
    shortLabel: 'Pinjaman & Hutang',
    description: 'Pengajuan pinjaman daring, cicilan, pelunasan dipercepat, tenggat Kotak Hutang, & bunga.',
    accentClass: 'text-violet-300 bg-violet-500/15 border-violet-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'pinjaman-pengajuan-baru',
        categoryId: 'pinjaman',
        label: 'Permohonan Peninjauan & Pencairan Pengajuan Pinjaman Daring',
        shortLabel: 'Pencairan Pinjaman Baru',
        explanation:
          'Saya telah mengajukan fasilitas Pinjaman Daring resmi melalui Dashboard Bank Nusantara. Mohon bantuan Tim Admin untuk meninjau kelayakan akun saya agar dana pinjaman dapat segera dicairkan ke saldo utama.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pinjaman-bayar-cicilan',
        categoryId: 'pinjaman',
        label: 'Konfirmasi Pembayaran Cicilan Pinjaman Bulanan',
        shortLabel: 'Bayar Cicilan Pinjaman',
        explanation:
          'Saya ingin melakukan atau mengonfirmasi pembayaran tagihan cicilan pinjaman aktif saya agar tercatat lunas tepat waktu dan sisa pokok pinjaman diperbarui.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pinjaman-pelunasan-cepat',
        categoryId: 'pinjaman',
        label: 'Permohonan Pelunasan Dipercepat (Full Settlement) Pinjaman',
        shortLabel: 'Pelunasan Dipercepat',
        explanation:
          'Saya berencana melunasi seluruh sisa pokok pinjaman daring saya lebih awal sebelum jatuh tempo tenor berakhir. Mohon rincian total tagihan akhir dan bantuan proses penutupan kontrak pinjaman.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pinjaman-kotak-hutang',
        categoryId: 'pinjaman',
        label: 'Penjelasan Tagihan & Hitung Mundur Tenggat di Tab Kotak Hutang',
        shortLabel: 'Tagihan Kotak Hutang',
        explanation:
          'Pada akun saya terdapat catatan tagihan aktif di menu Kotak Hutang beserta hitung mundur tenggat waktu. Mohon penjelasan rincian tagihan tersebut dan panduan pelunasannya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pinjaman-perpanjangan-tenggat',
        categoryId: 'pinjaman',
        label: 'Permohonan Restrukturisasi / Perpanjangan Tenggat Kotak Hutang',
        shortLabel: 'Perpanjangan Tenggat Hutang',
        explanation:
          'Saya memohon kebijaksanaan Tim Admin untuk memberikan keringanan berupa perpanjangan waktu tenggat (restrukturisasi) pada tagihan Kotak Hutang saya agar terhindar dari penalti keterlambatan.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pinjaman-potong-otomatis',
        categoryId: 'pinjaman',
        label: 'Pertanyaan Pemotongan Saldo Otomatis (Auto-Debit) Tagihan Hutang',
        shortLabel: 'Auto-Debit Tagihan Hutang',
        explanation:
          'Saldo rekening saya terpotong secara otomatis untuk pembayaran tagihan jatuh tempo. Mohon rincian mutasi auto-debit tersebut dan sisa kewajiban hutang pada akun saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pinjaman-kenaikan-plafon',
        categoryId: 'pinjaman',
        label: 'Pengajuan Kenaikan Plafon Maksimal Pinjaman Daring',
        shortLabel: 'Naikkan Plafon Pinjaman',
        explanation:
          'Riwayat pembayaran pinjaman saya selama ini selalu lancar dan tepat waktu. Saya ingin mengajukan permohonan peningkatan batas plafon pinjaman maksimal pada rekening saya.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 5. KEAMANAN, PIN & PRIVASI
  // ============================================================================
  {
    id: 'keamanan',
    label: '5. Keamanan Akun, Reset PIN & Perlindungan Privasi',
    shortLabel: 'Keamanan & PIN',
    description: 'Reset PIN 6 digit, laporan transaksi asing, VIP Shield, anti-phishing, & penguncian darurat.',
    accentClass: 'text-rose-300 bg-rose-500/15 border-rose-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'keamanan-lupa-pin',
        categoryId: 'keamanan',
        label: 'Permohonan Reset PIN Kartu 6 Digit karena Lupa PIN',
        shortLabel: 'Lupa & Reset PIN 6 Digit',
        explanation:
          'Saya lupa kode PIN 6 Digit pada kartu Bank Nusantara saya dan khawatir kartu terkunci jika salah memasukkan PIN berulang kali. Mohon bantuan verifikasi identitas untuk melakukan reset PIN kartu saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'keamanan-transaksi-asing',
        categoryId: 'keamanan',
        label: 'Laporan Darurat Transaksi Mencurigakan yang Tidak Dikenal',
        shortLabel: 'Laporan Transaksi Asing',
        explanation:
          'Saya menemukan adanya mutasi transaksi keluar yang tidak pernah saya lakukan pada riwayat rekening saya. Saya telah membekukan kartu sementara dan memohon investigasi keamanan segera dari Tim Admin.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'keamanan-vip-shield',
        categoryId: 'keamanan',
        label: 'Aktivasi & Pengaturan Perlindungan Berlapis (Security Command Center)',
        shortLabel: 'Pusat Keamanan & Shield',
        explanation:
          'Saya ingin meningkatkan tingkat keamanan rekening saya melalui Pusat Keamanan (Security Center) dan memohon panduan pengaktifan proteksi maksimal agar akun terlindung dari akses tidak sah.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'keamanan-lapor-phishing',
        categoryId: 'keamanan',
        label: 'Pelaporan Upaya Penipuan / Phishing Mengatasnamakan Bank Nusantara',
        shortLabel: 'Lapor Penipuan / Phishing',
        explanation:
          'Saya menerima pesan mencurigakan dari pihak luar yang meminta data kredensial dengan mengatasnamakan Bank Nusantara. Saya tidak memberikan PIN/CVV dan ingin melaporkan oknum tersebut kepada Admin.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'keamanan-kunci-darurat',
        categoryId: 'keamanan',
        label: 'Permohonan Penguncian Darurat Sementara karena Perangkat Hilang',
        shortLabel: 'Kunci Darurat HP Hilang',
        explanation:
          'Perangkat (HP/Laptop) tempat saya biasa mengakses akun Bank Nusantara sedang hilang atau berpindah tangan. Mohon bantuan pengamanan dan penguncian sesi pada perangkat lama saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'keamanan-audit-login',
        categoryId: 'keamanan',
        label: 'Pemeriksaan Riwayat Sesi Login & Aktivitas Keamanan Akun',
        shortLabel: 'Cek Riwayat Sesi Login',
        explanation:
          'Saya ingin meminta pengecekan riwayat aktivitas login dan sinkronisasi pada rekening saya untuk memastikan hanya perangkat pribadi saya yang terhubung.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'keamanan-notifikasi-10-jenis',
        categoryId: 'keamanan',
        label: 'Pengaturan Izin 10 Kategori Notifikasi Keamanan & Transaksi',
        shortLabel: 'Atur 10 Jenis Notifikasi',
        explanation:
          'Saya ingin memastikan seluruh 10 kategori notifikasi keamanan dan mutasi transaksi menyala dengan benar pada akun saya agar setiap aktivitas tercatat secara real-time.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 6. TRANSFER & MUTASI REKENING
  // ============================================================================
  {
    id: 'transfer',
    label: '6. Transfer Dana, Mutasi & Riwayat Transaksi',
    shortLabel: 'Transfer & Mutasi',
    description: 'Transfer antar rekening, salah nomor tujuan, bukti referensi mutasi, & batas transfer.',
    accentClass: 'text-sky-300 bg-sky-500/15 border-sky-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'transfer-tertunda-belum-masuk',
        categoryId: 'transfer',
        label: 'Transfer Antar Rekening Berhasil namun Saldo Penerima Belum Masuk',
        shortLabel: 'Transfer Belum Masuk',
        explanation:
          'Saya telah melakukan transfer dana ke rekening tujuan di Bank Nusantara dan saldo saya sudah terpotong, namun pihak penerima menyampaikan dana belum masuk. Mohon bantuan pelacakan mutasi transfer tersebut.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'transfer-salah-rekening',
        categoryId: 'transfer',
        label: 'Permohonan Bantuan Mediasi Salah Input Nomor Rekening Tujuan',
        shortLabel: 'Salah Rekening Tujuan',
        explanation:
          'Saya tidak sengaja memasukkan nomor rekening tujuan yang keliru saat melakukan transfer dana. Mohon bantuan Tim Admin untuk meninjau riwayat transfer terakhir saya dan memediasi pengembalian dana.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'transfer-antar-kartu-sendiri',
        categoryId: 'transfer',
        label: 'Kendala Pemindahan Dana Antar Kartu di Dalam Akun yang Sama',
        shortLabel: 'Transfer Antar Kartu Sendiri',
        explanation:
          'Saya memiliki lebih dari satu kartu di akun Bank Nusantara dan mengalami kendala saat memindahkan saldo dari kartu utama ke kartu kedua saya. Mohon bantuan pengecekan status kedua kartu saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'transfer-bukti-referensi',
        categoryId: 'transfer',
        label: 'Verifikasi Keaslian Bukti Transfer & Nomor Referensi Mutasi',
        shortLabel: 'Cek Bukti & No. Referensi',
        explanation:
          'Saya ingin memverifikasi keaslian bukti transaksi dan nomor referensi mutasi yang tercatat pada buku riwayat transaksi rekening saya untuk keperluan konfirmasi pembayaran.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'transfer-limit-maksimal',
        categoryId: 'transfer',
        label: 'Kendala Batas Maksimal Nominal Transfer Sekali Kirim / Harian',
        shortLabel: 'Kendala Limit Transfer',
        explanation:
          'Transaksi transfer saya tertolak karena melewati batas maksimal nominal transfer untuk tier kartu saya saat ini. Mohon panduan atau bantuan penyesuaian limit transfer.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'transfer-kantong-deposito',
        categoryId: 'transfer',
        label: 'Pemindahan Saldo Antara Rekening Utama, Kantong Tabungan & Deposito',
        shortLabel: 'Mutasi Kantong & Deposito',
        explanation:
          'Saya membutuhkan bantuan terkait pencairan atau pemindahan dana dari fitur Kantong Tabungan / Deposito Berjangka kembali ke saldo aktif rekening utama saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'transfer-cetak-rekening-koran',
        categoryId: 'transfer',
        label: 'Permohonan Rekapitulasi Riwayat Mutasi Rekening Lengkap',
        shortLabel: 'Rekap Mutasi Rekening',
        explanation:
          'Saya membutuhkan bantuan pengecekan rekapitulasi riwayat mutasi uang masuk dan uang keluar secara lengkap pada rekening saya untuk audit saldo.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 7. INVESTASI EMAS 24K
  // ============================================================================
  {
    id: 'emas',
    label: '7. Investasi Emas 24K, Buyback & Transfer Gramasi',
    shortLabel: 'Emas 24K',
    description: 'Beli Emas 24K, jual/buyback ke Rupiah, transfer gramasi emas, cetak fisik, & harga real-time.',
    accentClass: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'emas-beli-gram-belum-masuk',
        categoryId: 'emas',
        label: 'Pembelian Emas 24K Saldo Rupiah Terpotong namun Gramasi Belum Bertambah',
        shortLabel: 'Beli Emas Belum Masuk',
        explanation:
          'Saya melakukan pembelian Emas 24K melalui tab Emas di Dashboard dan saldo Rupiah saya telah terpotong, tetapi jumlah saldo gramasi emas pada brankas saya belum bertambah. Mohon pengecekan transaksi emas saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'emas-jual-buyback',
        categoryId: 'emas',
        label: 'Penjualan Kembali (Buyback) Emas 24K ke Saldo Rupiah Utama',
        shortLabel: 'Buyback Emas ke Rupiah',
        explanation:
          'Saya ingin melakukan penjualan kembali (buyback) kepemilikan gramasi Emas 24K saya ke saldo Rupiah utama dan memohon pengecekan nilai pencairan berdasarkan harga buyback saat ini.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'emas-transfer-antar-nasabah',
        categoryId: 'emas',
        label: 'Kendala Transfer Gramasi Emas 24K ke Rekening Nasabah Lain',
        shortLabel: 'Transfer Gramasi Emas',
        explanation:
          'Saya mencoba mengirimkan aset gramasi Emas 24K ke nomor rekening nasabah Bank Nusantara lainnya melalui fitur Transfer Aset Emas dan membutuhkan bantuan verifikasi pengiriman.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'emas-cetak-fisik',
        categoryId: 'emas',
        label: 'Permohonan Cetak Fisik Emas Batangan 24K Bersertifikat',
        shortLabel: 'Cetak Fisik Emas 24K',
        explanation:
          'Saldo tabungan Emas 24K saya sudah mencukupi untuk dicetak menjadi emas fisik batangan. Mohon informasi prosedur cetak fisik dan verifikasi alamat pengiriman sesuai domisili KTP saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'emas-harga-pasar-realtime',
        categoryId: 'emas',
        label: 'Pertanyaan Pergerakan Harga Beli & Harga Buyback Emas 24K',
        shortLabel: 'Info Harga Emas 24K',
        explanation:
          'Saya ingin menanyakan informasi terkait pembaruan grafik harga beli dan harga buyback Emas 24K per gram serta perhitungan estimasi nilai portofolio emas saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'emas-minimal-transaksi',
        categoryId: 'emas',
        label: 'Ketentuan Minimal Gramasi Pembelian, Penjualan & Transfer Emas',
        shortLabel: 'Minimal Gramasi Emas',
        explanation:
          'Saya mengalami kendala batas minimal pecahan gram saat menginput jumlah transaksi pada menu Emas 24K dan memohon panduan ketentuan minimal transaksi emas.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'emas-riwayat-portofolio',
        categoryId: 'emas',
        label: 'Sinkronisasi Riwayat Transaksi & Total Aset Portofolio Emas 24K',
        shortLabel: 'Sinkronisasi Portofolio Emas',
        explanation:
          'Saya ingin memastikan seluruh riwayat pembelian, penjualan, dan kiriman hadiah Emas 24K pada akun saya telah tercatat secara akurat di brankas portofolio.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 8. SPIN WHEEL, KOIN & SURAT HADIAH
  // ============================================================================
  {
    id: 'spin',
    label: '8. Spin the Wheel, Coin Nusantara, Redeem & Surat Hadiah',
    shortLabel: 'Spin & Hadiah',
    description: 'Putaran Spin Wheel, penukaran Coin Nusantara, Kode Redeem, & Surat/Kotak Hadiah Admin.',
    accentClass: 'text-fuchsia-300 bg-fuchsia-500/15 border-fuchsia-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'spin-hadiah-belum-masuk',
        categoryId: 'spin',
        label: 'Hadiah Putaran Spin the Wheel Belum Masuk ke Saldo / Koin',
        shortLabel: 'Hadiah Spin Belum Masuk',
        explanation:
          'Saya baru saja memutar roda keberuntungan Spin the Wheel dan mendapatkan hadiah, namun nominal hadiah tersebut belum bertambah pada saldo uang/emas/koin rekening saya. Mohon bantuan pengecekan log Spin.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'spin-tukar-coin-nusantara',
        categoryId: 'spin',
        label: 'Bantuan Penukaran Coin Nusantara ke Saldo Rupiah atau Hadiah',
        shortLabel: 'Tukar Coin Nusantara',
        explanation:
          'Saya telah mengumpulkan Coin Nusantara pada akun saya dan ingin menanyakan prosedur atau bantuan penukaran koin tersebut menjadi saldo aktif maupun tiket putaran Spin.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'spin-buka-surat-hadiah-admin',
        categoryId: 'spin',
        label: 'Kendala Membuka Amplop Surat & Klaim Kotak Hadiah Royal Admin',
        shortLabel: 'Klaim Surat & Hadiah Admin',
        explanation:
          'Terdapat paket kiriman di menu "Surat & Hadiah Admin" pojok kanan bawah Dashboard saya, namun saya mengalami kendala saat membuka amplop surat atau mengklaim isi kotak hadiahnya. Mohon bantuan Admin.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'spin-transfer-kotak-hadiah',
        categoryId: 'spin',
        label: 'Bantuan Fitur Transfer Kotak Hadiah Admin ke Rekening Teman',
        shortLabel: 'Transfer Kotak Hadiah',
        explanation:
          'Saya ingin meneruskan (transfer) Kotak Hadiah Admin yang belum saya buka kepada nomor rekening teman saya dan memohon panduan atau pengecekan status pengiriman paket hadiah tersebut.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'spin-kode-redeem',
        categoryId: 'spin',
        label: 'Kendala Klaim Voucher / Kode Redeem Resmi Bank Nusantara',
        shortLabel: 'Kendala Kode Redeem',
        explanation:
          'Saya mencoba memasukkan kode redeem hadiah pada menu Klaim Redeem, namun muncul pesan kode tidak valid atau kuota habis. Mohon bantuan pengecekan masa aktif kode redeem tersebut.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'spin-jadwal-hadiah-terkunci',
        categoryId: 'spin',
        label: 'Pertanyaan Paket Surat & Hadiah yang Masih Berstatus Terkunci Jadwal',
        shortLabel: 'Hadiah Terkunci Jadwal',
        explanation:
          'Pada daftar Surat & Hadiah di akun saya terdapat paket yang masih berstatus terkunci jadwal buka. Mohon informasi kapan paket tersebut dapat dibuka dan diklaim.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'spin-tiket-putaran-tambahan',
        categoryId: 'spin',
        label: 'Informasi Kuota Tiket Spin Harian & Bonus Putaran Loyalitas',
        shortLabel: 'Kuota Tiket Spin',
        explanation:
          'Saya ingin menanyakan ketentuan pembaruan kuota tiket Spin the Wheel harian serta cara memperoleh tambahan tiket putaran resmi dari aktivitas perbankan.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 9. BANDING BANNED & PEMBEKUAN AKUN
  // ============================================================================
  {
    id: 'banned',
    label: '9. Banding Akun Ditangguhkan (Banned) & Pemulihan Akses',
    shortLabel: 'Banding Banned',
    description: 'Pengajuan banding resmi akun Banned, klarifikasi false-positive, & pemulihan akses rekening.',
    accentClass: 'text-orange-300 bg-orange-500/15 border-orange-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'banned-permohonan-banding',
        categoryId: 'banned',
        label: 'Permohonan Banding Resmi Pembukaan Status Akun Ditangguhkan (Banned)',
        shortLabel: 'Permohonan Buka Banned',
        explanation:
          'Akun atau kartu Bank Nusantara saya saat ini terkena penangguhan (Banned). Melalui tiket ini saya mengajukan permohonan banding resmi agar Tim Admin berkenan meninjau kembali aktivitas akun saya dan memulihkan akses rekening.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'banned-false-positive',
        categoryId: 'banned',
        label: 'Klarifikasi Penangguhan Otomatis karena Kesalahan Deteksi (False Positive)',
        shortLabel: 'Klarifikasi Salah Deteksi',
        explanation:
          'Saya meyakini penangguhan pada akun saya terjadi akibat kesalahpahaman atau deteksi otomatis sistem saat saya melakukan transaksi wajar. Saya siap memberikan bukti kronologi transaksi yang sebenarnya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'banned-keringanan-durasi',
        categoryId: 'banned',
        label: 'Permohonan Pengurangan Durasi Penangguhan Sementara (Temporary Ban)',
        shortLabel: 'Keringanan Durasi Banned',
        explanation:
          'Saya memahami alasan penangguhan sementara pada akun saya dan berkomitmen mematuhi seluruh kebijakan Bank Nusantara. Saya memohon kebijaksanaan Admin untuk mempercepat pemulihan akun saya karena kebutuhan transaksi mendesak.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'banned-penjelasan-alasan',
        categoryId: 'banned',
        label: 'Permohonan Rincian Alasan & Bukti Pelanggaran Penangguhan Akun',
        shortLabel: 'Tanya Alasan Banned',
        explanation:
          'Saya ingin menanyakan rincian alasan teknis maupun catatan pelanggaran yang menyebabkan akun saya ditangguhkan agar saya dapat memberikan klarifikasi yang tepat sasaran.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'banned-terkunci-pin-3x',
        categoryId: 'banned',
        label: 'Pemulihan Kartu yang Terblokir Otomatis Akibat Salah PIN 3 Kali',
        shortLabel: 'Terblokir Salah PIN 3x',
        explanation:
          'Kartu saya terblokir otomatis setelah salah memasukkan kode PIN 6 Digit sebanyak 3 kali berturut-turut. Saya adalah pemilik sah rekening ini dan memohon bantuan pembukaan blokir PIN.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'banned-waktu-habis-belum-pulih',
        categoryId: 'banned',
        label: 'Masa Penangguhan Sementara Telah Berakhir namun Akun Belum Terbuka',
        shortLabel: 'Waktu Banned Sudah Habis',
        explanation:
          'Berdasarkan informasi tanggal berakhirnya penangguhan, masa Banned sementara akun saya seharusnya sudah selesai, namun status kartu masih terkunci. Mohon bantuan pelepasan status Banned pada akun saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'banned-janji-kepatuhan',
        categoryId: 'banned',
        label: 'Pernyataan Kepatuhan & Verifikasi Ulang Identitas Pemilik Rekening',
        shortLabel: 'Verifikasi Ulang & Kepatuhan',
        explanation:
          'Saya bersedia mengikuti prosedur verifikasi ulang identitas KTP serta menyatakan janji kepatuhan untuk menggunakan seluruh fitur Bank Nusantara secara jujur sesuai syarat dan ketentuan layanan.',
        isDefault: true,
        isActive: true,
      },
    ],
  },

  // ============================================================================
  // 10. KENDALA TEKNIS, AKUN OA, GUEST & SINKRONISASI
  // ============================================================================
  {
    id: 'teknis',
    label: '10. Kendala Teknis, Akun OA/Guest, Sinkronisasi & Masukan',
    shortLabel: 'Teknis & Sistem',
    description: 'Laporan bug tampilan HP/Laptop, sinkronisasi Cloud, Akun OA, Akun Guest, & usulan fitur.',
    accentClass: 'text-teal-300 bg-teal-500/15 border-teal-500/40',
    isDefault: true,
    isActive: true,
    subOptions: [
      {
        id: 'teknis-tampilan-hp-laptop',
        categoryId: 'teknis',
        label: 'Laporan Kendala Tampilan Antarmuka di Layar HP atau Laptop',
        shortLabel: 'Bug Tampilan HP / Laptop',
        explanation:
          'Saya ingin melaporkan kendala tampilan antarmuka aplikasi saat diakses menggunakan perangkat saya (HP/Laptop) agar dapat segera diperbaiki oleh tim pengembang dan Admin.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'teknis-sinkronisasi-cloud',
        categoryId: 'teknis',
        label: 'Kendala Status Sinkronisasi Cloud Firestore / Data Lambat Memuat',
        shortLabel: 'Kendala Sinkronisasi Cloud',
        explanation:
          'Indikator sinkronisasi Cloud pada Navbar akun saya terlihat tertunda atau data terbaru belum langsung muncul setelah halaman dimuat ulang. Mohon bantuan pengecekan sinkronisasi data akun saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'teknis-akun-oa',
        categoryId: 'teknis',
        label: 'Bantuan Akses & Kredensial Khusus Login Dengan Akun OA (Official Admin)',
        shortLabel: 'Bantuan Login Akun OA',
        explanation:
          'Saya memiliki otorisasi Akun OA (Official Admin Account) dan membutuhkan bantuan pengecekan ID User 16 Digit, PIN, atau kata sandi khusus pada jalur "Login Dengan Akun OA".',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'teknis-akun-guest',
        categoryId: 'teknis',
        label: 'Pertanyaan seputar Batas 1 Perangkat & Peningkatan Akun Guest',
        shortLabel: 'Bantuan Akun Guest',
        explanation:
          'Saya saat ini masuk menggunakan Akun Guest (Tanpa Alamat) di perangkat ini dan ingin menanyakan cara mengamankan saldo Akun Guest saya dengan menyambungkannya ke akun Google.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'teknis-fitur-chat-notifikasi',
        categoryId: 'teknis',
        label: 'Kendala Pesan Obrolan (Global Chat) atau Popup Pengumuman Sistem',
        shortLabel: 'Kendala Chat & Pengumuman',
        explanation:
          'Saya mengalami kendala saat membuka fitur obrolan atau membaca pengumuman sistem di Dashboard dan memohon pengecekan status layanan komunikasi pada akun saya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'teknis-saran-fitur',
        categoryId: 'teknis',
        label: 'Penyampaian Saran Pengembangan Fitur & Apresiasi Layanan',
        shortLabel: 'Saran & Masukan Fitur',
        explanation:
          'Saya ingin menyampaikan saran pengembangan fitur serta masukan positif untuk peningkatan kenyamanan layanan digital PT Bank Nusantara (Persero) Tbk ke depannya.',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'teknis-lainnya',
        categoryId: 'teknis',
        label: 'Konsultasi & Bantuan Layanan Perbankan Umum Lainnya',
        shortLabel: 'Bantuan Umum Lainnya',
        explanation:
          'Saya ingin berkonsultasi langsung dengan Tim Layanan Nasabah & Admin Resmi Bank Nusantara terkait pertanyaan layanan perbankan yang belum tercantum pada daftar kategori di atas.',
        isDefault: true,
        isActive: true,
      },
    ],
  },
];

export function cloneDefaultPresetCategories(): SupportContactCategoryPreset[] {
  return DEFAULT_SUPPORT_PRESET_CATEGORIES.map((cat) => ({
    ...cat,
    subOptions: cat.subOptions.map((sub) => ({ ...sub })),
  }));
}

export function getResolvedPresetCategories(
  customCategories?: SupportContactCategoryPreset[]
): SupportContactCategoryPreset[] {
  if (Array.isArray(customCategories) && customCategories.length > 0) {
    return customCategories.map((cat) => ({
      ...cat,
      subOptions: Array.isArray(cat.subOptions) ? cat.subOptions : [],
    }));
  }
  return cloneDefaultPresetCategories();
}

export function combineSubOptionExplanations(
  subOptions: SupportContactSubOptionPreset[]
): string {
  if (!subOptions || subOptions.length === 0) {
    return 'Saya ingin mengajukan permohonan bantuan dan pengecekan resmi pada rekening Bank Nusantara milik saya.';
  }
  if (subOptions.length === 1) {
    return subOptions[0].explanation;
  }
  return subOptions
    .map(
      (sub, idx) =>
        `${idx + 1}. [${sub.shortLabel || sub.label}]\n   ${sub.explanation}`
    )
    .join('\n\n');
}
