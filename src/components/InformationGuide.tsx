/**
 * Bank Nusantara Official Knowledge Base & Encyclopedic 30-Chapter Master Guide
 * Massively expanded with comprehensive guides, comparisons, ATM procedures,
 * security protocols, card upgrade rules, admin approval SOP, and 20+ digital banking guides.
 */
import React, { useState } from 'react';
import {
  BookOpen,
  CreditCard,
  UserCheck,
  Cpu,
  MonitorPlay,
  Layers,
  Hash,
  Send,
  BellRing,
  ShieldAlert,
  BadgeDollarSign,
  Search,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Info,
  Lock,
  Unlock,
  KeyRound,
  FileText,
  DollarSign,
  Smartphone,
  Zap,
  HelpCircle,
  TrendingUp,
  Clock,
  Printer,
  RotateCcw,
  QrCode,
  Wallet,
  Droplets,
  HeartPulse,
  RefreshCw,
  Globe,
  Share2,
  MessageSquare,
  ShieldCheck,
  Building2,
  AlertCircle,
  History,
  Bug,
  Wrench,
  Gift,
  Package,
  Crown,
} from 'lucide-react';
import { formatRupiah, CARD_TIER_CONFIGS, LOAN_TIER_CONFIGS } from '../utils/bankUtils';

interface InformationGuideProps {
  onNavigateToTab: (tab: 'dashboard' | 'atm' | 'admin' | 'updates' | 'chat', subTab?: string) => void;
  onOpenRegisterModal: () => void;
}

interface ExtraChapterContent {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  color: string;
  icon: React.ElementType;
  sections: {
    heading: string;
    body: string;
    bullets?: string[];
  }[];
}

const EXTRA_CHAPTERS_DATA: ExtraChapterContent[] = [
  {
    id: 32,
    badge: 'BAB 32 — KASTA KARTU 4 & 5',
    title: '3️⃣2️⃣ Panduan Kartu ke-4 (Infinite Metal) & Kartu ke-5 (Kartu Admin Infinity ∞)',
    subtitle: 'Mengenal kasta tertinggi kartu Bank Nusantara dengan saldo, poin, dan limit penarikan tanpa batas.',
    color: 'text-fuchsia-400',
    icon: CreditCard,
    sections: [
      {
        heading: 'Kartu ke-4: Nusantara Infinite Metal (Hitam Platina)',
        body: 'Kartu ke-4 dirancang untuk nasabah VVIP dan korporasi dengan batas tarik tunai harian mencapai Rp 50.000.000 per hari, akses Executive Airport Lounge gratis, dan layanan kurs valas prioritas.',
        bullets: [
          'Batas tarik tunai harian ATM: Rp 50.000.000 / hari.',
          'Setoran awal pembukaan: Rp 10.000.000.',
          'Material kartu fisik berlapis metalik anti-gores dengan chip EMV emas.',
        ],
      },
      {
        heading: 'Kartu ke-5: Kartu Admin (Infinity / ∞ Tidak Terbatas)',
        body: 'Kartu ke-5 adalah kartu otoritas tertinggi di Bank Nusantara. Seluruh parameter keuangannya bersifat Tidak Terbatas (Infinity / ∞): saldo tidak akan pernah berkurang saat membeli barang, membayar tagihan, maupun mentransfer dana.',
        bullets: [
          'Saldo Efektif: ∞ (Tidak Terbatas / Rp ∞).',
          'Limit Tarik Tunai ATM & Limit Belanja Harian: ∞ (Tidak Terbatas).',
          'Nusantara Poin Rewards: ∞ Poin & bebas biaya bulanan selamanya.',
        ],
      },
    ],
  },
  {
    id: 33,
    badge: 'BAB 33 — SOP PERSETUJUAN PEMBELI',
    title: '3️⃣3️⃣ Sistem Persetujuan Pembeli Setelah Otorisasi Admin (Tanpa Kode Tukar)',
    subtitle: 'Alur khusus pembelian Air PDAM, tagihan bulanan, dan layanan non-voucher.',
    color: 'text-cyan-400',
    icon: CheckCircle,
    sections: [
      {
        heading: 'Mengapa Pembelian Air PDAM & Tagihan Tidak Memakai Kode Tukar?',
        body: 'Berbeda dengan Pulsa HP dan Token Listrik Prabayar yang menghasilkan deretan angka voucher/stroom, pembayaran tagihan seperti Air PDAM, BPJS, Internet, dan Pajak langsung terhubung ke meteran/instansi pelanggan sehingga tidak menggunakan kode tukar.',
        bullets: [
          'Saat nasabah membayar tagihan Air PDAM/layanan lain, saldo langsung dipotong dan status tampil halus sebagai "Sedang Diproses".',
          'Setelah disetujui di Panel Admin, transaksi masuk ke kotak "Menunggu Persetujuan Pembeli" di layar nasabah.',
          'Nasabah cukup menekan tombol "Setujui & Selesaikan Pesanan" untuk menuntaskan transaksi tanpa perlu memasukkan kode apa pun.',
        ],
      },
    ],
  },
  {
    id: 34,
    badge: 'BAB 34 — RIWAYAT UPDATE RESMI',
    title: '3️⃣4️⃣ Panduan Fitur Riwayat Update (Update Sekarang & Update Sebelumnya)',
    subtitle: 'Cara melihat catatan rilis terbaru serta cara mengisi riwayat update dari Panel Admin.',
    color: 'text-emerald-400',
    icon: History,
    sections: [
      {
        heading: 'Letak Menu Riwayat Update (Tepat di Sebelah Panduan)',
        body: 'Menu Riwayat Update terletak tepat di sebelah menu Buku Panduan pada bilah navigasi atas maupun melalui tombol pintasan di halaman Panduan ini. Halaman tersebut terbagi menjadi dua bagian utama: Update Sekarang (Versi Aktif Saat Ini) dan Daftar Riwayat Update Sebelumnya.',
        bullets: [
          'Menampilkan Tanggal Lengkap (Hari, Tanggal, Bulan, Tahun, dan Jam WIB).',
          'Menampilkan Nama Update & Nomor Versi secara jelas.',
          'Menampilkan Deskripsi Lengkap serta daftar poin perubahan fitur.',
          'Dapat diisi, ditambah, diedit, dan diatur mana yang menjadi "Update Sekarang" langsung melalui Panel Admin (Tab: Riwayat Update).',
        ],
      },
    ],
  },
  {
    id: 35,
    badge: 'BAB 35 — LAPOR BUG & FOTO BEBAS',
    title: '3️⃣5️⃣ Panduan Fitur Lapor Bug di Paling Bawah (Kirim Foto Bebas & Penjelasan)',
    subtitle: 'Melaporkan kendala teknis lengkap dengan tangkapan layar atau foto kamera HP.',
    color: 'text-amber-400',
    icon: Bug,
    sections: [
      {
        heading: 'Cara Mengirim Laporan Bug ke Panel Admin',
        body: 'Gulir ke bagian paling bawah halaman (footer) tepat di sebelah tombol Panel Admin, lalu klik tombol "🐛 Lapor Bug". Formulir pelaporan dirancang agar mudah digunakan dari HP maupun komputer.',
        bullets: [
          'Penjelasan Bug (Wajib Diisi): Jelaskan kendala atau saran perbaikan yang Anda temukan.',
          'Kirim Foto Bebas (Opsional): Anda bebas mengunggah foto tangkapan layar atau foto kamera apa saja sebagai bukti tambahan, atau mengosongkannya.',
          'Tinjauan di Panel Admin: Admin dapat melihat seluruh laporan bug, memperbesar (zoom) foto lampiran, mengubah status (Baru / Diproses / Selesai), dan mengirim balasan resmi.',
        ],
      },
    ],
  },
  {
    id: 36,
    badge: 'BAB 36 — CHAT GLOBAL KHUSUS ADMIN',
    title: '3️⃣6️⃣ Sistem Chat Global Khusus Admin ("Pesan dari Admin" ke Semua HP)',
    subtitle: 'Saluran pengumuman satu arah resmi dari Panel Admin ke seluruh perangkat nasabah.',
    color: 'text-amber-300',
    icon: MessageSquare,
    sections: [
      {
        heading: 'Aturan Otoritas Chat Global',
        body: 'Fitur Chat Global kini dikunci secara eksklusif hanya untuk Administrator melalui Panel Admin. Sahabat atau nasabah biasa tidak dapat mengirim pesan ke Chat Global demi menjaga ketertiban informasi resmi bank.',
        bullets: [
          'Hanya Admin lewat Panel Admin (Tab: Chat Global) yang dapat menuliskan dan menyiarkan pesan.',
          'Saat Admin menekan tombol Kirim, di seluruh layar HP yang terhubung langsung muncul pop-up sistem website bertuliskan "Pesan dari Admin" beserta isi pesan yang ditulis.',
        ],
      },
    ],
  },
  {
    id: 37,
    badge: 'BAB 37 — 26 SUPER TOOLS ADMIN',
    title: '3️⃣7️⃣ Ensiklopedia 26 Fitur Super Tools di Panel Admin',
    subtitle: 'Daftar lengkap 26 perkakas eksekusi instan bagi Administrator Bank Nusantara.',
    color: 'text-fuchsia-400',
    icon: Wrench,
    sections: [
      {
        heading: 'Fungsi 26 Super Tools Otoritas Penuh',
        body: 'Di dalam Panel Admin (Tab: Super Tools), tersedia 26 alat kendali langsung yang bekerja seketika tanpa antrean.',
        bullets: [
          'Tool #1 - #5: Injeksi Saldo (+/-/=/∞), Money Rain (Hujan Saldo Massal), Pengganda Saldo (x2 s/d x100), Ubah Tier Kartu Target, & Seragamkan Tier Semua Akun.',
          'Tool #6 - #10: Override 6-Digit PIN Kartu, Nomor Rekening Cantik VIP (8888888888), Custom 16 Digit Nomor Kartu/CVV/Exp, Generator Poin Rewards, & Injeksi Pulsa + Token kWh.',
          'Tool #11 - #18: Force Transfer Tanpa PIN, Buat Rekening Baru Langsung Aktif, Kloning Kartu, Freeze/Unfreeze Massal, Reset Kuota ATM Harian, Limit Belanja & Internasional, Pelunasan Pinjaman, & Booster Bunga Deposito.',
          'Tool #19 - #26: Generator Voucher Gratis, Bulk Redeem Generator, Buat Mutasi Custom, Bersihkan Log Mutasi, Editor Identitas Kartu, Broadcast Pop-Up Website, Kontrol Status Resi, & Hapus Kartu / Master Reset.',
        ],
      },
    ],
  },
  {
    id: 38,
    badge: 'BAB 38 — KODE REDEEM BERHADIAH',
    title: '3️⃣8️⃣ Panduan Klaim & Pembuatan Kode Redeem Berhadiah Saldo',
    subtitle: 'Mekanisme kuota jumlah pengklaim dan batas waktu aktif kode redeem.',
    color: 'text-yellow-400',
    icon: Gift,
    sections: [
      {
        heading: 'Cara Klaim Kode Redeem oleh Nasabah & Pembuatan oleh Admin',
        body: 'Nasabah dapat membuka menu "Tukar Kode Redeem" di Layanan Digital untuk menukarkan kode promo resmi menjadi saldo tabungan instan.',
        bullets: [
          'Admin dapat membuat kode unik di Panel Admin, mengatur nominal hadiah saldo, menentukan kuota maksimal orang yang bisa klaim, dan mengatur durasi aktif dalam hitungan menit.',
          'Setiap akun hanya dapat mengklaim satu kode redeem yang sama sebanyak 1 kali.',
        ],
      },
    ],
  },
  {
    id: 39,
    badge: 'BAB 39 — VOUCHER PULSA & STROOM PLN',
    title: '3️⃣9️⃣ Panduan Tukar Kode Voucher Pulsa & Stroom Token Listrik 20 Digit',
    subtitle: 'Cara menggunakan kode voucher yang terbit setelah pembelian disetujui Admin.',
    color: 'text-teal-400',
    icon: Zap,
    sections: [
      {
        heading: 'Alur Penerbitan & Penukaran Kode Voucher',
        body: 'Saat membeli Voucher Pulsa atau Token Listrik PLN, kode rahasia baru akan diterbitkan setelah transaksi disahkan oleh Admin. Setelah kode muncul, salin kode tersebut ke menu Tukar Kode Voucher Pulsa atau Tukar Kode Token Listrik.',
        bullets: [
          'Tukar Kode Pulsa (16 Digit): Menambahkan saldo pulsa aktif pada nomor HP nasabah.',
          'Tukar Kode Token Listrik (20 Digit): Menambahkan daya listrik (kWh) pada meteran PLN rumah Anda.',
        ],
      },
    ],
  },
  {
    id: 40,
    badge: 'BAB 40 — LACAK RESI & BAYAR COD',
    title: '4️⃣0️⃣ Panduan Pelacakan Nomor Resi Ekspedisi & Tebus Paket COD',
    subtitle: 'Pantau posisi paket pengiriman kurir nasional dan lunasi tagihan COD secara non-tunai.',
    color: 'text-purple-400',
    icon: Package,
    sections: [
      {
        heading: 'Integrasi Logistik & Pembayaran COD Bank Nusantara',
        body: 'Melalui fitur "Masukkan & Lacak Resi Paket + Bayar COD", nasabah dapat mendaftarkan nomor resi JNE, J&T, SiCepat, AnterAja, atau Pos Indonesia, melihat riwayat perjalanan kurir, serta menebus nominal COD menggunakan saldo rekening.',
      },
    ],
  },
  {
    id: 41,
    badge: 'BAB 41 — PEMULIHAN LUPA PIN ATM',
    title: '4️⃣1️⃣ Prosedur Lupa PIN Kartu ATM & Tinjauan Pemulihan Admin',
    subtitle: 'Solusi resmi ketika nasabah lupa 6 digit PIN kartu lama maupun kartu baru.',
    color: 'text-rose-400',
    icon: KeyRound,
    sections: [
      {
        heading: 'Alur Tombol "Lupa PIN?" di Mesin ATM & Layar Ganti Kartu',
        body: 'Apabila Anda lupa 6 digit PIN saat hendak bertransaksi di Simulator Mesin ATM atau saat hendak login ke Kartu Lama Anda, klik tombol "Lupa PIN?". Permohonan akan dikirim ke Panel Admin (Tab: Lupa PIN ATM), dan begitu disetujui Admin, sistem akan menampilkan 6 digit PIN kartu Anda secara langsung di layar.',
      },
    ],
  },
  {
    id: 42,
    badge: 'BAB 42 — EMAS & PERAK MULIA',
    title: '4️⃣2️⃣ Panduan Tabungan Emas Batangan Antam & Perak Murni Digital',
    subtitle: 'Investasi logam mulia 24 karat mulai nominal terjangkau dengan fasilitas cetak fisik.',
    color: 'text-amber-400',
    icon: TrendingUp,
    sections: [
      {
        heading: 'Keunggulan Tabungan Logam Mulia Bank Nusantara',
        body: 'Nasabah dapat membeli saldo emas batangan 99,99% maupun perak murni (Silver Bullion) secara real-time. Saldo gramasi tersimpan aman di brankas kustodian bank dan dapat dicetak menjadi kepingan fisik bersertifikat LBMA kapan saja.',
      },
    ],
  },
  {
    id: 43,
    badge: 'BAB 43 — REKSADANA, SBN & SAHAM IDX',
    title: '4️⃣3️⃣ Panduan Investasi Reksadana, Obligasi Negara (SBN/Sukuk) & Saham Bluechip',
    subtitle: 'Pengembangan aset pasar modal Indonesia yang diawasi OJK dan dijamin negara.',
    color: 'text-emerald-400',
    icon: BadgeDollarSign,
    sections: [
      {
        heading: 'Instrumen Pasar Modal Terpadu',
        body: 'Melalui kategori Investasi & Proteksi, nasabah dapat membeli Reksadana Pasar Uang bebas pajak, memesan Surat Berharga Negara (ORI, Sukuk Ritel, Sukuk Tabungan) dengan kupon bulanan tetap, hingga melakukan top-up Rekening Dana Nasabah (RDN) untuk membeli saham Bluechip Bursa Efek Indonesia.',
      },
    ],
  },
  {
    id: 44,
    badge: 'BAB 44 — PAJAK & LAYANAN NEGARA',
    title: '4️⃣4️⃣ Panduan E-Samsat STNK, Pajak PBB, e-Billing DJP & Tilang ETLE',
    subtitle: 'Pelunasan kewajiban perpajakan daerah dan pusat dengan Bukti Penerimaan Negara (BPN) sah.',
    color: 'text-blue-400',
    icon: Building2,
    sections: [
      {
        heading: 'Kepatuhan Pajak Tanpa Antre di Kantor Samsat / KPP',
        body: 'Bayar Pajak Kendaraan Bermotor tahunan (E-Samsat Nasional), Pajak Bumi dan Bangunan (PBB-P2), kode billing PPh/PPN Direktorat Jenderal Pajak, hingga penyelesaian denda tilang kamera elektronik (ETLE Kejaksaan) langsung dari genggaman Anda.',
      },
    ],
  },
  {
    id: 45,
    badge: 'BAB 45 — PASPOR, SIM & E-METERAI',
    title: '4️⃣5️⃣ Panduan Pembayaran Paspor Imigrasi, Perpanjangan SIM SINAR & e-Meterai PERURI',
    subtitle: 'Layanan PNBP dokumen kependudukan, keimigrasian, dan legalitas dokumen elektronik.',
    color: 'text-cyan-400',
    icon: FileText,
    sections: [
      {
        heading: 'Kemudahan Dokumen Resmi Pemerintah',
        body: 'Lunasi kode billing pembuatan Paspor Biasa/E-Paspor (SIMKIM Imigrasi), perpanjangan SIM A dan SIM C online (SINAR Korlantas), biaya nikah KUA (SIMKAH), PNBP sertifikat tanah ATR/BPN, serta pembelian kuota e-Meterai Rp 10.000 resmi PERURI.',
      },
    ],
  },
  {
    id: 46,
    badge: 'BAB 46 — PENDIDIKAN & KURSUS',
    title: '4️⃣6️⃣ Panduan Pembayaran SPP Sekolah, UKT Universitas, Pesantren & Sertifikasi TOEFL/IT',
    subtitle: 'Portal pembayaran akademik terintegrasi untuk ribuan sekolah, kampus, dan lembaga kursus.',
    color: 'text-indigo-400',
    icon: BookOpen,
    sections: [
      {
        heading: 'Ekosistem Pembayaran Pendidikan Nasional',
        body: 'Mendukung pelunasan SPP bulanan SD/SMP/SMA, Uang Kuliah Tunggal (UKT) PTN & PTS seluruh Indonesia, syahriah pondok pesantren, bootcamp pemrograman/AI, hingga registrasi ujian internasional TOEFL iBT dan IELTS.',
      },
    ],
  },
  {
    id: 47,
    badge: 'BAB 47 — ZAKAT, WAKAF & IBADAH',
    title: '4️⃣7️⃣ Panduan Zakat BAZNAS, Wakaf Produktif, Kurban, Aqiqah & Tabungan Haji SISKOHAT',
    subtitle: 'Layanan keuangan sosial syariah dan persiapan keberangkatan ibadah ke Tanah Suci.',
    color: 'text-emerald-400',
    icon: Sparkles,
    sections: [
      {
        heading: 'Penyaluran Ibadah & Filantropi Terverifikasi',
        body: 'Tunaikan Zakat Penghasilan/Maal, Infaq, Sedekah, Fidyah puasa, Cash Waqf Linked Sukuk (CWLS), pembelian hewan Kurban & paket Aqiqah siap saji, hingga setoran Tabungan Haji & Umroh yang terhubung langsung dengan sistem SISKOHAT Kementerian Agama RI.',
      },
    ],
  },
  {
    id: 48,
    badge: 'BAB 48 — KESEHATAN & RUMAH SAKIT',
    title: '4️⃣8️⃣ Panduan Pembayaran Rumah Sakit, Medical Check-Up, Telemedicine & Apotek Online',
    subtitle: 'Solusi pembayaran layanan medis keluarga, laboratorium klinik, dan tebus resep dokter.',
    color: 'text-rose-400',
    icon: HeartPulse,
    sections: [
      {
        heading: 'Layanan Kesehatan Terpadu 24 Jam',
        body: 'Selain iuran rutin BPJS Kesehatan, nasabah dapat melunasi tagihan kamar rawat inap rumah sakit, memesan paket Medical Check-Up laboratorium, konsultasi dokter spesialis online (Telemedicine), perawatan klinik gigi, optik kacamata, dan tebus resep apotek.',
      },
    ],
  },
  {
    id: 49,
    badge: 'BAB 49 — TRANSPORTASI & KERETA CEPAT',
    title: '4️⃣9️⃣ Panduan Tiket Pesawat, Kereta Cepat Whoosh KCIC, KAI, MRT/LRT & Kapal Laut PELNI',
    subtitle: 'Pemesanan tiket perjalanan darat, laut, dan udara dengan konfirmasi kursi instan.',
    color: 'text-sky-400',
    icon: Globe,
    sections: [
      {
        heading: 'Mobilitas Nusantara Tanpa Batas',
        body: 'Pesan tiket pesawat domestik & internasional, tambahan bagasi pesawat, Kereta Cepat Whoosh Jakarta-Bandung, Kereta Api Antarkota KAI, komuter MRT/LRT/KRL, kapal laut PELNI & Ferry ASDP, hingga bus eksekutif AKAP dan travel shuttle.',
      },
    ],
  },
  {
    id: 50,
    badge: 'BAB 50 — MOBIL LISTRIK (EV) & OTOMOTIF',
    title: '5️⃣0️⃣ Panduan Isi Daya Mobil Listrik (SPKLU EV), Voucher BBM, Kartu Tol & Bengkel Resmi',
    subtitle: 'Dukungan penuh bagi pemilik kendaraan listrik maupun kendaraan konvensional.',
    color: 'text-teal-400',
    icon: Zap,
    sections: [
      {
        heading: 'Layanan Otomotif & Energi Kendaraan',
        body: 'Bayar pengisian daya baterai kendaraan listrik di stasiun SPKLU Ultra-Fast Charging, beli voucher BBM Pertamax/Dex, top-up kartu e-Toll (e-Money, Flazz, Brizzi, TapCash), sewa mobil harian, hingga booking servis berkala di bengkel resmi.',
      },
    ],
  },
  {
    id: 51,
    badge: 'BAB 51 — PROPERTI, KPR & RUMAH TANGGA',
    title: '5️⃣1️⃣ Panduan Angsuran KPR Rumah, IPL Apartemen, Sewa Kost & Pemeliharaan Hunian',
    subtitle: 'Manajemen pembayaran tempat tinggal dan utilitas rumah tangga modern.',
    color: 'text-amber-400',
    icon: Building2,
    sections: [
      {
        heading: 'Solusi Pembayaran Hunian Terlengkap',
        body: 'Bayar angsuran KPR rumah/apartemen, Iuran Pengelolaan Lingkungan (IPL) cluster/apartemen, sewa kamar kost bulanan, tagihan gas pipa PGN, retribusi kebersihan RT/RW, langganan Cloud CCTV Smart Home, hingga jasa cuci AC dan laundry kiloan.',
      },
    ],
  },
  {
    id: 52,
    badge: 'BAB 52 — INTERNET, STREAMING & GAME',
    title: '5️⃣2️⃣ Panduan WiFi Fiber Optik, Streaming Film/Musik, Cloud Software & Voucher Game',
    subtitle: 'Hiburan digital keluarga dan langganan aplikasi produktivitas kerja.',
    color: 'text-purple-400',
    icon: MonitorPlay,
    sections: [
      {
        heading: 'Konektivitas & Hiburan Tanpa Putus',
        body: 'Lunasi tagihan internet rumah fiber optik (IndiHome, Biznet, FirstMedia, MyRepublic), beli paket roaming luar negeri, langganan streaming film 4K & musik bebas iklan, lisensi software desain/cloud storage, serta top-up diamond game dan Steam Wallet.',
      },
    ],
  },
  {
    id: 53,
    badge: 'BAB 53 — KULINER, OLAHRAGA & GAYA HIDUP',
    title: '5️⃣3️⃣ Panduan Tiket Timnas Sepak Bola, Konser, Taman Hiburan, Lapangan Futsal & Kuliner',
    subtitle: 'Nikmati kemudahan reservasi gaya hidup, rekreasi akhir pekan, dan hobi olahraga.',
    color: 'text-rose-400',
    icon: Sparkles,
    sections: [
      {
        heading: 'Pengalaman Gaya Hidup Eksklusif',
        body: 'Pesan tiket pertandingan sepak bola Timnas & Liga, konser musik tur dunia, tiket bioskop XXI/CGV, taman rekreasi keluarga, sewa lapangan futsal/badminton/padel, langganan kopi artisan, katering sehat harian, barbershop/spa, hingga kebutuhan petshop & klinik hewan.',
      },
    ],
  },
  {
    id: 54,
    badge: 'BAB 54 — BISNIS, UMKM & KORPORASI',
    title: '5️⃣4️⃣ Panduan Layanan UMKM: QRIS Merchant, Mesin EDC, Payroll Gaji & Grosir B2B',
    subtitle: 'Percepat pertumbuhan usaha Anda dengan infrastruktur perbankan bisnis Bank Nusantara.',
    color: 'text-cyan-400',
    icon: DollarSign,
    sections: [
      {
        heading: 'Mitra Perbankan Terbaik untuk Pelaku Usaha',
        body: 'Daftarkan toko Anda untuk menerima pembayaran QRIS & mesin EDC, distribusikan gaji karyawan (Payroll Nusantara), sewa gudang fulfillment logistik, top-up saldo iklan digital, bayar cloud server & domain .ID, urus merek HAKI & sertifikat Halal, serta lunasi faktur supplier grosir B2B.',
      },
    ],
  },
  {
    id: 55,
    badge: 'BAB 55 — SAFE DEPOSIT BOX & ANGPAO',
    title: '5️⃣5️⃣ Panduan Sewa Safe Deposit Box (SDB) Brankas Baja & Kirim Angpao Digital',
    subtitle: 'Perlindungan fisik surat berharga di kantor cabang serta tradisi berbagi kebahagiaan.',
    color: 'text-yellow-400',
    icon: Lock,
    sections: [
      {
        heading: 'Brankas Penyimpanan Fisik & Amplop Digital',
        body: 'Sewa kotak Safe Deposit Box (SDB) berlapis baja tahan api di kantor cabang utama untuk menyimpan logam mulia, sertifikat tanah, dan perhiasan keluarga. Gunakan pula fitur Angpao Digital untuk mengirim amplop hadiah Lebaran, Natal, Imlek, atau ulang tahun.',
      },
    ],
  },
  {
    id: 56,
    badge: 'BAB 56 — REMITANSI & KARTU VIRTUAL (VCC)',
    title: '5️⃣6️⃣ Panduan Transfer Luar Negeri (SWIFT Remittance) & Kartu Virtual Sekali Pakai (VCC)',
    subtitle: 'Transaksi lintas negara yang aman dengan perlindungan nomor kartu utama.',
    color: 'text-indigo-400',
    icon: Globe,
    sections: [
      {
        heading: 'Transaksi Global Berstandar Tinggi',
        body: 'Kirim valuta asing ke lebih dari 120 negara melalui jaringan SWIFT International Remittance dengan kurs transparan. Untuk belanja di situs internasional, terbitkan Virtual Credit/Debit Card (VCC) sekali pakai agar nomor kartu fisik Anda terlindungi dari kebocoran data.',
      },
    ],
  },
  {
    id: 57,
    badge: 'BAB 57 — AUTODEBIT & PERENCANAAN WARIS',
    title: '5️⃣7️⃣ Panduan Autodebit Tagihan Otomatis, Tabungan Pendidikan Anak & Konsultasi CFP',
    subtitle: 'Otomatisasi pembayaran rutin dan pendampingan perencana keuangan tersertifikasi.',
    color: 'text-emerald-400',
    icon: Clock,
    sections: [
      {
        heading: 'Manajemen Keuangan Keluarga Jangka Panjang',
        body: 'Aktifkan fitur Autodebit agar tagihan listrik, air, dan internet terbayar otomatis tepat waktu. Siapkan masa depan buah hati dengan Tabungan Berjangka Pendidikan Anak dan jadwalkan sesi konsultasi privat bersama Certified Financial Planner (CFP) Bank Nusantara.',
      },
    ],
  },
  {
    id: 58,
    badge: 'BAB 58 — KONTROL PIN ADMIN PER FITUR',
    title: '5️⃣8️⃣ Panduan Konfigurasi Keamanan Layanan di Panel Admin (PIN Admin & Persetujuan)',
    subtitle: 'Cara mengatur fitur mana yang memakai PIN Admin (159357) dan mana yang wajib tinjauan.',
    color: 'text-rose-400',
    icon: SlidersIconFallback,
    sections: [
      {
        heading: 'Kendali Penuh Setiap Fitur Aplikasi',
        body: 'Di Panel Admin (Tab: Kontrol Fitur), Admin dapat mengatur satu per satu atau secara massal terhadap seluruh layanan aplikasi: apakah layanan tersebut mewajibkan input PIN Admin (159357) saat dibuka nasabah, dan apakah pembayarannya wajib melalui persetujuan Admin atau langsung otomatis selesai. Admin bahkan dapat menambahkan fitur baru secara kustom!',
      },
    ],
  },
  {
    id: 59,
    badge: 'BAB 59 — PERISAI ANTI-SKIMMING & SIBER',
    title: '5️⃣9️⃣ Arsitektur Keamanan Siber, Anti-Skimming ATM & Jaminan Auto-Refund 100%',
    subtitle: 'Standar enkripsi berlapis dan perlindungan penuh atas dana simpanan nasabah.',
    color: 'text-cyan-400',
    icon: ShieldCheck,
    sections: [
      {
        heading: 'Jaminan Keamanan Dana 100%',
        body: 'Setiap transaksi di Bank Nusantara dilindungi enkripsi EMV Chip, verifikasi 6-digit PIN kartu, serta jaminan Auto-Refund 100% apabila transaksi pembelian ditolak atau dibatalkan oleh sistem tinjauan keamanan Admin.',
      },
    ],
  },
  {
    id: 60,
    badge: 'BAB 60 — KAMUS & INDEKS LAYANAN',
    title: '6️⃣0️⃣ Kamus Istilah Perbankan Nusantara & Indeks Cepat Layanan Digital',
    subtitle: 'Rangkuman terminologi perbankan resmi dan peta navigasi seluruh fitur aplikasi.',
    color: 'text-amber-400',
    icon: BookOpen,
    sections: [
      {
        heading: 'Glosarium Resmi Nasabah Bank Nusantara',
        body: 'Memahami istilah perbankan kini semakin mudah: EMV Chip (standar keamanan kartu pintar global), CVV (3 digit kode verifikasi belakang kartu), BPN (Bukti Penerimaan Negara sah untuk pajak/PNBP), SISKOHAT (Sistem Komputerisasi Haji Terpadu), serta Kartu Admin Infinity (kasta kartu ke-5 dengan saldo tak terbatas ∞).',
      },
    ],
  },
  {
    id: 61,
    badge: 'BAB 61 — SIMULATOR MESIN ATM FISIK',
    title: '6️⃣1️⃣ Panduan Teknis 11 Fitur Simulator Mesin ATM & Efek Suara Bip Autentik',
    subtitle: 'Cara mengoperasikan layar ATM interaktif, slot kartu, keypad PIN, dan cetak resi kertas.',
    color: 'text-emerald-400',
    icon: MonitorPlay,
    sections: [
      {
        heading: 'Pengalaman Mesin ATM Nyata di Layar Anda',
        body: 'Simulator Mesin ATM Bank Nusantara menghadirkan pengalaman fisik mesin ATM sesungguhnya lengkap dengan bunyi bip tombol keypad, suara mekanik penghitung uang kertas, peringatan salah PIN 3 kali, hingga pencetakan struk kertas termal.',
      },
    ],
  },
  {
    id: 62,
    badge: 'BAB 62 — KALKULATOR FINANSIAL & KPR',
    title: '6️⃣2️⃣ Panduan Kalkulator Simulasi Cicilan KPR, Pinjaman Usaha & Bunga Deposito',
    subtitle: 'Cara menghitung estimasi angsuran bulanan dan imbal hasil tabungan berjangka secara akurat.',
    color: 'text-blue-400',
    icon: TrendingUp,
    sections: [
      {
        heading: 'Perencanaan Angsuran yang Transparan',
        body: 'Gunakan kalkulator simulasi di menu Pinjaman Online dan Deposito untuk melihat rincian pokok pinjaman, bunga efektif per bulan, rasio kemampuan bayar (DSR), serta proyeksi pencairan bunga deposito sebelum mengambil keputusan finansial.',
      },
    ],
  },
  {
    id: 63,
    badge: 'BAB 63 — MULTI-AKUN & KARTU LAMA',
    title: '6️⃣3️⃣ Strategi Mengelola Banyak Kartu Sekaligus & Berpindah Antar Kartu Lama/Baru',
    subtitle: 'Memisahkan rekening kebutuhan harian, rekening tabungan keluarga, dan rekening bisnis.',
    color: 'text-purple-400',
    icon: Layers,
    sections: [
      {
        heading: 'Fleksibilitas Multi-Kartu dalam Satu Akun Google',
        body: 'Anda dapat mendaftarkan lebih dari satu kartu di Bank Nusantara dan berpindah antar kartu kapan saja melalui menu pemilih kartu di pojok kanan atas Navbar dengan memasukkan 6 digit PIN masing-masing kartu.',
      },
    ],
  },
  {
    id: 64,
    badge: 'BAB 64 — SINKRONISASI MULTI-HP REALTIME',
    title: '6️⃣4️⃣ Arsitektur Sinkronisasi Real-Time Antar HP (WebSocket & Penyimpanan Server)',
    subtitle: 'Bagaimana pesan Admin, laporan bug, dan riwayat update tersinkronisasi lintas perangkat.',
    color: 'text-cyan-400',
    icon: RefreshCw,
    sections: [
      {
        heading: 'Teknologi Sinkronisasi Instan Bank Nusantara',
        body: 'Aplikasi Bank Nusantara dilengkapi mesin sinkronisasi ganda (WebSocket aktif + pemindaian berkala otomatis) sehingga setiap pengumuman Chat Global Admin, laporan bug bergambar, maupun penambahan Riwayat Update langsung terlihat di semua perangkat.',
      },
    ],
  },
  {
    id: 65,
    badge: 'BAB 65 — PENUTUP & KOMITMEN LAYANAN',
    title: '6️⃣5️⃣ Piagam Komitmen Pelayanan Prima PT Bank Nusantara (Persero) Tbk',
    subtitle: 'Dedikasi inovasi tanpa henti untuk kenyamanan, kecepatan, dan keamanan seluruh nasabah.',
    color: 'text-amber-300',
    icon: ShieldCheck,
    sections: [
      {
        heading: 'Melayani Nusantara dengan Standar Terbaik',
        body: 'Dengan Buku Panduan Resmi, Portal Layanan Perbankan Digital Terpadu, Super Tools Admin, dan Pusat Riwayat Update yang transparan, PT Bank Nusantara (Persero) Tbk berkomitmen memberikan pengalaman perbankan digital terbaik bagi Anda.',
      },
    ],
  },
  {
    id: 66,
    badge: 'BAB 66 — MODE TRANSFER BEBAS (ADMIN 5%)',
    title: '6️⃣6️⃣ Transfer Bebas Lintas Aset (Uang, Coin Spin, Emas 24K & Gabungan)',
    subtitle: 'Kirim aset fleksibel mulai Rp 1.000 sampai tak terbatas dengan potongan biaya admin 5% transparan.',
    color: 'text-emerald-400',
    icon: Send,
    sections: [
      {
        heading: 'Mekanisme Pemotongan Biaya Admin 5%',
        body: 'Di dalam Tab Transfer, pilih mode "Transfer Bebas 5%". Anda dapat mengirim Uang Rupiah, Coin Spin, Emas 24K, atau Paket Gabungan ketiganya ke rekening terdaftar maupun tujuan bebas manual. Jika Anda mengirim Rp 10.000.000, saldo Anda terpotong Rp 10.000.000, biaya admin 5% (Rp 500.000) dipotong otomatis, dan penerima menerima bersih Rp 9.500.000.',
      },
    ],
  },
  {
    id: 67,
    badge: 'BAB 67 — TAB EMAS MEWAH 24K REAL-TIME',
    title: '6️⃣7️⃣ Brankas Emas Batangan & Perhiasan 24K, Kenaikan +5% Tanggal 1 & Kustom Nominal',
    subtitle: 'Tampilan 3D mewah adaptif, pelacakan batch FIFO hari yang sama vs lintas bulan, dan simulator Admin.',
    color: 'text-amber-300',
    icon: Crown,
    sections: [
      {
        heading: 'Aturan Jual Hari Sama (-1% / -5%) & Kenaikan Bulanan Tanggal 1 (+5%)',
        body: 'Tab Emas menampilkan koleksi Emas Batangan (persegi panjang tebal) dan Emas Perhiasan (persegi panjang tipis elegan) lengkap dengan motif Klasik, Nusantara, Royal Platinum, dan sertifikat 24K 999.9. Setiap pembelian dicatat sebagai batch individual mulai Rp 1.000 hingga tak terbatas. Penjualan pada hari pembelian yang sama dikenakan penyesuaian -1% (atau -5% sesuai mode Admin), sedangkan setiap pergantian bulan persis tanggal 1 secara real-time harga emas otomatis naik +5%.',
      },
    ],
  },
];

function SlidersIconFallback(props: React.SVGProps<SVGSVGElement>) {
  return <Layers {...props} />;
}

export const InformationGuide: React.FC<InformationGuideProps> = ({
  onNavigateToTab,
  onOpenRegisterModal,
}) => {
  const [activeChapter, setActiveChapter] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllChaptersMode, setShowAllChaptersMode] = useState<boolean>(false);

  const chapters = [
    { id: 1, title: '1. Jenis Kartu & Keterangan Lengkap', icon: CreditCard, color: 'text-blue-400' },
    { id: 2, title: '2. Cara Membuat Kartu & Persetujuan Admin', icon: UserCheck, color: 'text-amber-400' },
    { id: 3, title: '3. Bagian-Bagian Fisik pada Kartu ATM Debit', icon: Cpu, color: 'text-emerald-400' },
    { id: 4, title: '4. Sistem Nomor Rekening — Otomatis & Acak', icon: Hash, color: 'text-purple-400' },
    { id: 5, title: '5. Tata Cara Menggunakan Mesin ATM dari Awal', icon: MonitorPlay, color: 'text-cyan-400' },
    { id: 6, title: '6. 11 Fitur Lengkap di Mesin ATM Nusantara', icon: Layers, color: 'text-teal-400' },
    { id: 7, title: '7. Prosedur & Aturan Transfer Antar Rekening', icon: Send, color: 'text-indigo-400' },
    { id: 8, title: '8. Fitur Tambahan & Layanan Digital', icon: BellRing, color: 'text-rose-400' },
    { id: 9, title: '9. Protokol Keamanan & Perlindungan Kartu ATM', icon: ShieldAlert, color: 'text-yellow-400' },
    { id: 10, title: '10. Layanan Pinjaman Online & Analisis Kredit', icon: BadgeDollarSign, color: 'text-emerald-400' },
    { id: 11, title: '11. Upgrade Kartu ke Emas / Premium & Tinjauan Admin', icon: Sparkles, color: 'text-amber-400' },
    { id: 12, title: '12. Sistem Tinjauan Finansial Admin (Otorisasi Wajib)', icon: ShieldCheck, color: 'text-rose-400' },
    { id: 13, title: '13. Tarik Tunai Tanpa Kartu (Cardless Cash ATM)', icon: Smartphone, color: 'text-blue-400' },
    { id: 14, title: '14. Tabungan Deposito Online & Bunga Majemuk', icon: TrendingUp, color: 'text-cyan-400' },
    { id: 15, title: '15. Celengan Impian (Pocket Savings Multi-Tujuan)', icon: DollarSign, color: 'text-emerald-400' },
    { id: 16, title: '16. Pembayaran Listrik PLN Pascabayar & Beli Token', icon: Zap, color: 'text-amber-400' },
    { id: 17, title: '17. Isi Pulsa & Paket Kuota Internet Semua Operator', icon: Smartphone, color: 'text-indigo-400' },
    { id: 18, title: '18. Iuran BPJS Kesehatan & Ketenagakerjaan', icon: HeartPulse, color: 'text-red-400' },
    { id: 19, title: '19. Tagihan PDAM Air Minum Seluruh Indonesia', icon: Droplets, color: 'text-sky-400' },
    { id: 20, title: '20. Top-Up Dompet Digital (GoPay, OVO, DANA, Shopee)', icon: Wallet, color: 'text-teal-400' },
    { id: 21, title: '21. Pembayaran Praktis dengan QRIS Dinamis & Statis', icon: QrCode, color: 'text-purple-400' },
    { id: 22, title: '22. Nusantara PayChat — Chat Antar Nomor & Transfer', icon: MessageSquare, color: 'text-emerald-400' },
    { id: 23, title: '23. Batas & Limit Transaksi Harian (PIN 6 Digit)', icon: Clock, color: 'text-blue-400' },
    { id: 24, title: '24. Kontrol Transaksi Online (E-Commerce) & Internasional', icon: Globe, color: 'text-amber-400' },
    { id: 25, title: '25. Buka Blokir Kartu Mandiri Debit dengan PIN Kartu', icon: Unlock, color: 'text-emerald-400' },
    { id: 26, title: '26. Fitur Penguncian Kartu Sementara (Freeze / Unfreeze)', icon: Lock, color: 'text-rose-400' },
    { id: 27, title: '27. Transaksi Valuta Asing (Valas) & Kalkulator Kurs', icon: RefreshCw, color: 'text-cyan-400' },
    { id: 28, title: '28. Fitur Bagi Tagihan Otomatis (Split Bill)', icon: Share2, color: 'text-indigo-400' },
    { id: 29, title: '29. Unduh Rekening Koran Digital (E-Statement PDF)', icon: FileText, color: 'text-blue-400' },
    { id: 30, title: '30. Layanan Bantuan Nasabah 24 Jam & Tiket Pengaduan', icon: HelpCircle, color: 'text-emerald-400' },
    { id: 31, title: '31. Ensiklopedia 100x Lipat: Google Login, Kartu Lama, Centang Biru & Banned', icon: BookOpen, color: 'text-amber-400' },
    ...EXTRA_CHAPTERS_DATA.map((ch) => ({
      id: ch.id,
      title: ch.title.replace(/^\d+️⃣\s*/, `${ch.id}. `),
      icon: ch.icon,
      color: ch.color,
    })),
  ];

  const filteredChapters = chapters.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Title Header Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 border border-blue-900/60 shadow-xl flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              BUKU PANDUAN RESMI NASABAH &amp; ENSIKLOPEDIA BANK
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
              65 Bab Super Lengkap (100x Detail)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            🏦 BANK NUSANTARA — 65 Bab Buku Panduan Lengkap
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Ensiklopedia perbankan resmi <strong>65 Bab Lengkap</strong>: Mencakup panduan 5 jenis kartu (termasuk Kartu Admin ∞), login Google &amp; Kartu Lama, 11 fitur Mesin ATM, Super Tools Admin, Lapor Bug dengan Foto Bebas, Riwayat Update, serta panduan lengkap layanan perbankan digital.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Tombol Riwayat Update tepat di sebelah Panduan */}
          <button
            type="button"
            onClick={() => onNavigateToTab('updates')}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 transition-transform hover:scale-105"
          >
            <History className="w-4 h-4" />
            <span>📜 Riwayat Update (Sekarang &amp; Sebelumnya)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAllChaptersMode(!showAllChaptersMode)}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 border ${
              showAllChaptersMode
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-purple-500/40'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{showAllChaptersMode ? 'Mode Per Bab' : '📖 Buka Semua Bab (32-65)'}</span>
          </button>

          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>Buka Kartu Baru</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Chapter Nav + Content Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>DAFTAR 65 BAB PANDUAN</span>
            </span>
            <span className="text-[10px] text-amber-300 font-mono font-bold">65 Bab Lengkap</span>
          </div>

          {/* Search bar inside navigation */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari bab atau topik panduan..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {filteredChapters.map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChapter(ch.id);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    activeChapter === ch.id
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold ring-1 ring-blue-400/50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${activeChapter === ch.id ? 'text-white' : ch.color}`} />
                    <span className="truncate">{ch.title}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts */}
          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
              Pintasan Langsung Aplikasi
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigateToTab('dashboard', 'layanan')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] text-center font-medium border border-slate-700/50 cursor-pointer"
              >
                Layanan Digital ➔
              </button>
              <button
                onClick={() => onNavigateToTab('dashboard', 'chat')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] text-center font-medium border border-slate-700/50 cursor-pointer"
              >
                PayChat ➔
              </button>
              <button
                onClick={() => onNavigateToTab('atm')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-[11px] text-center font-medium border border-slate-700/50 cursor-pointer"
              >
                Mesin ATM ➔
              </button>
              <button
                onClick={() => onNavigateToTab('admin')}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-amber-300 text-[11px] text-center font-medium border border-amber-500/30 cursor-pointer"
              >
                Panel Admin ➔
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Area (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-200">
          
          {/* ================= BAB 1 ================= */}
          {activeChapter === 1 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 1 — INFORMASI RESMI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣ Jenis Kartu dan Keterangannya
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bank Nusantara menyediakan 3 varian kartu debit resmi berbasis chip EMV berstandar internasional: Kartu Reguler (Biasa), Kartu Emas, dan Kartu Premium.
                </p>
              </div>

              {/* Tiga Kartu Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-900/40 to-slate-950 border border-blue-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full bg-blue-500 shadow-md shadow-blue-500" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold">
                      Kartu Biasa (Standar)
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">🔵 Kartu Reguler</h3>
                    <p className="text-[11px] text-slate-400">Pilihan standar untuk seluruh pendaftaran nasabah baru.</p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300 border-t border-slate-800/80 pt-2">
                    <li>• <strong>Warna utama:</strong> Biru Nusantara</li>
                    <li>• <strong>Batas tarik harian:</strong> Rp 2.000.000</li>
                    <li>• <strong>Biaya bulanan:</strong> Rp 2.000</li>
                    <li>• <strong>Masa berlaku:</strong> 5 tahun aktif</li>
                    <li>• <strong>Setoran awal min:</strong> Rp 50.000</li>
                    <li>• <strong>Cocok untuk:</strong> Kebutuhan sehari-hari & transaksi rutin</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/40 to-slate-950 border border-amber-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full bg-amber-400 shadow-md shadow-amber-400" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                      Upgrade Butuh Admin
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-amber-400 text-base">🟡 Kartu Emas</h3>
                    <p className="text-[11px] text-slate-400">Limit lebih tinggi untuk kebutuhan belanja keluarga.</p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300 border-t border-slate-800/80 pt-2">
                    <li>• <strong>Warna utama:</strong> Emas Elegan</li>
                    <li>• <strong>Batas tarik harian:</strong> Rp 5.000.000</li>
                    <li>• <strong>Biaya bulanan:</strong> Rp 5.000</li>
                    <li>• <strong>Masa berlaku:</strong> 5 tahun aktif</li>
                    <li>• <strong>Cara perolehan:</strong> Diajukan via upgrade & diverifikasi Admin</li>
                    <li>• <strong>Cocok untuk:</strong> Kebutuhan belanja keluarga</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-600/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="w-3 h-3 rounded-full bg-slate-200 shadow-md shadow-slate-200" />
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold">
                      Upgrade Butuh Admin
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base">⚫ Kartu Premium</h3>
                    <p className="text-[11px] text-slate-400">Prioritas bisnis dengan batas penarikan maksimal.</p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-300 border-t border-slate-800/80 pt-2">
                    <li>• <strong>Warna utama:</strong> Hitam Emas Metalik</li>
                    <li>• <strong>Batas tarik harian:</strong> Rp 10.000.000</li>
                    <li>• <strong>Biaya bulanan:</strong> Rp 10.000</li>
                    <li>• <strong>Masa berlaku:</strong> 5 tahun aktif</li>
                    <li>• <strong>Cara perolehan:</strong> Diajukan via upgrade & diverifikasi Admin</li>
                    <li>• <strong>Cocok untuk:</strong> Kebutuhan bisnis & profesional</li>
                  </ul>
                </div>
              </div>

              {/* Tabel Komparasi */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Tabel Perbandingan Fasilitas & Tarif Kartu
                </h4>
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-2 pr-3">Fitur / Parameter</th>
                        <th className="py-2 px-3 text-blue-400">Kartu Reguler (Biasa)</th>
                        <th className="py-2 px-3 text-amber-400">Kartu Emas</th>
                        <th className="py-2 px-3 text-yellow-300">Kartu Premium</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      <tr>
                        <td className="py-2.5 font-semibold text-white">Warna Visual</td>
                        <td className="py-2.5 px-3">Biru Laut</td>
                        <td className="py-2.5 px-3">Emas Mengkilap</td>
                        <td className="py-2.5 px-3">Hitam Doff Emas</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-white">Batas Tarik Harian</td>
                        <td className="py-2.5 px-3 font-mono">Rp 2.000.000</td>
                        <td className="py-2.5 px-3 font-mono">Rp 5.000.000</td>
                        <td className="py-2.5 px-3 font-mono">Rp 10.000.000</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-white">Biaya Administrasi</td>
                        <td className="py-2.5 px-3 font-mono">Rp 2.000 / bln</td>
                        <td className="py-2.5 px-3 font-mono">Rp 5.000 / bln</td>
                        <td className="py-2.5 px-3 font-mono">Rp 10.000 / bln</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-white">Pendaftaran Awal</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">Otomatis / Langsung</td>
                        <td className="py-2.5 px-3 text-amber-400">Wajib Upgrade + Admin</td>
                        <td className="py-2.5 px-3 text-amber-400">Wajib Upgrade + Admin</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-semibold text-white">Jaringan Transaksi</td>
                        <td className="py-2.5 px-3">ATM Nusantara / GPN</td>
                        <td className="py-2.5 px-3">ATM Nusantara / GPN / Debit Online</td>
                        <td className="py-2.5 px-3">ATM Nusantara / Prioritas / Global</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 2 ================= */}
          {activeChapter === 2 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 2 — PROSEDUR NASABAH
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣ Cara Membuat Kartu Biasa & Persetujuan Admin
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Semua kartu perdana dibuat sebagai <strong>Kartu Biasa (Reguler)</strong>. Setelah diajukan, permohonan wajib diperiksa dan disetujui oleh Admin Bank Nusantara.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Langkah 1 — Isi Formulir Pendaftaran</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Masukkan nama lengkap sesuai identitas resmi, alamat domisili, nomor telepon aktif, dan nomor identitas (NIK / KTP 16 digit).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Langkah 2 — Buat Kode PIN Rahasia Sendiri (6 Digit Angka)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tentukan 6 digit angka PIN Anda sendiri. Jangan gunakan tanggal lahir, kombinasi berurutan (123456), atau angka berulang (111111).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Langkah 3 — Penetapan Jenis Kartu Biasa (Reguler)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pendaftaran awal menetapkan Anda mendapatkan <strong>Kartu Biasa (Reguler Biru)</strong>. Pilihan Kartu Emas dan Premium hanya dapat diajukan setelah kartu aktif melalui menu Upgrade Kartu dengan persetujuan Admin.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Langkah 4 — Kirimkan Permohonan Pendaftaran ke Bank</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tekan tombol Kirim Permohonan. Formulir dan data Anda akan langsung terenkripsi dan masuk ke antrean verifikasi Admin Bank Nusantara.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Langkah 5 — Tunggu Proses Pemeriksaan & Keputusan Admin</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Admin akan memeriksa identitas Anda. Ada 3 kemungkinan status permohonan:
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Permohonan Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-1.5">
                  <span className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>⏳ Menunggu Persetujuan</span>
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Permohonan sudah dikirim dan sedang diperiksa oleh Admin. Kartu belum bisa digunakan untuk transaksi apapun.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>✅ Disetujui Admin</span>
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Admin telah menyetujui permohonan. Kartu aktif, saldo awal masuk, dan nomor rekening unik 10 digit diacak otomatis oleh sistem.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-1.5">
                  <span className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>❌ Ditolak Admin</span>
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Permohonan ditolak dengan alasan resmi dari Admin (misal foto KTP buram). Anda dapat mengajukan ulang data yang benar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 3 ================= */}
          {activeChapter === 3 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 3 — ANATOMI PERANGKAT
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  3️⃣ Bagian-Bagian Fisik pada Kartu ATM Debit
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kartu debit fisik Bank Nusantara memiliki 5 komponen kunci berstandar industri perbankan nasional & internasional.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Cpu className="w-4 h-4" />
                    <span>1. Chip EMV Emas</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Kotak kecil berwarna emas di bagian depan kartu yang berisi mikroprosesor aman. Chip ini menyimpan data akun terenkripsi dinamis untuk mencegah kejahatan penggandaan kartu (anti-skimming). Saat masuk ATM, posisi chip wajib berada di atas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>2. Nomor Kartu 16 Digit</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    16 digit angka unik milik Anda yang di-emboss pada kartu fisik. 4 digit pertama merupakan kode jaringan perbankan (misal 5371 untuk Nusantara Mastercard), diikuti nomor rekening turunan dan angka luhn checksum.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <UserCheck className="w-4 h-4" />
                    <span>3. Nama Pemilik Rekening</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nama lengkap nasabah yang tercetak timbul dengan huruf kapital. Menjadi bukti sah kepemilikan kartu saat bertransaksi di merchant EDC atau kantor cabang bank.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                    <Clock className="w-4 h-4" />
                    <span>4. Masa Berlaku (Valid Thru)</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Format Bulan / Tahun (MM/YY) sampai kapan kartu dapat dipakai (5 tahun sejak diterbitkan). Bila telah habis masa berlakunya, kartu wajib diganti di mesin ATM atau kantor cabang.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <Lock className="w-4 h-4" />
                  <span>5. Kode Keamanan CVV / CVC (3 Angka di Belakang Kartu)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  3 digit angka unik yang diacak sistem dan tercetak pada pita tanda tangan di bagian belakang kartu. Bersifat sangat rahasia untuk otorisasi belanja online. Jangan pernah memberitahukan 3 angka ini kepada siapa pun!
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 4 ================= */}
          {activeChapter === 4 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 4 — ALGORITMA SISTEM
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  4️⃣ Sistem Nomor Rekening — Otomatis & Acak
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bank Nusantara menerapkan protokol keamanan ketat dimana nomor rekening dihasilkan secara acak dan mandiri oleh mesin inti perbankan (Core Banking System).
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Cara Kerja Algoritma Pengacakan Rekening:</h3>
                  <ul className="text-xs space-y-2 text-slate-300 list-disc list-inside">
                    <li>Setiap kali rekening baru disetujui, generator sistem akan mengacak sendiri 10 digit nomor rekening yang belum pernah digunakan.</li>
                    <li><strong>Tidak bisa diketik manual oleh siapa pun</strong>, termasuk Admin, Teller, bahkan Direksi Bank Nusantara.</li>
                    <li>Nomor rekening selalu tepat terdiri dari <strong>10 digit angka unik</strong>.</li>
                    <li>Jika nasabah meminta ganti nomor rekening (karena alasan keamanan), sistem akan mengacak ulang nomor baru secara otomatis.</li>
                    <li>Sistem menjamin 100% setiap nomor rekening pasti berbeda dan tidak akan pernah ada yang kembar.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                  <h4 className="font-bold text-blue-300 text-xs uppercase tracking-wider">
                    Contoh Alur Penerbitan Nomor:
                  </h4>
                  <div className="font-mono text-xs space-y-1 text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <p>1. Pemohon isi formulir & kirim ➔ Disetujui Admin</p>
                    <p>2. Core Banking RNG aktif ➔ Terbit: <span className="text-amber-400 font-bold">1029384756</span></p>
                    <p>3. Permintaan ganti nomor via ATM ➔ Terbit baru: <span className="text-cyan-400 font-bold">2910384756</span></p>
                    <p className="text-slate-500 text-[11px] pt-1">*Permintaan nomor cantik seperti &quot;1234567890&quot; ditolak otomatis oleh sistem demi kepatuhan regulasi.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 5 ================= */}
          {activeChapter === 5 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 5 — PETUNJUK MESIN ATM FISIK
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  5️⃣ Tata Cara Menggunakan Mesin ATM dari Awal (Langkah 1 - 6)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Panduan lengkap langkah demi langkah pengoperasian anjungan tunai mandiri (ATM) Bank Nusantara mulai dari memasukkan kartu hingga pengambilan uang tunai.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</span>
                  <div>
                    <strong className="text-white block text-sm">Langkah 1 — Masukkan Kartu ke Lubang Kartu</strong>
                    <p className="text-slate-400 mt-0.5">Pastikan posisi chip EMV emas berada di bagian depan atas menghadap ke dalam slot kartu mesin ATM.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</span>
                  <div>
                    <strong className="text-white block text-sm">Langkah 2 — Pilih Bahasa Layanan</strong>
                    <p className="text-slate-400 mt-0.5">Pilih <em>Bahasa Indonesia</em> atau <em>English</em> pada tombol layar monitor sentuh.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</span>
                  <div>
                    <strong className="text-white block text-sm">Langkah 3 — Masukkan 6 Digit Kode PIN Kartu Anda</strong>
                    <p className="text-slate-400 mt-0.5">Ketik 6 digit PIN dengan hati-hati pada keypad fisik. Tutupi keypad dengan tangan Anda untuk menjaga kerahasiaan.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">4</span>
                  <div>
                    <strong className="text-white block text-sm">Langkah 4 — Pilih Menu Transaksi yang Dibutuhkan</strong>
                    <p className="text-slate-400 mt-0.5">Tersedia 11 menu utama: Cek Saldo, Tarik Tunai, Setor Tunai, Transfer, Mutasi, Ganti PIN, Ganti Rekening, Cetak Struk, dll.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">5</span>
                  <div>
                    <strong className="text-white block text-sm">Langkah 5 — Masukkan Nominal Uang atau Rekening Tujuan</strong>
                    <p className="text-slate-400 mt-0.5">Pilih pecahan cepat (Rp 100.000, Rp 500.000, Rp 1.000.000) atau ketik jumlah lain sesuai limit harian jenis kartu Anda.</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0">6</span>
                  <div>
                    <strong className="text-white block text-sm">Langkah 6 — Ambil Uang, Kartu, dan Struk Bukti Transaksi</strong>
                    <p className="text-slate-400 mt-0.5">Tunggu dispenser uang menghitung lembaran uang. Ambil kartu ATM terlebih dahulu, lalu ambil uang tunai dan struk cetak.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 6 ================= */}
          {activeChapter === 6 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-teal-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 6 — DAFTAR FITUR LENGKAP
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  6️⃣ 11 Fitur Lengkap di Mesin ATM Nusantara
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Anjungan Tunai Mandiri Bank Nusantara dilengkapi 11 modul transaksi canggih untuk melayani seluruh kebutuhan finansial nasabah:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">1. Cek Saldo</span>
                  <p className="text-slate-400 mt-0.5">Mengetahui sisa uang di rekening secara instan di layar monitor tanpa memotong saldo.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">2. Tarik Tunai</span>
                  <p className="text-slate-400 mt-0.5">Mengambil uang tunai rupiah dengan verifikasi PIN kartu dan pemantauan limit penarikan harian.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">3. Setor Tunai (CDM)</span>
                  <p className="text-slate-400 mt-0.5">Menyetor uang kertas pecahan Rp 50.000 atau Rp 100.000 langsung ke rekening melalui slot setoran uang.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">4. Transfer Antar Rekening</span>
                  <p className="text-slate-400 mt-0.5">Memindahkan uang ke sesama rekening Bank Nusantara tanpa biaya admin (gratis Rp 0).</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">5. Transfer ke Bank Lain</span>
                  <p className="text-slate-400 mt-0.5">Mengirim uang ke jaringan bank nasional (BCA, Mandiri, BRI, BNI, BSI, CIMB Niaga, Permata).</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">6. Cek Nomor Rekening</span>
                  <p className="text-slate-400 mt-0.5">Melihat dan memeriksa nomor rekening 10 digit Anda apabila nasabah lupa nomor rekeningnya.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">7. Ganti Nomor Rekening Acak</span>
                  <p className="text-slate-400 mt-0.5">Sistem secara otomatis mengacak 10 digit nomor rekening baru untuk keamanan (wajib PIN kartu).</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">8. Ganti PIN Kartu</span>
                  <p className="text-slate-400 mt-0.5">Mengubah kode 6 digit PIN lama Anda dengan kombinasi PIN baru demi menjaga keamanan kartu.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">9. Mutasi Rekening Terakhir</span>
                  <p className="text-slate-400 mt-0.5">Melihat riwayat 5 transaksi terakhir baik uang masuk maupun keluar langsung di layar atau struk.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-teal-400 text-sm block">10. Cek Status Transfer</span>
                  <p className="text-slate-400 mt-0.5">Mengecek status nomor referensi transfer apakah sudah berhasil sampai ke rekening tujuan.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 sm:col-span-2">
                  <span className="font-bold text-teal-400 text-sm block">11. Cetak Ulang Struk Bukti Transaksi</span>
                  <p className="text-slate-400 mt-0.5">Mencetak kembali tanda terima bukti pembayaran atau transfer sebelumnya jika struk hilang.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 7 ================= */}
          {activeChapter === 7 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 7 — PANDUAN TRANSFER RESMI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  7️⃣ Prosedur & Aturan Transfer Antar Rekening (8 Langkah)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Prosedur 8 langkah transfer resmi Bank Nusantara untuk memastikan dana sampai dengan aman dan akurat.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span><strong>Langkah 1:</strong> Pilih menu &quot;Transfer&quot; pada layar ATM atau dashboard internet banking.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span><strong>Langkah 2:</strong> Tentukan jenis transfer: Rekening Sendiri, Sesama Bank Nusantara, atau Antar Bank Lain.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span><strong>Langkah 3:</strong> Masukkan nomor rekening tujuan (10 digit angka yang unik dan diacak sistem).</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                  <span><strong>Langkah 4:</strong> Sistem menampilkan <strong>nama pemilik rekening penerima</strong> secara otomatis. Periksa kebenaran nama.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">5</span>
                  <span><strong>Langkah 5:</strong> Ketik nominal uang rupiah yang ingin dikirimkan.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">6</span>
                  <span><strong>Langkah 6:</strong> Periksa ringkasan transfer lalu tekan tombol <strong>Ya / Benar</strong> untuk konfirmasi.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">7</span>
                  <span><strong>Langkah 7:</strong> Masukkan 6 digit PIN rahasia Anda sebagai tanda verifikasi otorisasi akhir.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-[11px]">8</span>
                  <span><strong>Langkah 8:</strong> Transaksi diproses, bukti struk diterbitkan, dan notifikasi terkirim seketika.</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 8 ================= */}
          {activeChapter === 8 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 8 — EKOSISTEM DIGITAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  8️⃣ Fitur Tambahan &amp; Layanan Digital Terpadu
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bank Nusantara menghadirkan ekosistem perbankan digital komprehensif dengan beragam layanan interaktif:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">1. Pembayaran Listrik PLN & Token</span>
                  <span className="text-slate-400 text-[11px]">Beli token listrik prabayar 20 digit atau bayar tagihan bulanan.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">2. Pulsa & Kuota Seluler</span>
                  <span className="text-slate-400 text-[11px]">Isi ulang kuota Telkomsel, Indosat, XL, Tri, dan Smartfren.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">3. Tagihan Air PDAM Nasional</span>
                  <span className="text-slate-400 text-[11px]">Pembayaran air bersih untuk seluruh PDAM kota/kabupaten.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">4. Iuran BPJS Kesehatan</span>
                  <span className="text-slate-400 text-[11px]">Bayar iuran jaminan kesehatan keluarga tanpa antre di faskes.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">5. Top-Up Saldo E-Wallet</span>
                  <span className="text-slate-400 text-[11px]">GoPay, OVO, DANA, ShopeePay, LinkAja seketika.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">6. Transaksi QRIS Terstandar BI</span>
                  <span className="text-slate-400 text-[11px]">Scan QR merchant di seluruh Indonesia langsung dari saldo.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">7. Tarik Tunai Tanpa Kartu (Cardless)</span>
                  <span className="text-slate-400 text-[11px]">Tarik uang di mesin ATM hanya dengan kode token 6 digit.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">8. Tabungan Deposito Online</span>
                  <span className="text-slate-400 text-[11px]">Simpanan berjangka dengan bunga kompetitif hingga 5,25% p.a.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">9. Celengan Impian (Pocket Savings)</span>
                  <span className="text-slate-400 text-[11px]">Pisahkan tabungan liburan, dana darurat, dan gadget impian.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">10. Bagi Tagihan (Split Bill)</span>
                  <span className="text-slate-400 text-[11px]">Patungan makan bersama teman langsung via kontak nomor.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">11. Konversi Valuta Asing (Valas)</span>
                  <span className="text-slate-400 text-[11px]">Kalkulator kurs real-time USD, SGD, JPY, EUR, SAR, AUD.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">12. Pengaturan Limit Harian Kartu</span>
                  <span className="text-slate-400 text-[11px]">Atur batas maksimal tarik tunai dan transfer harian dengan PIN.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">13. Kontrol Transaksi Online & Luar Negeri</span>
                  <span className="text-slate-400 text-[11px]">Sakelar keamanan e-commerce dan transaksi internasional.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">14. Buka Blokir Kartu Mandiri dengan PIN</span>
                  <span className="text-slate-400 text-[11px]">Buka kembali kartu yang diblokir tanpa repot ke kantor cabang.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">15. Penguncian Kartu Sementara (Freeze)</span>
                  <span className="text-slate-400 text-[11px]">Kunci kartu seketika saat terselip dan buka kapan saja.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">16. Unduh Rekening Koran (E-Statement)</span>
                  <span className="text-slate-400 text-[11px]">Cetak laporan mutasi resmi bertanda tangan digital.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">17. Pusat Bantuan & CS Live Ticket</span>
                  <span className="text-slate-400 text-[11px]">Layanan keluhan nasabah siaga 24 jam respons cepat.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">18. Transfer Terjadwal Otomatis</span>
                  <span className="text-slate-400 text-[11px]">Atur pengiriman uang otomatis setiap tanggal tertentu.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">19. Kontak Rekening Favorit</span>
                  <span className="text-slate-400 text-[11px]">Simpan nomor rekening tujuan transfer langganan Anda.</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="font-bold text-white block">20. Nusantara PayChat</span>
                  <span className="text-slate-400 text-[11px]">Kirim uang sambil mengobrol langsung antar nomor telepon.</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 9 ================= */}
          {activeChapter === 9 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-yellow-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 9 — KEAMANAN & ANTI-FRAUD
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  9️⃣ Protokol Keamanan & Perlindungan Kartu ATM
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pedoman wajib menjaga keamanan kartu debit, kerahasiaan PIN 6 digit, dan perlindungan dari kejahatan skimming:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-amber-400 text-sm block">1. Kerahasiaan 6 Digit Kode PIN</span>
                  <p className="text-slate-300">
                    PIN adalah kunci brankas rekening Anda. Jangan pernah memberitahukan PIN kepada keluarga, teman, bahkan petugas/Admin Bank Nusantara sekalipun. Petugas bank tidak pernah meminta PIN nasabah.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-blue-400 text-sm block">2. Tutupi Tangan Saat Memasukkan PIN di Mesin ATM</span>
                  <p className="text-slate-300">
                    Selalu tutupi tangan yang sedang mengetik angka di keypad ATM dengan tangan lainnya atau dompet untuk mencegah rekaman kamera pengintai tersembunyi (hidden pinhole camera).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-rose-400 text-sm block">3. Waspada Alat Modifikasi di Mulut Slot Kartu (Anti-Skimmer)</span>
                  <p className="text-slate-300">
                    Raba dan goyangkan mulut slot kartu ATM sebelum memasukkan kartu. Jika slot terasa longgar, ada bekas lem, atau terdapat tonjolan plastik yang mencurigakan, jangan gunakan mesin tersebut dan segera lapor ke satpam/kantor bank terdekat.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-emerald-400 text-sm block">4. Manfaatkan Fitur Kunci Sementara (Freeze Card)</span>
                  <p className="text-slate-300">
                    Jika kartu tertinggal di suatu tempat atau tidak sengaja hilang, segera buka dashboard Bank Nusantara dan aktifkan fitur &quot;Kunci Sementara&quot; menggunakan PIN Anda untuk mencegah penyalahgunaan.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-purple-400 text-sm block">5. Gantilah PIN Secara Berkala (Minimal 3 Bulan Sekali)</span>
                  <p className="text-slate-300">
                    Lakukan pergantian kode PIN melalui mesin ATM atau menu keamanan aplikasi secara berkala untuk memperkecil risiko pembobolan akun.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 10 ================= */}
          {activeChapter === 10 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 10 — PINJAMAN ONLINE RESMI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  🔟 Layanan Pinjaman Online & Analisis Kredit
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bank Nusantara menyediakan fasilitas pinjaman online resmi langsung masuk ke rekening dengan proses cepat dan bunga terjangkau:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-amber-300 text-sm block">Pinjaman Kecil</span>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>Plafon: Rp 1.000.000 – Rp 5.000.000</li>
                    <li>Tenor: 3, 6, hingga 12 bulan</li>
                    <li>Bunga: 1% per bulan (flat)</li>
                    <li>Ideal untuk: Kebutuhan mendesak, dana darurat, belanja kebutuhan harian.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-2">
                  <span className="font-bold text-blue-300 text-sm block">Pinjaman Menengah</span>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>Plafon: Rp 5.000.000 – Rp 25.000.000</li>
                    <li>Tenor: 6, 12, hingga 24 bulan</li>
                    <li>Bunga: 1% per bulan (flat)</li>
                    <li>Ideal untuk: Modal usaha kecil, renovasi ringan, biaya pendidikan anak.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                  <span className="font-bold text-amber-400 text-sm block">Pinjaman Bisnis</span>
                  <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                    <li>Plafon: Rp 25.000.000 – Rp 100.000.000</li>
                    <li>Tenor: 12, 24, hingga 36 bulan</li>
                    <li>Bunga: 1% per bulan (flat)</li>
                    <li>Ideal untuk: Ekspansi bisnis, pembelian mesin/aset, modal kerja usaha.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 pt-3">
                <h4 className="font-bold text-white text-sm">6 Langkah Pengajuan Pinjaman:</h4>
                <ol className="text-[11px] text-slate-300 space-y-1.5 list-decimal list-inside">
                  <li>Pilih jenis pinjaman sesuai kebutuhan Anda pada kalkulator simulasi kredit.</li>
                  <li>Tentukan jumlah uang yang ingin dipinjam dan jangka waktu pengembalian (tenor).</li>
                  <li>Sistem otomatis menghitung estimasi angsuran pokok dan bunga per bulan.</li>
                  <li>Isi formulir pengajuan dengan data penghasilan bulanan, pekerjaan, dan tujuan pinjaman.</li>
                  <li>Kirimkan permohonan ➔ permohonan masuk ke antrean verifikasi Admin Bank Nusantara.</li>
                  <li>Jika disetujui Admin, dana langsung <strong>cair seketika ke saldo rekening</strong> Anda.</li>
                </ol>
              </div>
            </div>
          )}

          {/* ================= BAB 11 ================= */}
          {activeChapter === 11 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 11 — UPGRADE TIER KARTU
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣1️⃣ Prosedur Upgrade Kartu ke Emas / Premium & Tinjauan Admin
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Aturan Bank Nusantara: Seluruh pendaftaran awal menerbitkan Kartu Biasa (Reguler). Untuk menaikkan tier ke Kartu Emas atau Premium, nasabah wajib mengajukan permohonan upgrade dengan persetujuan Admin.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Syarat Pengajuan Upgrade:</h3>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>Kartu Reguler saat ini berstatus <strong>Aktif</strong> (tidak dalam keadaan terblokir/freeze).</li>
                    <li>Untuk <strong>Kartu Emas</strong>: Estimasi penghasilan bulanan minimal Rp 7.000.000. Limit tarik naik jadi Rp 5.000.000/hari.</li>
                    <li>Untuk <strong>Kartu Premium</strong>: Estimasi penghasilan bulanan minimal Rp 15.000.000. Limit tarik naik jadi Rp 10.000.000/hari.</li>
                    <li>Menyertakan alasan peningkatan kartu (misal: keperluan belanja keluarga atau perputaran modal usaha).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <h4 className="font-bold text-amber-300 text-sm">Alur Otorisasi Admin:</h4>
                  <p className="text-slate-300 leading-relaxed">
                    Setelah nasabah menekan &quot;Kirim Permohonan Upgrade&quot; pada dashboard, permohonan masuk ke tab <strong>Persetujuan Upgrade Kartu</strong> di Panel Admin. Admin akan memeriksa histori saldo dan kelayakan nasabah. Jika disetujui, tier kartu dan tampilan kartu visual berubah seketika, dan nasabah memperoleh limit penarikan harian yang baru.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 12 ================= */}
          {activeChapter === 12 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 12 — TATA KELOLA KEUANGAN ADMIN
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣2️⃣ Sistem Tinjauan Finansial Admin (Penerimaan Wajib)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  SOP Bank Nusantara: Semua aktivitas keuangan (Tarik tunai ATM, Setor tunai CDM, dan Transfer dana) wajib melalui penerimaan dan persetujuan Admin terlebih dahulu.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Prinsip &quot;Dual-Control Otorisasi Admin&quot;:</h3>
                  <p className="text-slate-300 leading-relaxed">
                    Demi melindungi dana nasabah dari anomali transaksi dan kejahatan perbankan, setiap transaksi yang diinisiasi oleh nasabah diberi status awal <code>pending</code> (Menunggu Tinjauan Admin).
                  </p>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside pt-1">
                    <li><strong>Setor Tunai ATM:</strong> Saldo rekening nasabah baru akan bertambah setelah Admin memverifikasi dan menyetujui lembaran uang di brankas ATM.</li>
                    <li><strong>Tarik Tunai ATM:</strong> Permohonan dicatat dan dana didebit resmi setelah diverifikasi oleh Admin.</li>
                    <li><strong>Transfer Antar Rekening:</strong> Sistem mencocokkan nomor rekening dan Admin meninjau kesesuaian transaksi sebelum saldo pengirim dipotong dan dikreditkan ke penerima.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-2">
                  <h4 className="font-bold text-emerald-400 text-sm">Cara Admin Memproses Antrean Keuangan:</h4>
                  <p className="text-slate-300">
                    Admin masuk ke Panel Admin dengan PIN rahasia <strong>159357</strong> ➔ buka tab <strong>Tinjauan Keuangan Wajib Admin</strong> ➔ klik tombol <em>&quot;Terima & Eksekusi Dana&quot;</em> atau <em>&quot;Setujui Semua Transaksi Sekaligus&quot;</em>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 13 ================= */}
          {activeChapter === 13 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 13 — INOVASI ATM
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣3️⃣ Panduan Tarik Tunai Tanpa Kartu (Cardless Cash ATM)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tarik uang di seluruh jaringan mesin ATM Bank Nusantara tanpa perlu membawa kartu fisik, cukup menggunakan kode token 6 digit dari ponsel pintar Anda.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-white block text-sm">Langkah 1 — Buat Token di Aplikasi Mobile:</strong>
                  <p className="text-slate-400">Masuk ke menu <em>Layanan Digital</em> ➔ pilih <em>Tarik Tunai Tanpa Kartu</em> ➔ pilih nominal ➔ masukkan PIN kartu Anda ➔ dapatkan 6 digit kode token rahasia.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-white block text-sm">Langkah 2 — Menuju Mesin ATM Bank Nusantara:</strong>
                  <p className="text-slate-400">Di layar standby ATM, tekan tombol layar <em>&quot;Transaksi Tanpa Kartu (Cardless)&quot;</em>.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-white block text-sm">Langkah 3 — Masukkan Nomor Telepon & Kode Token:</strong>
                  <p className="text-slate-400">Ketik nomor HP yang terdaftar pada rekening Anda, kemudian ketik 6 digit kode token yang diterbitkan aplikasi.</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <strong className="text-white block text-sm">Langkah 4 — Uang Keluar dari Dispenser Mesin ATM:</strong>
                  <p className="text-slate-400">Mesin ATM menghitung uang dan dispenser terbuka secara otomatis. Kode token berlaku selama 30 menit.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 14 ================= */}
          {activeChapter === 14 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 14 — INVESTASI BERJANGKA
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣4️⃣ Sistem Tabungan Deposito Online & Bunga Majemuk
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Investasikan dana mengendap Anda ke dalam produk Deposito Online Bank Nusantara dengan imbal hasil terjamin dan penjaminan LPS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-white text-sm block">Tenor 3 Bulan</span>
                  <span className="text-amber-400 font-mono text-lg font-bold">4.25% p.a.</span>
                  <p className="text-slate-400">Pilihan pas untuk dana jangka pendek dengan likuiditas terencana.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-white text-sm block">Tenor 6 Bulan</span>
                  <span className="text-amber-400 font-mono text-lg font-bold">4.75% p.a.</span>
                  <p className="text-slate-400">Imbal hasil optimal untuk persiapan dana liburan atau pajak tahunan.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="font-bold text-white text-sm block">Tenor 12 Bulan</span>
                  <span className="text-amber-400 font-mono text-lg font-bold">5.25% p.a.</span>
                  <p className="text-slate-400">Tingkat bunga tertinggi dengan proteksi modal maksimal.</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h4 className="font-bold text-white text-sm">Fitur Perpanjangan Otomatis (Automatic Roll Over - ARO):</h4>
                <p className="text-slate-300">
                  Saat jatuh tempo tiba, nasabah dapat memilih apakah bunga ditransfer ke rekening utama atau pokok beserta bunga digulirkan kembali (ARO) secara otomatis.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 15 ================= */}
          {activeChapter === 15 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 15 — MANAJEMEN ANGGARAN
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣5️⃣ Pengelolaan Rekening Celengan Impian (Pocket Savings)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pisahkan tabungan tujuan masa depan Anda tanpa harus membuka nomor rekening bank baru.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Keunggulan Celengan Impian:</h3>
                  <ul className="space-y-1 text-slate-300 list-disc list-inside">
                    <li>Dapat membuat hingga puluhan kantong celengan berbeda (Contoh: Beli Laptop Baru, Liburan ke Bali, Dana Darurat).</li>
                    <li>Sistem pelacak progres persentase visual yang memotivasi Anda terus menabung.</li>
                    <li>Dana dapat dicairkan kembali ke rekening utama kapan saja dalam hitungan detik tanpa denda pinalti.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 16 ================= */}
          {activeChapter === 16 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 16 — TAGIHAN UTILITAS
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣6️⃣ Pembayaran Tagihan Listrik PLN & Pembelian Token Listrik
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Panduan pembelian token listrik prabayar 20 digit serta pembayaran tagihan listrik pascabayar PLN resmi.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-sm">Cara Beli Token Listrik Prabayar:</h3>
                  <ol className="space-y-1.5 text-slate-300 list-decimal list-inside">
                    <li>Buka menu Layanan Digital ➔ pilih <em>Listrik PLN</em>.</li>
                    <li>Masukkan 11-12 digit Nomor Meteran atau ID Pelanggan Anda.</li>
                    <li>Pilih nominal token (Rp 20.000, Rp 50.000, Rp 100.000, Rp 200.000, Rp 500.000, Rp 1.000.000).</li>
                    <li>Sistem langsung menghasilkan <strong>20 digit nomor stroom/token</strong> yang siap Anda ketikkan ke meteran PLN rumah.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 17 ================= */}
          {activeChapter === 17 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 17 — TELEKOMUNIKASI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣7️⃣ Pengisian Pulsa & Paket Kuota Seluler All Operator
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Isi ulang pulsa reguler dan kuota data untuk Telkomsel (SimPATI/By.U), Indosat Ooredoo, XL Axiata, Tri, dan Smartfren tanpa delay.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Ketentuan Pengisian Pulsa:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Pulsa otomatis masuk ke nomor tujuan dalam tempo 3 hingga 5 detik. Riwayat transaksi menyertakan nomor Serial Number (SN) operator seluler sebagai bukti pengisian yang sah.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 18 ================= */}
          {activeChapter === 18 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 18 — JAMINAN SOSIAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣8️⃣ Pembayaran Iuran BPJS Kesehatan & Ketenagakerjaan
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Lakukan pembayaran iuran BPJS Kesehatan keluarga untuk memastikan kartu kepesertaan jaminan kesehatan tetap aktif tanpa denda keterlambatan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Prosedur Bayar BPJS:</h3>
                <p className="text-slate-300">
                  Masukkan nomor Virtual Account (VA) BPJS Kesehatan (biasanya 88888 + 11 digit nomor kartu BPJS). Sistem otomatis menampilkan rincian nama kepala keluarga, jumlah anggota keluarga tertanggung, serta total tagihan bulan berjalan.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 19 ================= */}
          {activeChapter === 19 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 19 — UTILITAS AIR BERSIH
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  1️⃣9️⃣ Pembayaran Tagihan Air Minum PDAM Seluruh Indonesia
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dukungan pembayaran tagihan PAM/PDAM untuk wilayah DKI Jakarta (PAM Jaya), Jawa Barat, Jawa Tengah, Jawa Timur, Sumatera, Kalimantan, Sulawesi, hingga Papua.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Informasi Tagihan PDAM:</h3>
                <p className="text-slate-300">
                  Tagihan memuat kubikasi pemakaian air meteran bulan lalu dan bulan ini, tarif golongan pelanggan, serta bea abodemen resmi pemerintah daerah setempat.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 20 ================= */}
          {activeChapter === 20 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-teal-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 20 — DOMPET DIGITAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣0️⃣ Top-Up Saldo E-Wallet (GoPay, OVO, DANA, ShopeePay)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Isi saldo dompet digital favorit secara instan tanpa biaya admin tersembunyi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Mekanisme Top-Up E-Wallet:</h3>
                <p className="text-slate-300">
                  Cukup pilih logo dompet digital (GoPay, OVO, DANA, ShopeePay), masukkan nomor ponsel akun Anda, pilih nominal (mulai Rp 20.000 hingga Rp 2.000.000), dan saldo langsung terisi seketika.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 21 ================= */}
          {activeChapter === 21 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 21 — QUICK RESPONSE STANDAR NASIONAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣1️⃣ Pembayaran Praktis Menggunakan QRIS Dinamis & Statis
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Panduan transaksi nirkontak menggunakan Quick Response Code Indonesian Standard (QRIS) terstandar Bank Indonesia.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white text-sm block">1. QRIS Statis di Toko Fisik</span>
                  <p className="text-slate-300">Arahkan kamera ponsel ke stiker akrilik QRIS di kasir, ketikkan nominal belanja yang diucapkan kasir, konfirmasi dengan PIN Anda.</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <span className="font-bold text-white text-sm block">2. QRIS Dinamis di Struk / EDC</span>
                  <p className="text-slate-300">Nominal belanja sudah terisi otomatis pada barcode di layar mesin EDC. Nasabah cukup memeriksa nama merchant dan menekan konfirmasi bayar.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 22 ================= */}
          {activeChapter === 22 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 22 — PERPESANAN & FINANSIAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣2️⃣ Nusantara PayChat — Mengirim Uang Sambil Berkirim Pesan Antar Nomor
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Fitur eksklusif Bank Nusantara yang menggabungkan kemudahan chatting interaktif dengan transfer uang seketika berdasarkan nomor ponsel.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Cara Pakai Nusantara PayChat:</h3>
                <ol className="space-y-1.5 text-slate-300 list-decimal list-inside">
                  <li>Buka tab <strong>Chat Antar Nomor (PayChat)</strong> di dashboard.</li>
                  <li>Pilih kontak nasabah yang ingin dihubungi.</li>
                  <li>Ketik pesan percakapan seperti biasa.</li>
                  <li>Tekan ikon <strong>&quot;Kirim Uang via Chat&quot;</strong> ➔ ketik nominal dan catatan ➔ transfer tersemat rapi di dalam gelembung obrolan chat secara real-time!</li>
                </ol>
              </div>
            </div>
          )}

          {/* ================= BAB 23 ================= */}
          {activeChapter === 23 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 23 — PENGATURAN LIMIT
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣3️⃣ Pengaturan Limit Transaksi Harian dengan Verifikasi PIN 6 Digit
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kendalikan batas pengeluaran debit harian Anda untuk melindungi saldo dari transaksi berlebih.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Verifikasi PIN Wajib:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Setiap perubahan batas pengeluaran kartu (misal menurunkan batas belanja dari Rp 5.000.000 ke Rp 1.000.000) wajib memverifikasi 6 digit PIN kartu debit Anda untuk memastikan hanya pemilik sah kartu yang memiliki kuasa mengubah konfigurasi.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 24 ================= */}
          {activeChapter === 24 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 24 — KEAMANAN SIBER KARTU
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣4️⃣ Kontrol Transaksi Debit Online (E-Commerce) & Internasional
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Perlindungan maksimal kartu saat berbelanja di website toko online dalam maupun luar negeri.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Sakelar Transaksi Luar Negeri:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Jika Anda tidak sedang bepergian ke luar negeri atau tidak berbelanja di situs internasional, matikan sakelar &quot;Transaksi Internasional&quot;. Dengan demikian, kartu Anda kebal terhadap penagihan lintas negara yang mencurigakan.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 25 ================= */}
          {activeChapter === 25 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 25 — KONTROL KARTU MANDIRI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣5️⃣ Prosedur Buka Blokir Kartu Mandiri Debit dengan PIN
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Buka blokir kartu debit yang terkunci tanpa perlu antre di kantor cabang bank.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Ketentuan Buka Blokir Mandiri:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Nasabah cukup menekan tombol &quot;Buka Blokir Kartu&quot; pada dashboard ➔ memasukkan 6 digit PIN rahasia yang benar ➔ sistem memverifikasi kesesuaian data dan kartu kembali aktif seketika untuk bertransaksi di ATM maupun merchant.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 26 ================= */}
          {activeChapter === 26 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-rose-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 26 — PENGUNCIAN KARTU
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣6️⃣ Fitur Penguncian Kartu Sementara (Freeze / Unfreeze)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bekukan kartu Anda dalam hitungan detik saat kartu terselip atau tertinggal.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Perbedaan Freeze vs Blokir Permanen:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Fitur <strong>Freeze (Kunci Sementara)</strong> tidak membatalkan kartu fisik Anda. Uang tetap aman di rekening dan semua transaksi penarikan di ATM ditolak sementara. Saat kartu sudah ditemukan kembali, Anda cukup membuka kuncinya (Unfreeze) menggunakan PIN kartu.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 27 ================= */}
          {activeChapter === 27 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 27 — PASAR UANG GLOBAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣7️⃣ Transaksi Valuta Asing (Valas) & Kalkulator Kurs Real-Time
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Pantau pergerakan nilai tukar mata uang asing dunia (USD, SGD, JPY, EUR, SAR, AUD) dengan kurs bersaing.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Kalkulator Simulasi Kurs:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Fitur kalkulator kurs interaktif memudahkan perhitungan konversi Rupiah ke mata uang asing untuk kebutuhan liburan ke luar negeri, ibadah Umroh/Haji (SAR), maupun transaksi bisnis ekspor impor.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 28 ================= */}
          {activeChapter === 28 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 28 — PATUNGAN SOSIAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣8️⃣ Fitur Bagi Tagihan Otomatis (Split Bill Nusantara)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Bagi rata total struk makan di restoran atau sewa penginapan bersama teman-teman tanpa perlu kalkulator manual.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Alur Split Bill:</h3>
                <p className="text-slate-300 leading-relaxed">
                  Ketik total tagihan struk ➔ tentukan jumlah orang ➔ sistem otomatis menghitung porsi tagihan tiap peserta (termasuk pajak dan service fee) ➔ bagikan tautan permintaan pembayaran langsung ke ruang chat.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 29 ================= */}
          {activeChapter === 29 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 29 — DOKUMENTASI RESMI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  2️⃣9️⃣ Pencetakan & Pengunduhan Rekening Koran Digital (E-Statement PDF)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Dapatkan laporan rekening koran lengkap dengan stempel digital resmi Bank Nusantara untuk keperluan pengajuan visa, audit, atau arsip pribadi.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h3 className="font-bold text-white text-sm">Legalitas E-Statement:</h3>
                <p className="text-slate-300 leading-relaxed">
                  E-Statement memuat rekap saldo awal, seluruh mutasi debet/kredit, saldo akhir, serta kode QR verifikasi dokumen digital yang sah diakui oleh kedutaan besar dan instansi resmi.
                </p>
              </div>
            </div>
          )}

          {/* ================= BAB 30 ================= */}
          {activeChapter === 30 && (
            <div className="space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 30 — PUSAT BANTUAN RESMI
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  3️⃣0️⃣ Layanan Pusat Bantuan & Pengaduan Nasabah 24 Jam
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Kanal pengaduan resmi nasabah Bank Nusantara yang siaga melayani Anda 24 jam sehari, 7 hari seminggu.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Contact Center 24 Jam</span>
                  </div>
                  <p className="text-slate-300">Hubungi <strong>1500-888</strong> (Bebas Pulsa bagi seluruh pengguna jaringan telekomunikasi nasional).</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    <span>Layanan Pengaduan Tiket Digital</span>
                  </div>
                  <p className="text-slate-300">Kirim tiket pengaduan langsung melalui menu Pusat Bantuan di dashboard nasabah untuk penanganan prioritas.</p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 31 (100x LIPAT PENJELASAN LENGKAP) ================= */}
          {activeChapter === 31 && (
            <div className="space-y-6 text-xs">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  BAB 31 — DOKUMENTASI SUPER LENGKAP (100x LIPAT PENJELASAN)
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  3️⃣1️⃣ Ensiklopedia 100x Lipat: Login Google, Kartu Lama, Verifikasi Centang Biru & Notifikasi Sistem Website
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Penjelasan terperinci 100x lipat mengenai seluruh alur terbaru Bank Nusantara dari tahap awal hingga fitur Super Admin.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-slate-950 border border-blue-500/40 space-y-2">
                  <h3 className="font-black text-blue-300 text-sm">
                    1. Alur Masuk Akun Google & Pendaftaran Kartu di Awal
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Saat pertama kali mengakses website Bank Nusantara, pengguna wajib <strong>Masuk Menggunakan Akun Google</strong> terlebih dahulu. Setelah berhasil masuk dengan Akun Google, sistem menampilkan halaman <strong>Mulai Daftar Kartu Baru</strong> sehingga pengguna dapat langsung mengisi formulir pembukaan kartu debit dan memilih 6 digit PIN kartu barunya. Pengguna juga dapat menguji ulang layar Login Google ini kapan saja melalui tombol <strong>"Ganti Google"</strong> pada menu profil di pojok kanan atas.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
                  <h3 className="font-black text-amber-300 text-sm">
                    2. Cara Login / Pindah dari Kartu Baru ke Kartu Lama (Wajib PIN Kartu Lama, Bukan PIN Admin)
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Apabila Anda memiliki <strong>Kartu Baru</strong> dan juga memiliki <strong>Kartu Lama</strong>, lalu Anda ingin login atau beralih kembali ke <strong>Kartu Lama</strong> Anda (baik dari layar awal setelah Google Login maupun dari menu Ganti Kartu di pojok kanan atas Navbar), sistem mewajibkan Anda memasukkan <strong>6 digit PIN Kartu Lama</strong> Anda (bukan menggunakan PIN Admin). Jika Anda lupa PIN kartu lama tersebut, tersedia tombol <strong>"Lupa PIN?"</strong> yang akan mengirimkan permohonan tinjauan ke Panel Admin agar Admin dapat memberitahukan PIN kartu lama Anda di layar.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/40 space-y-2">
                  <h3 className="font-black text-sky-300 text-sm">
                    3. Lencana Verifikasi Centang Biru (Verification Badge Icon) di Panel Admin
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Di dalam <strong>Panel Admin (Tab: Verifikasi Centang Biru)</strong>, Admin dapat memberikan atau mencabut <strong>Lencana Verifikasi Centang Biru (Verification Badge Icon)</strong> pada akun/kartu mana pun, lengkap dengan label gelar verifikasi yang dapat disesuaikan. Kartu yang telah terverifikasi akan menampilkan ikon Centang Biru resmi di atas permukaan Kartu 3D, di samping nama nasabah pada Navbar, serta di header Dashboard Mobile Banking.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2">
                  <h3 className="font-black text-emerald-300 text-sm">
                    4. Perbaikan Banned Kartu 1 Menit (Auto-Unban Real-Time) & Notifikasi Sistem Website yang Bisa Ditutup
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Ketika Admin melakukan <strong>Banned Kartu</strong> dengan durasi Custom (contohnya <strong>1 Menit</strong>), sistem menghitung mundur waktu tersisa secara <em>real-time</em> detik demi detik (`00m 59d` ... `00m 00d`). Tepat saat waktu 1 menit habis, status Banned pada kartu otomatis terbuka kembali menjadi <strong>Aktif</strong> tanpa perlu refresh halaman. Saat kartu terbuka (baik karena waktu 1 menit habis maupun dibuka manual oleh Admin), muncul <strong>Notifikasi Sistem Website</strong> langsung di dalam layar website (bukan notifikasi dari Google dan bukan dari sistem HP) yang menginformasikan bahwa kartu Anda telah terbuka kembali, lengkap dengan tombol <strong>"Saya Sudah Tahu — Tutup Notifikasi"</strong> dan tombol <strong>✕</strong>.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/40 space-y-2">
                  <h3 className="font-black text-purple-300 text-sm">
                    5. Tombol &quot;Penjelasan Lengkap 100x Lipat&quot; di Layanan Digital
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    Setiap fitur di dalam menu Layanan Digital maupun di dalam tab Kontrol Fitur Panel Admin kini dilengkapi tombol <strong>"📚 Penjelasan Lengkap 100x Lipat"</strong>. Ketika diklik, sistem membuka jendela ensiklopedia 6 bagian yang memuat Ringkasan Eksekutif, SOP 6 Langkah, Arsitektur Core-Banking, Protokol Keamanan Berlapis, Simulasi Perhitungan Keuangan, serta Tanya Jawab (FAQ) lengkap.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= BAB 32 S/D BAB 65 (EKSPANSI 34 BAB BARU) ================= */}
          {EXTRA_CHAPTERS_DATA.map((ch) => {
            if (!showAllChaptersMode && activeChapter !== ch.id) return null;
            return (
              <div key={ch.id} className="space-y-6 text-xs pt-4 border-t border-slate-800/60 first:border-t-0 first:pt-0">
                <div className="border-b border-slate-800 pb-4">
                  <span className={`${ch.color} font-mono text-xs font-bold uppercase tracking-wider`}>
                    {ch.badge}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {ch.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">{ch.subtitle}</p>
                </div>

                <div className="space-y-4">
                  {ch.sections.map((sec, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      <h3 className={`font-black text-sm ${ch.color}`}>{sec.heading}</h3>
                      <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">{sec.body}</p>
                      {sec.bullets && sec.bullets.length > 0 && (
                        <ul className="space-y-2 pt-2 border-t border-slate-900 text-slate-200">
                          {sec.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Bottom Next/Prev Pagination */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800 text-xs">
            <button
              onClick={() => {
                if (activeChapter > 1) {
                  setActiveChapter(activeChapter - 1);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }
              }}
              disabled={activeChapter === 1}
              className={`px-4 py-2 rounded-xl border border-slate-700 font-semibold cursor-pointer transition-all ${
                activeChapter === 1 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              ← Bab Sebelumnya
            </button>

            <span className="font-mono text-slate-400">
              Bab {activeChapter} dari 65
            </span>

            <button
              onClick={() => {
                if (activeChapter < 65) {
                  setActiveChapter(activeChapter + 1);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }
              }}
              disabled={activeChapter === 65}
              className={`px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white cursor-pointer transition-all ${
                activeChapter === 65 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              Bab Selanjutnya →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
