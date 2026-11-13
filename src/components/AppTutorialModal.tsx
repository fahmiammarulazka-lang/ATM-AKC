import React, { useState, useMemo } from 'react';
import {
  X,
  GraduationCap,
  CheckCircle2,
  Lock,
  Sparkles,
  Search,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  BookOpen,
  ShieldAlert,
  Cpu,
  Settings,
  Wrench,
  Layers,
  Trash2,
  Bot,
  HelpCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

interface TutorialButtonInfo {
  buttonName: string;
  location: string;
  functionDetail: string;
}

interface TutorialChapter {
  id: string;
  chapterNumber: number;
  category: string;
  icon: string;
  title: string;
  subtitle: string;
  deepExplanationParagraphs: string[];
  buttonsAndInputs: TutorialButtonInfo[];
  stepByStepGuide: string[];
  formulaOrSimulation: string[];
  tipsAndTroubleshooting: string[];
}

const COMPREHENSIVE_TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: 'bab-1-kartu-baru-persetujuan',
    chapterNumber: 1,
    category: 'Dasar & Rekening',
    icon: '💳',
    title: 'Cara Daftar Kartu Baru, Syarat Persetujuan Admin & Sistem Tutorial Otomatis',
    subtitle: 'Penjelasan lengkap alur pembuatan rekening baru dari status Pending hingga Aktif & Terverifikasi',
    deepExplanationParagraphs: [
      'Selamat datang di ekosistem perbankan digital PT Bank Nusantara (Persero) Tbk. Setiap nasabah dapat memiliki lebih dari satu kartu ATM atau rekening tabungan (mulai dari tier Silver, Gold, Platinum, hingga Kartu Admin Unlimited).',
      'Saat Anda menekan tombol "+ Daftar Kartu Baru" di pojok kanan atas layar, sistem akan membuka formulir pendaftaran pembukaan rekening baru. Anda diminta mengisi Nama Lengkap sesuai KTP, Nomor Induk Kependudukan (NIK 16 digit), Nomor HP aktif, Alamat Email, Alamat Domisili, memilih Tier Kartu, menentukan 6 digit PIN Kartu ATM, serta memasukkan nominal Setoran Awal.',
      'PENTING: Sesuai aturan keamanan perbankan berlapis di aplikasi ini, setiap kartu yang baru saja dibuat akan berstatus "MENUNGGU PERSETUJUAN ADMIN (PENDING)". Selama kartu masih berstatus Pending, kartu tersebut belum bisa digunakan untuk memutar Spin the Wheel, belum bisa membuka tutorial lengkap, dan menunggu verifikasi Admin.',
      'Bagaimana cara menyetujui kartu baru tersebut? Anda cukup masuk ke menu "Panel Admin" (masukkan PIN Admin 159357), lalu buka tab "Persetujuan Kartu" atau klik tombol "Setujui Semua Kartu Pending". Begitu Admin menekan tombol Setujui (ACC), status kartu langsung berubah menjadi AKTIF (ACTIVE) dan jendela Tutorial Super Lengkap ini akan terbuka secara otomatis!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [+ Daftar Kartu Baru]',
        location: 'Pojok Kanan Atas Navbar (Sebelah kanan tombol Bot AI & Suara)',
        functionDetail: 'Membuka formulir pembuatan rekening dan kartu ATM baru dengan pilihan tier Silver, Gold, atau Platinum.',
      },
      {
        buttonName: 'Input [PIN Kartu ATM 6 Digit]',
        location: 'Di dalam Modal Daftar Kartu Baru',
        functionDetail: 'Menentukan kode rahasia 6 angka untuk tarik tunai ATM, transfer, dan pindah antar kartu.',
      },
      {
        buttonName: 'Tombol [Setujui / ACC Kartu Baru]',
        location: 'Panel Admin (PIN 159357) -> Tab Persetujuan Kartu',
        functionDetail: 'Mengaktifkan kartu baru yang masih Pending menjadi Active sekaligus membuka akses penuh ke Tutorial Lengkap.',
      },
      {
        buttonName: 'Tombol [📘 Tutorial Lengkap] (Pojok Kiri Bawah)',
        location: 'Bar Mengambang Paling Bawah Layar',
        functionDetail: 'Membuka kembali buku ensiklopedia tutorial ini kapan saja bagi kartu yang sudah disetujui Admin.',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "+ Daftar Kartu Baru" berwarna emas di pojok kanan atas layar.',
      'Isi seluruh kolom identitas (Nama, NIK 16 digit, No HP, Email, Alamat) dan pilih jenis kartu (Silver/Gold/Platinum).',
      'Ketik 6 digit angka PIN ATM yang mudah Anda ingat, lalu klik tombol "Ajukan Pembuatan Kartu".',
      'Buka menu "Panel Admin" menggunakan PIN Admin 159357, lalu klik tombol "Setujui (ACC)" pada kartu baru Anda.',
      'Kartu kini resmi Aktif! Jendela Tutorial Super Lengkap otomatis terbuka untuk memandu Anda.',
    ],
    formulaOrSimulation: [
      'Tier Silver: Setoran awal mulai Rp 50.000 | Limit tarik ATM harian Rp 10.000.000 | Biaya admin bulanan Rp 5.000.',
      'Tier Gold: Setoran awal mulai Rp 500.000 | Limit tarik ATM harian Rp 25.000.000 | Biaya admin bulanan Rp 10.000.',
      'Tier Platinum: Setoran awal mulai Rp 2.000.000 | Limit tarik ATM harian Rp 100.000.000 | Prioritas VIP.',
      'Tier Admin (∞): Saldo Tak Terbatas (Unlimited Rp ∞) | Bebas limit harian | Bebas biaya admin.',
    ],
    tipsAndTroubleshooting: [
      'Jika tutorial menampilkan layar "Menunggu Persetujuan Admin", klik tombol pintas "Buka Panel Admin" atau gunakan fitur "Minta Tolong ke Admin (Mintol)" agar kartu langsung di-ACC.',
    ],
  },
  {
    id: 'bab-2-ganti-kartu-lupa-pin',
    chapterNumber: 2,
    category: 'Dasar & Rekening',
    icon: '🔑',
    title: 'Cara Ganti ke Kartu Lama / Kartu Lain & Solusi Lupa PIN ATM',
    subtitle: 'Aturan keamanan wajib PIN Kartu Lama saat berpindah rekening dan alur pemulihan Lupa PIN',
    deepExplanationParagraphs: [
      'Di pojok kanan atas layar terdapat tombol pemilih akun (Account Switcher) yang menampilkan nama nasabah aktif dan nomor rekeningnya. Ketika diklik, akan muncul daftar seluruh kartu rekening yang terdaftar di Bank Nusantara.',
      'ATURAN KEAMANAN UTAMA: Ketika Anda ingin beralih dari kartu saat ini ke Kartu Lama atau Kartu Lain, sistem mewajibkan Anda memasukkan 6 digit PIN milik Kartu tujuan tersebut (bukan PIN Admin). Hal ini menjaga agar rekening lama Anda tidak bisa dimasuki orang lain tanpa izin.',
      'Bagaimana jika Anda benar-benar lupa PIN kartu lama Anda? Di dalam jendela input PIN terdapat tombol "Lupa PIN?". Ketika Anda menekannya, permohonan peninjauan Lupa PIN akan dikirim ke Panel Admin.',
      'Admin kemudian dapat membuka Panel Admin -> Tab Lupa PIN, lalu menekan tombol "Setujui & Beritahu PIN". Sistem akan langsung menampilkan 6 digit PIN asli kartu tersebut di layar notifikasi Anda!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Dropdown [Pilih Akun / Nomor Rekening]',
        location: 'Pojok Paling Kanan Atas Navbar',
        functionDetail: 'Menampilkan daftar semua kartu ATM beserta statusnya (Active, Pending, Frozen, Banned, atau Unlimited).',
      },
      {
        buttonName: 'Tombol [Lupa PIN? Minta Tinjauan Admin]',
        location: 'Di bawah kolom input PIN saat gagal atau lupa PIN kartu',
        functionDetail: 'Mengirim permohonan ke Admin agar Admin memberitahukan atau mereset kode PIN kartu Anda.',
      },
      {
        buttonName: 'Tombol [Ganti Google / Logout Google]',
        location: 'Di bagian atas Dropdown Pemilih Akun',
        functionDetail: 'Keluar dari sesi akun Google saat ini untuk beralih ke akun profil Google yang lain.',
      },
    ],
    stepByStepGuide: [
      'Klik nama akun Anda di pojok kanan atas layar untuk membuka daftar kartu.',
      'Klik kartu rekening tujuan yang ingin Anda buka.',
      'Ketik 6 digit PIN asli milik kartu tujuan tersebut, lalu klik "Verifikasi PIN".',
      'Jika lupa PIN, klik "Lupa PIN?", lalu buka Panel Admin (PIN 159357) untuk menyetujui peninjauan PIN.',
    ],
    formulaOrSimulation: [
      'PIN Default Rekening Demo: Raden Satrio (123456), Siti Nurhaliza (654321), Budi Santoso (112233), Kartu Admin (159357).',
    ],
    tipsAndTroubleshooting: [
      'Anda juga bisa melihat atau mengubah PIN langsung di menu Mobile Banking -> Tab "⚙️ Pengaturan Lengkap & Fitur Dihapus" -> Tab "Profil & Identitas" atau "PIN & Privasi Keamanan".',
    ],
  },
  {
    id: 'bab-3-navigasi-lengkap',
    chapterNumber: 3,
    category: 'Navigasi & Antarmuka',
    icon: '🧭',
    title: 'Panduan Lengkap Semua Tombol Navigasi Atas, Mobile Bar & Footer Bawah',
    subtitle: 'Peta lokasi seluruh tombol utama di layar atas, tengah, dan bar mengambang bawah',
    deepExplanationParagraphs: [
      'Antarmuka Bank Nusantara dirancang agar seluruh fitur utama dapat dijangkau hanya dalam 1 klik. Terdapat tiga area navigasi utama: (1) Bar Navigasi Atas (Header Navbar), (2) Sub-Tab Mobile Banking di tengah layar, dan (3) Bar Tombol Mengambang di Bagian Paling Bawah Layar.',
      'Di Bar Navigasi Atas, berjejer rapi tombol: Mobile Banking, Lowongan Kerja (beserta indikator Level), Spin the Wheel (di sebelah Lowongan Kerja beserta jumlah Koin Spin), 💎 Mining & Lelang VIP (di sebelah Spin the Wheel sebagai pengganti fitur Kerajaan), PayChat, Simulator Mesin ATM, Panduan (60 Bab), dan Riwayat Update.',
      'Di sebelah kanan Bar Navigasi Atas terdapat: Ikon Lonceng Notifikasi, Tombol 🤖 Bot AI & Suara (tepat di sebelah kanan tombol Notifikasi), Tombol + Daftar Kartu Baru, dan Dropdown Pemilih Rekening.',
      'Sedangkan di Bagian Paling Bawah Layar terdapat deretan tombol mengambang: 📘 Tutorial Lengkap (bagi kartu aktif), 🆘 Minta Tolong Admin / Mintol (tepat di sebelah tombol Lapor Bug dengan syarat pesan wajib diisi), 🐛 Lapor Bug, 💬 Chat Global Resmi Admin, dan 🔐 Tombol Panel Admin.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [Mobile Banking]',
        location: 'Navbar Atas Urutan Ke-1',
        functionDetail: 'Membuka dashboard utama nasabah yang berisi kartu 3D, katalog layanan pembayaran, transfer, pinjaman, mutasi, jadwal, dan Pengaturan Lengkap.',
      },
      {
        buttonName: 'Tombol [Lowongan Kerja Lv.X]',
        location: 'Navbar Atas Urutan Ke-2',
        functionDetail: 'Membuka 9 daftar pekerjaan klik (200 s/d 2.000 klik), upgrade level 1–50, dan game Suit Voucher.',
      },
      {
        buttonName: 'Tombol [Spin the Wheel 🪙]',
        location: 'Navbar Atas Urutan Ke-3 (Di sebelah Lowongan Kerja)',
        functionDetail: 'Membuka roda keberuntungan berhadiah Rp 100 Ribu s/d Rp 20 Juta dan toko 100 paket koin.',
      },
      {
        buttonName: 'Tombol [💎 Mining & Lelang VIP]',
        location: 'Navbar Atas Urutan Ke-4 (Di sebelah Spin the Wheel)',
        functionDetail: 'Membuka Pusat Mining Kripto 12 Rig, Balai Lelang Supercar (+Profit s/d 250%), Bursa Crypto/Saham Live, dan Mystery Cyber Container.',
      },
      {
        buttonName: 'Tombol [🤖 Bot AI & Suara]',
        location: 'Navbar Kanan Atas (Di sebelah Lonceng Notifikasi)',
        functionDetail: 'Membuka 4 asisten Bot AI pintar berbasis Gemini 1.5 Flash lengkap dengan fitur Voice Chat (Suara 2 Arah).',
      },
      {
        buttonName: 'Tombol [🆘 Minta Tolong Admin]',
        location: 'Bar Paling Bawah (Di sebelah tombol Lapor Bug)',
        functionDetail: 'Mengirim permohonan bantuan ke Admin dari 35 pilihan bantuan dengan syarat pesan wajib diisi.',
      },
    ],
    stepByStepGuide: [
      'Gunakan tombol di bar atas untuk berpindah antar modul utama aplikasi.',
      'Pada layar HP (potret), gunakan bar navigasi kedua tepat di bawah header untuk akses cepat.',
      'Gunakan tombol mengambang di bagian paling bawah layar untuk membuka Tutorial, Mintol Admin, Lapor Bug, Chat Global, atau Panel Admin.',
    ],
    formulaOrSimulation: [
      'Total Modul Utama Header: 8 Modul + 4 Kontrol Kanan + 5 Tombol Bar Bawah = 17 Titik Akses Instan.',
    ],
    tipsAndTroubleshooting: [
      'Semua perubahan data tersimpan otomatis di memori browser (LocalStorage) sehingga tidak hilang saat halaman dimuat ulang.',
    ],
  },
  {
    id: 'bab-4-dashboard-kartu-3d',
    chapterNumber: 4,
    category: 'Perbankan Inti',
    icon: '🏦',
    title: 'Mobile Banking Dashboard, Kartu Visual 3D, Sensor Saldo & Quick Actions',
    subtitle: 'Cara membaca informasi kartu debit fisik/virtual, menyembunyikan saldo, dan menyetujui transaksi pembeli',
    deepExplanationParagraphs: [
      'Halaman utama Mobile Banking menampilkan Kartu Debit Visual 3D milik nasabah lengkap dengan chip EMV emas, nomor kartu 16 digit, nama pemilik, lencana Centang Biru Resmi (jika sudah diverifikasi Admin), masa berlaku (Valid Thru), kode CVV, serta indikator Tier Kartu.',
      'Di sebelah kartu terdapat panel Informasi Saldo Aktif, Nomor Rekening (dilengkapi tombol Salin 1-Klik), Poin Reward VIP, Saldo Pulsa HP, dan Saldo Token Listrik kWh.',
      'Jika terdapat transaksi yang membutuhkan Konfirmasi Pembeli (Buyer Approval), sebuah banner pengingat akan muncul di bagian atas dashboard agar Anda bisa menyetujui atau membatalkan transaksi tersebut.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [Mata / Sensor Saldo]',
        location: 'Di sebelah nominal Saldo Rekening Utama',
        functionDetail: 'Menyembunyikan nominal uang menjadi bintang (Rp ••••••••) demi privasi di tempat umum.',
      },
      {
        buttonName: 'Tombol [Balik Kartu / Lihat CVV]',
        location: 'Pada Kartu Visual 3D',
        functionDetail: 'Membalik kartu atau menampilkan kode rahasia CVV 3 digit dan masa aktif kartu.',
      },
      {
        buttonName: 'Tombol [Setujui Transaksi Pembeli]',
        location: 'Banner Konfirmasi Pembeli di atas Dashboard',
        functionDetail: 'Mengonfirmasi pembayaran dari sisi nasabah sebelum diteruskan ke Admin.',
      },
    ],
    stepByStepGuide: [
      'Buka menu Mobile Banking untuk melihat ringkasan harta, level karir, koin spin, dan status kartu Anda.',
      'Klik tombol sub-tab di bawah kartu untuk berpindah ke Layanan Digital, PayChat, Transfer, Pinjaman, Mutasi, Jadwal, atau Pengaturan Lengkap.',
    ],
    formulaOrSimulation: [
      'Setiap transaksi belanja yang berhasil akan memberikan Poin Reward yang nantinya dapat dikonversi menjadi uang tunai.',
    ],
    tipsAndTroubleshooting: [
      'Anda dapat mengatur agar saldo otomatis disensor sejak awal masuk aplikasi melalui menu Pengaturan Lengkap -> Tab Keamanan & Privasi.',
    ],
  },
  {
    id: 'bab-5-transfer-instan',
    chapterNumber: 5,
    category: 'Perbankan Inti',
    icon: '💸',
    title: 'Transfer Antar Rekening & Antar Bank Instan + Daftar Favorit',
    subtitle: 'Panduan mengirim uang ke sesama Bank Nusantara maupun bank lain secara instan',
    deepExplanationParagraphs: [
      'Fitur Transfer Antar Rekening memungkinkan Anda mengirimkan dana Rupiah ke rekening Bank Nusantara lain (seperti Siti Nurhaliza, Budi Santoso, Dewi Lestari) maupun ke bank nasional lainnya (BRI, Mandiri, BCA, BNI, BSI, Permata, CIMB Niaga, Danamon, dll.).',
      'Saat Anda mengetik nomor rekening tujuan, sistem otomatis melakukan pengecekan nama pemilik rekening (Account Lookup) sehingga Anda yakin tidak salah kirim.',
      'Secara default, transfer berjalan INSTAN dan langsung memotong saldo pengirim serta menambah saldo penerima detik itu juga tanpa perlu menunggu persetujuan Admin (kecuali jika gembok Persetujuan Admin sengaja diaktifkan di Panel Admin).',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Pilihan [Bank Tujuan]',
        location: 'Tab Transfer Antar Rekening',
        functionDetail: 'Memilih Bank Nusantara (bebas biaya admin) atau Bank Lain (BI-FAST / Real-time Online).',
      },
      {
        buttonName: 'Input [Nomor Rekening Tujuan]',
        location: 'Tab Transfer Antar Rekening',
        functionDetail: 'Tempat mengetik nomor rekening penerima atau memilih cepat dari kartu Daftar Favorit.',
      },
      {
        buttonName: 'Tombol [+ Simpan ke Favorit]',
        location: 'Di sebelah daftar rekening tujuan',
        functionDetail: 'Menyimpan nomor rekening langganan agar ke depannya cukup 1 klik untuk transfer.',
      },
    ],
    stepByStepGuide: [
      'Buka Mobile Banking -> Klik sub-tab "Transfer Antar Rekening".',
      'Pilih Bank Tujuan dan ketik Nomor Rekening penerima (atau klik salah satu kontak di Daftar Favorit).',
      'Masukkan nominal uang yang ingin ditransfer beserta berita/catatan transfer.',
      'Klik "Kirim Uang Sekarang" dan masukkan 6 digit PIN Kartu ATM Anda.',
    ],
    formulaOrSimulation: [
      'Transfer Sesama Bank Nusantara: Biaya Admin Rp 0 (Gratis) | Saldo penerima langsung bertambah.',
    ],
    tipsAndTroubleshooting: [
      'Pastikan nominal transfer tidak melebihi saldo aktif dan tidak melampaui batas Limit Transfer Harian yang diatur di menu Pengaturan.',
    ],
  },
  {
    id: 'bab-6-simulator-mesin-atm',
    chapterNumber: 6,
    category: 'Mesin ATM & Tunai',
    icon: '🏧',
    title: 'Simulator Mesin ATM Fisik, Brankas Uang Tunai & Cetak Struk Thermal',
    subtitle: 'Cara memakai mesin ATM fisik interaktif untuk Tarik Tunai, Setor Tunai, Cek Saldo, dan Cetak Struk',
    deepExplanationParagraphs: [
      'Simulator Mesin ATM menghadirkan pengalaman nyata menggunakan mesin ATM fisik Bank Nusantara lengkap dengan layar monitor hijau/biru khas ATM, tombol F1–F8 di samping layar, keypad angka fisik, slot kartu, slot uang kertas (Cash Dispenser), dan printer struk thermal.',
      'Mesin ATM ini memiliki Brankas Uang Fisik (ATM Vault Balance) dengan kapasitas miliaran Rupiah. Saat Anda menarik uang tunai, brankas ATM akan berkurang; saat Anda menyetor uang tunai atau Admin melakukan isi ulang (Refill Brankas), kas mesin ATM akan bertambah.',
      'Setiap selesai melakukan transaksi Tarik Tunai, Setor Tunai, maupun Transfer di mesin ATM, mesin akan mengeluarkan lembar Struk Kertas Thermal lengkap dengan kode referensi dan sisa saldo.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol Layar [Tarik Tunai Cepat / Nominal Lain]',
        location: 'Layar Utama Simulator Mesin ATM',
        functionDetail: 'Menarik uang tunai pecahan Rp 50.000 atau Rp 100.000 dari brankas mesin ATM.',
      },
      {
        buttonName: 'Tombol Layar [Setor Tunai (Cash Deposit)]',
        location: 'Layar Utama Simulator Mesin ATM',
        functionDetail: 'Memasukkan uang kertas ke mesin ATM untuk menambah saldo rekening Anda secara instan.',
      },
      {
        buttonName: 'Tombol [Cetak Ulang Struk Terakhir]',
        location: 'Menu Mesin ATM',
        functionDetail: 'Mencetak kembali bukti transaksi terakhir dalam format kertas struk ATM.',
      },
    ],
    stepByStepGuide: [
      'Klik menu "Simulator Mesin ATM" di bar navigasi atas.',
      'Masukkan 6 digit PIN Kartu ATM Anda menggunakan tombol keypad di layar.',
      'Pilih menu "Tarik Tunai", "Setor Tunai", "Transfer", atau "Informasi Saldo".',
      'Ambil uang tunai dan struk bukti transaksi yang keluar dari slot mesin.',
    ],
    formulaOrSimulation: [
      'Pecahan Uang Mesin ATM: Rp 50.000 & Rp 100.000 | Kapasitas Brankas Default: Rp 5.000.000.000 (Bisa diisi ulang di Panel Admin).',
    ],
    tipsAndTroubleshooting: [
      'Jika kas brankas mesin ATM habis karena penarikan besar-besaran, minta Admin mengisi ulang melalui Panel Admin -> Super Tools -> Refill Brankas ATM.',
    ],
  },
  {
    id: 'bab-7-cardless-cash',
    chapterNumber: 7,
    category: 'Mesin ATM & Tunai',
    icon: '📲',
    title: 'Tarik Tunai Tanpa Kartu (Cardless Cash 6 Digit)',
    subtitle: 'Cara membuat kode token 6 digit di HP untuk mengambil uang tunai di ATM tanpa kartu fisik',
    deepExplanationParagraphs: [
      'Lupa membawa dompet atau kartu ATM fisik? Gunakan fitur Tarik Tunai Tanpa Kartu (Cardless Cash). Anda cukup membuat Kode Token 6 Digit melalui menu Mobile Banking, lalu mencairkan kode tersebut di mesin ATM.',
      'Setiap token Cardless memiliki masa berlaku tertentu dan hanya bisa digunakan satu kali (One-Time Token) sehingga sangat aman dari penyalahgunaan.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [Buat Kode Tarik Tunai Tanpa Kartu]',
        location: 'Mobile Banking -> Layanan Digital -> Tab Cardless Cash',
        functionDetail: 'Menghasilkan 6 digit kode rahasia untuk penarikan uang tunai tanpa kartu.',
      },
    ],
    stepByStepGuide: [
      'Buka Mobile Banking -> Layanan Digital -> Pilih bagian "Tarik Tunai Tanpa Kartu (Cardless)".',
      'Pilih nominal penarikan (misal Rp 500.000 atau Rp 1.000.000) dan masukkan PIN ATM Anda.',
      'Catat 6 digit Kode Token yang muncul di layar untuk dicairkan.',
    ],
    formulaOrSimulation: [
      'Masa berlaku token Cardless: 60 menit sejak diterbitkan.',
    ],
    tipsAndTroubleshooting: [
      'Pastikan status token sudah Aktif sebelum digunakan di mesin ATM.',
    ],
  },
  {
    id: 'bab-8-lowongan-pekerjaan-5x',
    chapterNumber: 8,
    category: 'Karir & Penghasilan',
    icon: '💼',
    title: 'Lowongan Pekerjaan (9 Karir, Target Klik 5x Lipat: 200 s/d 2.000 Klik)',
    subtitle: 'Rincian lengkap 9 jenjang pekerjaan, syarat level, gaji, dan target klik 200 hingga 2.000 klik',
    deepExplanationParagraphs: [
      'Fitur Lowongan Pekerjaan adalah tempat seluruh nasabah mencari uang halal untuk menambah saldo rekening. Terdapat 9 jenjang profesi mulai dari Petugas Kebersihan Kantor (Level 1) hingga Komisaris Utama Bank Nusantara (Level 50).',
      'Sesuai pembaruan sistem terbaru, target klik pada ke-9 pekerjaan telah dinaikkan 5 kali lipat menjadi: (1) 200 klik, (2) 300 klik, (3) 500 klik, (4) 700 klik, (5) 1.000 klik, (6) 1.200 klik, (7) 1.500 klik, (8) 1.800 klik, dan (9) 2.000 klik.',
      'Setiap kali Anda mengetuk tombol "KERJAKAN SEKARANG", bar progres akan bertambah sesuai Kekuatan Klik (Click Power) akun Anda. Begitu jumlah klik mencapai target (misal 200/200), gaji langsung cair otomatis masuk ke saldo rekening utama Anda dan progres kembali ke 0 sehingga bisa dikerjakan berulang kali tanpa batas!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [👆 KLIK KERJA SEKARANG (+1 Klik)]',
        location: 'Di setiap kartu 9 Lowongan Pekerjaan',
        functionDetail: 'Menambah progres klik kerja. Saat mencapai target, gaji langsung ditransfer ke saldo rekening.',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "Lowongan Kerja" di bar navigasi atas.',
      'Pilih pekerjaan yang sudah terbuka sesuai Level Pekerjaan Anda saat ini.',
      'Tekan tombol klik kerja berulang kali hingga bar progres mencapai 100%.',
      'Nikmati gaji tunai yang langsung masuk ke rekening beserta struk mutasinya!',
    ],
    formulaOrSimulation: [
      '1. Level 1 (Petugas Kebersihan): Target 200 Klik -> Gaji Rp 250.000',
      '2. Level 3 (Kurir Dokumen): Target 300 Klik -> Gaji Rp 350.000',
      '3. Level 6 (Customer Service): Target 500 Klik -> Gaji Rp 500.000',
      '4. Level 10 (Teller Senior): Target 700 Klik -> Gaji Rp 750.000',
      '5. Level 15 (Analis Kredit): Target 1.000 Klik -> Gaji Rp 1.000.000',
      '6. Level 22 (Manajer Cabang): Target 1.200 Klik -> Gaji Rp 1.250.000',
      '7. Level 30 (Kepala Divisi): Target 1.500 Klik -> Gaji Rp 1.500.000',
      '8. Level 40 (Direktur Keuangan): Target 1.800 Klik -> Gaji Rp 1.750.000',
      '9. Level 50 (Komisaris Utama): Target 2.000 Klik -> Gaji Rp 2.000.000',
    ],
    tipsAndTroubleshooting: [
      'Ingin sekali klik langsung dapat puluhan klik? Minta Admin mengaktifkan "Kekuatan Klik Super (Click Power 50x–100x)" di Panel Admin atau lewat tombol Mintol Admin!',
    ],
  },
  {
    id: 'bab-9-upgrade-level-suit',
    chapterNumber: 9,
    category: 'Karir & Penghasilan',
    icon: '✊',
    title: 'Naik Level Pekerjaan (Level 1–50) & Game Suit Berhadiah Voucher Level',
    subtitle: '2 cara menaikkan Level Pekerjaan hingga Level 50 Maksimal: Bayar Uang Tunai atau Pakai Voucher Suit',
    deepExplanationParagraphs: [
      'Agar bisa membuka pekerjaan dengan gaji hingga Rp 2.000.000 per siklus, Anda perlu menaikkan Level Pekerjaan dari Level 1 hingga Level 50 Maksimal.',
      'Ada 2 cara resmi untuk naik level: Pertama, membayar Biaya Upgrade Level menggunakan saldo rekening. Kedua, menggunakan 1 lembar "Voucher Level Pekerjaan" untuk naik +1 Level secara GRATIS tanpa memotong saldo sepeser pun!',
      'Bagaimana cara mendapatkan Voucher Level Pekerjaan secara gratis? Di bagian bawah halaman Lowongan Kerja terdapat arena "Game Suit (Batu - Gunting - Kertas) Melawan Bot Bank". Setiap kali Anda menang Suit melawan Bot, Anda langsung mendapatkan hadiah +1 Voucher Level Pekerjaan gratis!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [⬆️ Upgrade Level Pakai Saldo]',
        location: 'Header Halaman Lowongan Kerja',
        functionDetail: 'Menaikkan +1 Level Pekerjaan dengan memotong saldo rekening.',
      },
      {
        buttonName: 'Tombol [🎟️ Pakai 1 Voucher Naik Level Gratis]',
        location: 'Header Halaman Lowongan Kerja',
        functionDetail: 'Menaikkan +1 Level Pekerjaan secara gratis menggunakan Voucher Level.',
      },
      {
        buttonName: 'Tombol Pilihan [🪨 Batu / ✂️ Gunting / 📄 Kertas]',
        location: 'Arena Game Suit di Halaman Lowongan Kerja',
        functionDetail: 'Bermain Suit melawan Bot. Jika menang, otomatis mendapat +1 Voucher Level!',
      },
    ],
    stepByStepGuide: [
      'Buka menu "Lowongan Kerja" dan gulir ke bagian "Arena Suit Berhadiah Voucher Level".',
      'Pilih Batu, Gunting, atau Kertas untuk bertanding melawan Bot.',
      'Setelah menang dan mendapat Voucher Level, klik tombol "Pakai 1 Voucher Naik Level Gratis" di bagian atas.',
    ],
    formulaOrSimulation: [
      'Menang Suit = +1 Voucher Level Gratis | Seri atau Kalah = Bebas main lagi tanpa biaya!',
    ],
    tipsAndTroubleshooting: [
      'Anda juga bisa mendapatkan puluhan Voucher Level dari membuka Mystery Cyber Container di menu Mining & Lelang VIP.',
    ],
  },
  {
    id: 'bab-10-spin-the-wheel',
    chapterNumber: 10,
    category: 'Hiburan & Jackpot',
    icon: '🎡',
    title: 'Spin the Wheel (Hadiah Rp 100 Ribu s/d Rp 20 Juta & Probabilitas 0,000000000001%)',
    subtitle: 'Penjelasan 18 juring hadiah roda keberuntungan, opsi putar 1x/3x/5x/7x/10x, dan peluang jackpot',
    deepExplanationParagraphs: [
      'Tepat di sebelah tombol Lowongan Pekerjaan terdapat fitur "Spin the Wheel". Di dalamnya terdapat roda keberuntungan dengan 18 segmen hadiah uang tunai mulai dari Rp 100.000 hingga Rp 20.000.000!',
      'Daftar nominal hadiah pada roda meliputi: Rp 100.000, Rp 500.000, Rp 750.000, Rp 1.000.000, lalu naik bertahap setiap Rp 500.000 (Rp 1,5 Juta, Rp 2 Juta, Rp 2,5 Juta, Rp 3 Juta, Rp 3,5 Juta, Rp 4 Juta, Rp 4,5 Juta, Rp 5 Juta, Rp 5,5 Juta, Rp 6 Juta, Rp 6,5 Juta, Rp 7 Juta), dilanjutkan Rp 7.500.000, Rp 10.000.000, Rp 15.000.000, dan puncak tertinggi Rp 20.000.000!',
      'Aturan Probabilitas (Kemungkinan Pendapatan): Untuk hadiah Rp 1.000.000 peluangnya adalah 1% dan semakin mengecil untuk nominal di atasnya. Khusus hadiah utama Rp 15.000.000 dan Rp 20.000.000, probabilitas standarnya adalah 0,000000000001% (1 banding 1.000 Kuadriliun)! Namun di Panel Admin, Admin dapat memperbesar kemungkinan pendapatan (Luck Multiplier hingga 1.000.000x) atau mengaktifkan Mode Pasti Jackpot!',
      'Biaya standar untuk 1 kali Spin adalah 100 Koin Spin (setara Rp 1.000.000 pada harga dasar). Anda bisa memilih memutar sekaligus: 1x Spin, 3x Spin, 5x Spin, 7x Spin, atau 10x Spin, dan semuanya bisa diberi diskon oleh Admin!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol Pilihan [1x / 3x / 5x / 7x / 10x Spin]',
        location: 'Di bawah Roda Spin the Wheel',
        functionDetail: 'Memilih berapa kali roda diputar sekaligus dalam satu kali pencet.',
      },
      {
        buttonName: 'Tombol [🎰 PUTAR RODA SEKARANG]',
        location: 'Tengah Bawah Roda Spin the Wheel',
        functionDetail: 'Memutar roda menggunakan Koin Spin dan langsung mencairkan total hadiah ke saldo rekening.',
      },
      {
        buttonName: 'Tombol [+] (Di sebelah gambar Koin di atas)',
        location: 'Header Halaman Spin the Wheel',
        functionDetail: 'Membuka Toko 100 Pilihan Paket Pembelian Koin Spin (mulai dari 1 Koin sampai 1.000.000 Koin).',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "Spin the Wheel" di sebelah tombol Lowongan Kerja.',
      'Pastikan Anda memiliki minimal 100 Koin Spin (atau sesuai harga setelah diskon Admin). Jika belum punya, klik tombol [+] di sebelah indikator koin di atas.',
      'Pilih jumlah putaran (1x, 3x, 5x, 7x, atau 10x) lalu tekan "PUTAR RODA SEKARANG".',
    ],
    formulaOrSimulation: [
      '1x Spin = 100 Koin | 3x Spin = 300 Koin | 5x Spin = 500 Koin | 7x Spin = 700 Koin | 10x Spin = 1.000 Koin (Sebelum Diskon Admin).',
    ],
    tipsAndTroubleshooting: [
      'Ingin langsung merasakan Jackpot Rp 20 Juta? Buka Panel Admin -> Pengaturan Spin Wheel -> Ubah Mode Jackpot ke "Pasti 15 Juta / 20 Juta"!',
    ],
  },
  {
    id: 'bab-11-toko-100-paket-koin',
    chapterNumber: 11,
    category: 'Hiburan & Jackpot',
    icon: '🪙',
    title: 'Toko 100 Pilihan Paket Pembelian Koin Spin (1 Koin = Rp 10.000, Recehan Desimal & Diskon)',
    subtitle: 'Penjelasan rumus harga koin, recehan desimal unik di setiap paket, dan cara memurahkan harga di Panel Admin',
    deepExplanationParagraphs: [
      'Ketika Anda menekan tombol [+] di sebelah gambar koin di bagian atas halaman Spin the Wheel, sistem akan menampilkan Katalog Lengkap 100 Pilihan Paket Pembelian Koin Spin mulai dari Paket #1 (1 Koin) hingga Paket #100 (1.000.000 Koin)!',
      'Harga dasar 1 Koin adalah sebesar Rp 10.000, dan dikali lipatkan sesuai jumlah koin di paket tersebut ditambah nilai recehan dan angka desimal unik (contoh: Rp 10.012,25 untuk 1 Koin, Rp 1.000.045,75 untuk 100 Koin, dst.).',
      'Di Panel Admin, harga dasar 1 Koin masih bisa dimurahkan lagi (misalnya diturunkan dari Rp 10.000 menjadi Rp 1.000 atau Rp 100 per koin) dan bisa ditambah Diskon Persentase hingga 99%!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [+ Beli Koin] (Di bar Koin Atas)',
        location: 'Pojok Kanan Atas Halaman Spin the Wheel',
        functionDetail: 'Menampilkan atau menyembunyikan katalog 100 paket pembelian koin spin.',
      },
      {
        buttonName: 'Filter Kategori [Semua 100 Paket / Satuan / Paket Spin / Sultan 100rb / Mega 1 Juta]',
        location: 'Di atas Katalog 100 Paket Koin',
        functionDetail: 'Memudahkan pencarian paket koin dari nominal kecil hingga 1 juta koin.',
      },
    ],
    stepByStepGuide: [
      'Buka halaman Spin the Wheel lalu klik tombol [+] di sebelah saldo Koin Anda.',
      'Pilih salah satu dari 100 paket koin yang tersedia (misal Paket 100 Koin untuk 1x Spin).',
      'Klik tombol "Beli Paket" — saldo Rupiah Anda akan terpotong sesuai harga (lengkap dengan desimalnya) dan Koin Spin langsung bertambah!',
    ],
    formulaOrSimulation: [
      'Rumus Harga Paket = ((Jumlah Koin × Harga Dasar Per Koin) + Recehan Rupiah + Desimal Sen) × (1 - Diskon Admin%).',
    ],
    tipsAndTroubleshooting: [
      'Anda juga bisa mendapatkan Koin Spin gratis setiap hari dari hasil panen Rig Mining di menu "💎 Mining & Lelang VIP"!',
    ],
  },
  {
    id: 'bab-12-mining-lelang-cyber-vault',
    chapterNumber: 12,
    category: 'Investasi & Aset VIP',
    icon: '💎',
    title: '💎 Pusat Mining Kripto, Balai Lelang Supercar & Cyber Vault (Pengganti Fitur Kerajaan)',
    subtitle: 'Penjelasan super lengkap 4 fitur di dalam Mining & Lelang VIP yang menggantikan fitur Kerajaan lama (Tanpa syarat level!)',
    deepExplanationParagraphs: [
      'Sesuai permintaan terbaru, fitur Kerajaan lama beserta pembatasan Level 50 telah DIHAPUS TOTAL dan digantikan oleh fitur baru yang jauh lebih canggih: "💎 Pusat Mining Kripto, Balai Lelang Supercar & Cyber Vault" yang terletak tepat di sebelah tombol Spin the Wheel!',
      'Keunggulan utama fitur baru ini adalah BEBAS DIAKSES OLEH SEMUA NASABAH Sejak Level 1 tanpa perlu menunggu Level 50! Di dalamnya terdapat 4 sub-fitur raksasa:',
      '1. ⛏️ 12 Rig Mining Kripto & Aset Produktif: Anda bisa membeli Rig GPU RTX 5090 Ti, Kontainer ASIC Hydro, Server Cloud AI H100, Pembangkit Geothermal, Quantum Core Q-1000, hingga Stasiun Satelit Mining Orbital. Setiap kali Anda menekan tombol "KLAIM MINING", Anda langsung mendapatkan Uang Tunai Rupiah + Bonus Koin Spin Wheel gratis! Dilengkapi pula tombol Overclock Rig (1x Normal, 2x Turbo, 5x Extreme).',
      '2. 🏎️ Balai Lelang Supercar, Hypercar & Koleksi Langka: Setiap unit aset yang Anda miliki (seperti Jam Richard Mille, Porsche 911 GT3 RS, Lamborghini Revuelto, Ferrari F80, Private Jet Gulfstream, hingga Superyacht Monaco) dapat Anda JUAL LELANG kapan saja dengan margin keuntungan langsung +35% hingga +250% di atas harga dasar!',
      '3. 📊 Bursa Trading Crypto, Saham AI & Emas Live: Jual-beli 4 instrumen pasar modal dan kripto (Emas Batangan 1 Kg, Saham Chip AI NVDA, Bitcoin Nusantara Node, dan Token Quantum Berlian) dengan harga real-time yang bisa di-Pump dari Panel Admin.',
      '4. 🧰 Mystery Cyber Container (5 Tier): Buka kontainer digital berhadiah uang tunai hingga Rp 3,5 Miliar + hingga 55.000 Koin Spin + hingga 60 Voucher Level dalam sekali buka!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [⚡ KLAIM MINING]',
        location: 'Kotak Ringkasan Kanan Atas Halaman Mining & Lelang VIP',
        functionDetail: 'Memanen seluruh penghasilan Rupiah dan bonus Koin Spin dari semua unit Rig Mining & Supercar yang Anda miliki.',
      },
      {
        buttonName: 'Tombol Overclock [1x NORMAL / 2x TURBO / 5x EXTREME]',
        location: 'Di bawah tombol Klaim Mining',
        functionDetail: 'Mempercepat jeda klaim mining dan meningkatkan multiplier hasil tambang.',
      },
      {
        buttonName: 'Tombol [🔨 Jual Lelang (1x)]',
        location: 'Pada setiap kartu unit yang sudah Anda miliki (Tab Mining & Tab Balai Lelang)',
        functionDetail: 'Melelang 1 unit aset kembali ke balai lelang VIP dan langsung mencairkan modal + keuntungan +35% s/d +250%!',
      },
      {
        buttonName: 'Tombol [BUKA CONTAINER]',
        location: 'Tab Mystery Cyber Container',
        functionDetail: 'Membuka peti harta karun siber berisi kombinasi Uang Tunai, Koin Spin, dan Voucher Level.',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "💎 Mining & Lelang VIP" di sebelah tombol Spin the Wheel.',
      'Pada Tab 1 (Rig Mining), pilih jumlah beli (1x, 5x, 10x, 25x) lalu klik "Beli" pada Rig Mining atau Supercar pilihan Anda.',
      'Klik tombol "⚡ KLAIM MINING" di kanan atas untuk memanen uang tunai + Koin Spin berkali-kali.',
      'Buka Tab 2 (Balai Lelang Supercar) dan klik "🔨 Jual Lelang" jika ingin menjual unit Anda dengan profit besar hingga +250%!',
    ],
    formulaOrSimulation: [
      'Contoh Lelang: Beli Supercar Porsche 911 GT3 RS seharga Rp 45.000.000 -> Jual di Balai Lelang (+75% Margin) = Cair Rp 78.750.000 (Untung bersih Rp 33.750.000 sekali lelang!).',
    ],
    tipsAndTroubleshooting: [
      'Di Panel Admin, Anda bisa memberikan Diskon hingga 99% untuk pembelian Rig/Supercar dan menaikkan Multiplier Hasil Panen hingga 1.000x lipat!',
    ],
  },
  {
    id: 'bab-13-katalog-65-fitur',
    chapterNumber: 13,
    category: 'Layanan Digital',
    icon: '⚡',
    title: 'Katalog Layanan Digital, Pembayaran Tagihan, E-Wallet, QRIS & Belanja',
    subtitle: 'Cara menggunakan layanan tagihan harian, e-commerce, kuliner, AI & cloud, hingga perbankan bisnis',
    deepExplanationParagraphs: [
      'Di dalam menu Mobile Banking -> sub-tab "Layanan Digital, Redeem & Pulsa", tersedia beragam layanan pembayaran terpadu yang mencakup seluruh kebutuhan harian nasabah.',
      'Kategori layanan meliputi: Listrik PLN & Token, Pulsa & Paket Data Seluler, Top-Up Dompet Digital (GoPay, OVO, DANA, ShopeePay, LinkAja), Tagihan Air PDAM, BPJS Kesehatan & Ketenagakerjaan, E-Commerce & Logistik, Kuliner & F&B, Teknologi AI & Cloud, Perbankan Bisnis UMKM, hingga Tiket Perjalanan.',
      'Setiap fitur di katalog ini dapat diatur secara fleksibel di Panel Admin: apakah membutuhkan PIN Admin (159357) atau tidak, dan apakah membutuhkan Persetujuan Admin atau langsung berhasil.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Kolom [Cari Layanan Digital...]',
        location: 'Bagian atas Katalog Layanan Digital',
        functionDetail: 'Mencari cepat layanan berdasarkan nama atau kategori tagihan.',
      },
      {
        buttonName: 'Tombol [Bayar / Beli Sekarang]',
        location: 'Di setiap kartu layanan fitur digital',
        functionDetail: 'Membuka jendela formulir khusus layanan, memotong saldo, dan menerbitkan struk digital terperinci.',
      },
    ],
    stepByStepGuide: [
      'Buka Mobile Banking -> Klik tab "Layanan Digital, Redeem & Pulsa".',
      'Ketik nama layanan di kotak pencarian atau pilih kategori yang diinginkan.',
      'Isi parameter spesifik layanan beserta nominal pembayaran, lalu klik Bayar & Cetak Struk.',
    ],
    formulaOrSimulation: [
      'Jika ada fitur yang tidak Anda inginkan di katalog ini, Anda dapat menghapusnya kapan saja di menu "⚙️ Pengaturan Lengkap & Fitur Dihapus"!',
    ],
    tipsAndTroubleshooting: [
      'Jika sebuah fitur memiliki ikon gembok PIN Admin, Anda bisa mematikan syarat PIN Admin tersebut di Panel Admin -> Konfigurasi Keamanan Fitur.',
    ],
  },
  {
    id: 'bab-14-voucher-pulsa-pln-redeem',
    chapterNumber: 14,
    category: 'Layanan Digital',
    icon: '🎟️',
    title: 'Cara Kerja Kode Voucher Pulsa (16 Digit), Token Listrik PLN (20 Digit) & Kode Redeem Admin',
    subtitle: 'Alur pembelian kode pulsa/token listrik, cara menukarkannya, dan cara klaim Kode Redeem berhadiah saldo',
    deepExplanationParagraphs: [
      'Ketika Anda membeli Pulsa HP atau Token Listrik PLN Prabayar di Bank Nusantara, sistem akan menerbitkan Kode Voucher Rahasia (16 digit untuk Pulsa dan 20 digit Stroom/Token untuk Listrik PLN).',
      'Kode yang sudah dibeli tersebut tersimpan di kotak "Daftar Kode Voucher Pulsa & Token Listrik Saya". Setelah disetujui Admin (atau langsung aktif jika tanpa antrean), Anda cukup menekan tombol "Tukar / Pakai Kode" untuk memasukkan saldo pulsa ke nomor HP atau menambah daya kWh meteran listrik Anda!',
      'Selain itu, terdapat fitur "Klaim Kode Redeem Bank Nusantara". Admin dapat membuat Kode Redeem berhadiah uang tunai jutaan hingga miliaran Rupiah di Panel Admin lengkap dengan batas kuota pengklaim dan batas waktu aktif (menit). Nasabah cukup mengetik kode tersebut untuk langsung menerima hadiah uang tunai!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Input [Masukkan Kode Redeem Berhadiah]',
        location: 'Bagian atas halaman Layanan Digital',
        functionDetail: 'Tempat mengetik kode promo/redeem dari Admin (contoh: NUSANTARAJAYA, SULTAN2025) untuk klaim saldo gratis.',
      },
      {
        buttonName: 'Tombol [Tukar / Isi ke Nomor HP atau Meteran PLN]',
        location: 'Kotak Voucher Pulsa & Token Listrik yang Sudah Dibeli',
        functionDetail: 'Menukarkan 16 digit kode pulsa atau 20 digit token listrik agar masuk ke saldo Pulsa/kWh akun Anda.',
      },
    ],
    stepByStepGuide: [
      'Beli Pulsa atau Token Listrik di menu Layanan Digital.',
      'Lihat kode 16/20 digit yang muncul di daftar "Kode Voucher yang Sudah Dibeli".',
      'Klik tombol "Tukar Kode Sekarang" untuk mengaktifkan pulsa atau kWh listrik tersebut.',
    ],
    formulaOrSimulation: [
      '16 Digit Kode Voucher Pulsa -> Menambah Saldo Pulsa HP | 20 Digit Token PLN -> Menambah Saldo kWh Listrik Rumah.',
    ],
    tipsAndTroubleshooting: [
      'Admin dapat memperpanjang masa aktif dan menambah kuota seluruh Kode Redeem melalui Panel Admin -> Super Tools.',
    ],
  },
  {
    id: 'bab-15-lacak-resi-cod',
    chapterNumber: 15,
    category: 'Logistik & Belanja',
    icon: '📦',
    title: 'Lacak Nomor Resi Pengiriman Ekspedisi & Pembayaran Paket COD',
    subtitle: 'Cara melacak posisi paket kurir real-time dan melunasi tagihan paket Cash on Delivery (COD)',
    deepExplanationParagraphs: [
      'Bank Nusantara dilengkapi sistem pelacakan logistik terintegrasi (Nusantara Express, JNE, J&T, SiCepat, Pos Indonesia). Anda dapat memasukkan nomor resi baru atau melacak riwayat perjalanan paket yang sedang dikirim ke alamat Anda.',
      'Jika paket tersebut memiliki tagihan COD (Bayar di Tempat), Anda dapat melunasinya langsung menggunakan saldo rekening Bank Nusantara sehingga kurir tinggal menyerahkan paket di rumah Anda.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [+ Tambah / Input Nomor Resi Baru]',
        location: 'Bagian Lacak Resi & COD di Layanan Digital',
        functionDetail: 'Mendaftarkan nomor resi pengiriman baru beserta nominal COD-nya.',
      },
      {
        buttonName: 'Tombol [Bayar Tagihan COD Sekarang]',
        location: 'Pada kartu paket resi yang memiliki tagihan COD',
        functionDetail: 'Melunasi biaya COD paket menggunakan saldo rekening dan mengubah status paket menjadi Terkirim/Lunas.',
      },
    ],
    stepByStepGuide: [
      'Buka tab "Layanan Digital" lalu gulir ke bagian "Lacak Resi Pengiriman & Bayar COD".',
      'Klik "Bayar COD" pada paket yang belum lunas, atau tambahkan nomor resi baru.',
    ],
    formulaOrSimulation: [
      'Status Pengiriman: Diproses -> Dalam Perjalanan -> Sedang Diantar Kurir -> Terkirim (Lunas).',
    ],
    tipsAndTroubleshooting: [
      'Gunakan fitur Mintol Admin "Lunasi Semua Paket COD" jika ingin seluruh paket COD Anda dilunasi gratis oleh Admin!',
    ],
  },
  {
    id: 'bab-16-celengan-deposito',
    chapterNumber: 16,
    category: 'Tabungan & Investasi',
    icon: '🐷',
    title: 'Celengan Impian (Pocket Savings) & Deposito Berjangka Online',
    subtitle: 'Cara memisahkan dana tabungan impian dan membuka sertifikat deposito berbunga tinggi',
    deepExplanationParagraphs: [
      'Ingin menabung untuk membeli rumah, ibadah umroh, atau liburan tanpa tercampur dengan saldo belanja harian? Gunakan fitur "Celengan Impian (Pocket Savings)". Anda bebas membuat banyak kantong tabungan dengan target nominal masing-masing, menyetor uang ke celengan, atau menariknya kembali kapan saja.',
      'Bagi Anda yang menginginkan imbal hasil bunga tetap yang tinggi, gunakan fitur "Deposito Berjangka Online". Pilih nominal pokok deposito dan tenor (1, 3, 6, atau 12 bulan) untuk mendapatkan Sertifikat Deposito Resmi beserta proyeksi bagi hasil/bunga tahunan.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [+ Buat Celengan Impian Baru]',
        location: 'Bagian Celengan Impian di Layanan Digital',
        functionDetail: 'Membuat kantong tabungan baru dengan nama dan target dana impian.',
      },
      {
        buttonName: 'Tombol [Buka Deposito Berjangka]',
        location: 'Bagian Deposito Berjangka di Layanan Digital',
        functionDetail: 'Membuka bilyet deposito baru dan menghitung proyeksi bunga jatuh tempo.',
      },
    ],
    stepByStepGuide: [
      'Buka bagian Celengan Impian atau Deposito di dalam tab Layanan Digital.',
      'Masukkan nominal dana yang ingin disimpan lalu klik Simpan / Buka Deposito.',
    ],
    formulaOrSimulation: [
      'Rumus Bunga Deposito = Pokok × (Bunga Tahunan% × (Tenor Bulan / 12)).',
    ],
    tipsAndTroubleshooting: [
      'Di Panel Admin terdapat Super Tool untuk menambahkan bonus bunga +25% s/d +50% ke seluruh Deposito dan Celengan Anda secara instan!',
    ],
  },
  {
    id: 'bab-17-pinjaman-online',
    chapterNumber: 17,
    category: 'Kredit & Pinjaman',
    icon: '🤝',
    title: 'Pinjaman Online Resmi (KUR, KTA, KPR, Kendaraan) & Simulasi Cicilan',
    subtitle: 'Cara mengajukan kredit pinjaman tunai hingga miliaran Rupiah dan membayar angsuran bulanan',
    deepExplanationParagraphs: [
      'Butuh tambahan modal usaha atau dana darurat besar? Buka sub-tab "Pinjaman Online" di Mobile Banking. Tersedia 4 produk kredit resmi: Kredit Usaha Rakyat (KUR), Kredit Tanpa Agunan (KTA Instan), Kredit Pemilikan Rumah (KPR), dan Kredit Kendaraan Bermotor.',
      'Kalkulator pintar di layar akan langsung menghitung estimasi angsuran bulanan berdasarkan plafon pinjaman dan tenor bulan yang Anda pilih. Setelah diajukan dan disetujui Admin, dana pinjaman langsung cair menambah saldo rekening Anda!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [Ajukan Pinjaman Sekarang]',
        location: 'Mobile Banking -> Tab Pinjaman Online',
        functionDetail: 'Mengirimkan formulir pengajuan kredit ke Panel Admin untuk dicairkan.',
      },
      {
        buttonName: 'Tombol [Bayar Cicilan Bulan Ini]',
        location: 'Daftar Pinjaman Aktif',
        functionDetail: 'Membayar angsuran bulanan pinjaman menggunakan saldo rekening.',
      },
    ],
    stepByStepGuide: [
      'Buka Mobile Banking -> Klik sub-tab "Pinjaman Online".',
      'Pilih jenis pinjaman, atur nominal plafon dan tenor cicilan, lalu isi penghasilan bulanan dan tujuan pinjaman.',
      'Klik "Ajukan Pinjaman", lalu setujui (ACC) di Panel Admin agar dana langsung cair ke saldo Anda.',
    ],
    formulaOrSimulation: [
      'Jika Anda tidak ingin repot membayar cicilan, gunakan Super Tool Admin "Putihkan / Lunasi Semua Pinjaman Nasabah"!',
    ],
    tipsAndTroubleshooting: [
      'Semua pinjaman yang masih berstatus Pending dapat disetujui serentak dengan 1 klik di Panel Admin.',
    ],
  },
  {
    id: 'bab-18-paychat-global-chat',
    chapterNumber: 18,
    category: 'Komunikasi & Sosial',
    icon: '💬',
    title: 'PayChat (Chat Antar Nomor Rekening + Kirim Uang) & Chat Global Admin',
    subtitle: 'Cara mengirim pesan dan melampirkan transfer uang langsung di ruang obrolan antar nasabah',
    deepExplanationParagraphs: [
      'PayChat adalah fitur perpesanan instan antar nomor rekening Bank Nusantara. Anda tidak hanya bisa mengirim pesan teks ke nasabah lain, tetapi juga melampirkan Transfer Uang Langsung (Send Money in Chat) atau Meminta Dana (Request Money) di dalam gelembung chat!',
      'Selain itu, terdapat tombol "💬 Chat Global" di bagian bawah layar yang berfungsi sebagai saluran pengumuman resmi satu arah dari Admin Utama Bank Nusantara kepada seluruh nasabah.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [💸 Lampirkan Transfer Uang di Chat]',
        location: 'Di bawah kolom ketik pesan PayChat',
        functionDetail: 'Mengirimkan uang tunai sekaligus pesan chat ke nomor rekening lawan bicara.',
      },
      {
        buttonName: 'Tombol [💬 Chat Global]',
        location: 'Bar Mengambang Bawah Layar',
        functionDetail: 'Membuka ruang siaran pesan resmi dari Admin Utama.',
      },
    ],
    stepByStepGuide: [
      'Klik menu "PayChat" di bar navigasi atas.',
      'Pilih kontak nasabah di sebelah kiri (atau ketik nomor rekening tujuan).',
      'Ketik pesan Anda, aktifkan lampiran transfer jika ingin sekalian mengirim uang, lalu klik Kirim.',
    ],
    formulaOrSimulation: [
      'Transfer lewat PayChat bebas biaya admin dan langsung tercatat di riwayat mutasi kedua belah pihak.',
    ],
    tipsAndTroubleshooting: [
      'Pesan pada Chat Global dapat dikirim dan disematkan (Pin) oleh Admin melalui Panel Admin.',
    ],
  },
  {
    id: 'bab-19-pengaturan-lengkap-fitur-dihapus',
    chapterNumber: 19,
    category: 'Pengaturan & Kustomisasi',
    icon: '⚙️',
    title: '⚙️ Pusat Pengaturan Super Lengkap (60+ Opsi) & Cara Menghapus / Memulihkan Fitur (Fitur Dihapus)',
    subtitle: 'Panduan lengkap 8 kategori pengaturan aplikasi dan cara menghapus fitur yang tidak diinginkan atau memulihkannya kembali',
    deepExplanationParagraphs: [
      'Menu Pengaturan kini telah diperluas secara menyeluruh menjadi "⚙️ Pusat Pengaturan Super Lengkap & Kelola Fitur Dihapus" yang dapat diakses melalui Mobile Banking -> Tab "⚙️ Pengaturan Lengkap & Fitur Dihapus".',
      'Di dalamnya terdapat 8 sub-tab lengkap dengan lebih dari 60 opsi pengaturan fungsional:',
      '1. 🗑️ Tab Fitur Dihapus & Kelola Fitur: Di sini Anda bisa mencari dan MENGHAPUS fitur apa pun dari daftar katalog aktif (baik satu per satu dengan tombol "🗑️ Hapus" maupun banyak sekaligus dengan kotak centang "Hapus Fitur Terpilih"). Semua fitur yang telah dihapus akan masuk ke "Keranjang Fitur Dihapus" di bagian atas dan dapat dipulihkan kapan saja dengan tombol "♻️ Pulihkan" atau "♻️ Pulihkan Semua"!',
      '2. 👤 Tab Profil & Identitas: Edit Nama Lengkap, NIK 16 digit, Nomor HP, Email, Alamat Domisili, tampilkan CVV/PIN kartu, hingga ganti Nomor Rekening baru.',
      '3. 🔐 Tab PIN & Privasi Keamanan: Bekukan/buka kunci kartu sementara, ganti PIN 6 digit, ajukan Lupa PIN, sensor saldo otomatis, 2FA OTP, Kode Anti-Phishing, dan waktu Auto-Lock layar.',
      '4. 💳 Tab Limit Kartu & Internasional: Geser slider Limit Belanja Harian (hingga Rp 500 Juta), Limit Sekali Transaksi (hingga Rp 1 Miliar), Limit Transfer Harian (hingga Rp 2 Miliar), serta nyalakan/matikan Transaksi Luar Negeri, Contactless PayWave, E-Commerce, Auto-Debit, dan QRIS Cross-Border.',
      '5. 🔊 Tab Audio ATM & Suara AI: Atur suara beep tombol ATM, suara mesin hitung uang kertas, pembacaan struk otomatis, Auto-Speak Voice Bot AI, dan kecepatan bicara suara AI.',
      '6. 🎨 Tab Tema, Font & Tampilan: Pilih 5 tema warna aksen, skala ukuran huruf (Normal/Besar/Ekstra Besar), bahasa regional, efek hujan confetti, dan tampilan desimal recehan.',
      '7. ⚡ Tab Otomatisasi Mining & Spin: Atur cetak struk otomatis, Auto-Save pembulatan receh ke celengan, mode putaran Turbo Spin Wheel, dan efek visual klik kerja.',
      '8. 💾 Tab Backup & Reset Sistem: Salin cadangan data JSON ke clipboard, tandai semua notifikasi dibaca, reset ke data demo awal, atau mulai dari nol.',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [🗑️ Hapus] & [Hapus Fitur Terpilih]',
        location: 'Pengaturan Lengkap -> Tab 1: Fitur Dihapus & Kelola',
        functionDetail: 'Menghapus fitur dari katalog aktif dan memindahkannya ke daftar Fitur Dihapus.',
      },
      {
        buttonName: 'Tombol [♻️ Pulihkan] & [♻️ Pulihkan Semua]',
        location: 'Kotak Keranjang Fitur Dihapus di bagian atas Tab 1 Pengaturan',
        functionDetail: 'Mengembalikan fitur yang sudah dihapus agar aktif kembali di menu aplikasi dan tutorial.',
      },
      {
        buttonName: 'Tombol [Reset Setelan]',
        location: 'Header Kanan Atas Pusat Pengaturan',
        functionDetail: 'Mengembalikan seluruh 60+ opsi pengaturan ke nilai standar awal.',
      },
    ],
    stepByStepGuide: [
      'Buka Mobile Banking lalu klik tab paling kanan: "⚙️ Pengaturan Lengkap & Fitur Dihapus".',
      'Untuk menghapus fitur, centang fitur yang ingin dihapus pada daftar lalu klik "Hapus Fitur Terpilih" (atau klik tombol "🗑️ Hapus" di sebelah kanan fitur).',
      'Untuk melihat atau mengembalikan fitur yang telah dihapus, lihat kotak "Keranjang Fitur Dihapus" di bagian atas lalu klik "♻️ Pulihkan".',
    ],
    formulaOrSimulation: [
      'Total Opsi Pengaturan: 8 Kategori Tab × Puluhan Kontrol = 60+ Pengaturan Real-Time.',
    ],
    tipsAndTroubleshooting: [
      'Setiap kali Anda menghapus atau memulihkan fitur di Pengaturan, daftar modul di dalam Tutorial ini juga otomatis menyesuaikan secara real-time!',
    ],
  },
  {
    id: 'bab-20-bot-ai-voice-chat',
    chapterNumber: 20,
    category: 'Kecerdasan Buatan (AI)',
    icon: '🤖',
    title: '🤖 Bot-Bot AI Khusus Aplikasi + Voice Chat Suara Dua Arah (Gemini 1.5 Flash)',
    subtitle: 'Cara mengobrol lewat teks maupun suara mikrofon langsung dengan 4 Bot AI spesialis Bank Nusantara',
    deepExplanationParagraphs: [
      'Tepat di sebelah kanan ikon Lonceng Notifikasi di bagian atas layar, terdapat tombol "🤖 Bot AI & Suara". Fitur ini ditenagai oleh model Gemini 1.5 Flash yang telah dibekali pengetahuan lengkap mengenai seluruh seluk-beluk aplikasi Bank Nusantara.',
      'Terdapat 4 karakter Bot AI Spesialis yang bisa Anda pilih: (1) 🤖 NusaBot Utama (Ahli Semua Fitur & Panduan Lengkap), (2) 🎡 SultanBot Karir, Spin & Mining VIP (Ahli Cuan, Kerja, Spin Wheel & Lelang Supercar), (3) 🔐 SecuriBot Keamanan, Kartu & PIN, serta (4) ⚡ AdminBot Super Tools & Mintol.',
      'Fitur Unggulan VOICE CHAT (Suara Dua Arah): Anda dapat menekan tombol "🎙️ Bicara via Mikrofon" dan langsung berbicara menggunakan Bahasa Indonesia. Suara Anda akan diubah menjadi teks secara real-time, dikirim ke Gemini 1.5 Flash, dan Bot AI akan menjawab sekaligus membacakan penjelasannya dengan Suara Bahasa Indonesia secara otomatis!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [🤖 Bot AI & Suara]',
        location: 'Navbar Kanan Atas (Tepat di sebelah Lonceng Notifikasi)',
        functionDetail: 'Membuka jendela asisten Bot AI & Voice Chat.',
      },
      {
        buttonName: 'Tombol [🎙️ Bicara via Mikrofon / Hentikan Rekaman]',
        location: 'Bagian bawah jendela Bot AI',
        functionDetail: 'Mengaktifkan pengenalan suara (Speech-to-Text) Bahasa Indonesia agar Anda bisa bertanya dengan suara.',
      },
      {
        buttonName: 'Toggle [🔊 Suara AI Aktif / Bisukan]',
        location: 'Header Jendela Bot AI',
        functionDetail: 'Mengatur apakah Bot AI otomatis membacakan jawabannya dengan suara (Text-to-Speech).',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "🤖 Bot AI & Suara" di sebelah ikon lonceng notifikasi.',
      'Pilih salah satu dari 4 Bot AI Spesialis di bagian atas.',
      'Klik tombol mikrofon merah/biru untuk berbicara langsung, atau ketik pertanyaan apa saja di kolom chat.',
    ],
    formulaOrSimulation: [
      'Mesin AI: Gemini 1.5 Flash + Web Speech Recognition (id-ID) + SpeechSynthesis Indonesian Voice.',
    ],
    tipsAndTroubleshooting: [
      'Pastikan Anda mengizinkan akses mikrofon (Allow Microphone) pada browser saat menggunakan fitur Voice Chat untuk pertama kali.',
    ],
  },
  {
    id: 'bab-21-lapor-bug-mintol-admin',
    chapterNumber: 21,
    category: 'Bantuan & Layanan Admin',
    icon: '🆘',
    title: '🆘 Tombol Lapor Bug & Minta Tolong ke Admin (Mintol Admin — 35 Fitur & Pesan Wajib)',
    subtitle: 'Cara meminta bantuan langsung ke Admin dari 35 opsi Mintol dengan syarat pesan penjelasan wajib diisi',
    deepExplanationParagraphs: [
      'Di bagian paling bawah layar, tepat di sebelah tombol Lapor Bug, terdapat tombol "🆘 Minta Tolong Admin (Mintol)". Fitur ini dirancang khusus agar nasabah bisa meminta bantuan apa pun kepada Admin secara resmi.',
      'Di dalam jendela Mintol Admin tersedia 35 Pilihan Fitur Bantuan yang terbagi dalam 6 kategori: Saldo & Bantuan Tunai (Suntik Saldo, Lipat Gandakan Saldo, Paket THR Sultan, Dana Darurat, Refill ATM), Koin & Spin Wheel (Koin Gratis, Diskon Spin, Diskon 100 Paket Koin, Murahin Harga Koin, Boost Luck, Pasti Jackpot 20 Juta), Level & Karir (Naik Level 50, Voucher Gratis, Click Power 100x, Gaji 10x Lipat, Gajian Instan), Kartu & PIN (Unban Kartu, Upgrade Kartu Admin ∞, Centang Biru, Reset PIN, No Rekening Cantik, Perisai VIP), Mining & Lelang VIP (Hadiah 12 Rig Mining & Supercar, Boost Profit 20x, Pump Harga Bursa), serta Pinjaman & Pemulihan Fitur Dihapus.',
      'SYARAT WAJIB: Sesuai ketentuan aplikasi, kolom "Pesan Penjelasan ke Admin" bersifat WAJIB DIISI (tidak boleh kosong) sebelum permohonan dapat dikirim. Setelah dikirim, Admin dapat membuka Panel Admin -> Tab Mintol Admin dan menekan 1 tombol "Kabulkan & Eksekusi Otomatis" sehingga semua permintaan Anda langsung terwujud detik itu juga!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [🆘 Minta Tolong Admin]',
        location: 'Bar Paling Bawah Layar (Sebelah tombol Lapor Bug)',
        functionDetail: 'Membuka formulir 35 pilihan bantuan Mintol Admin.',
      },
      {
        buttonName: 'Kolom [Pesan Penjelasan ke Admin (WAJIB DIISI)]',
        location: 'Di dalam Modal Mintol Admin',
        functionDetail: 'Tempat menuliskan alasan atau detail permintaan bantuan kepada Admin.',
      },
      {
        buttonName: 'Tombol [✅ Kabulkan & Eksekusi Otomatis]',
        location: 'Panel Admin -> Tab Minta Tolong (Mintol)',
        functionDetail: 'Mengeksekusi seluruh fitur yang diminta nasabah secara otomatis hanya dengan 1 klik.',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "🆘 Minta Tolong Admin" di bagian paling bawah layar.',
      'Centang satu atau beberapa fitur bantuan yang Anda butuhkan (bisa pilih banyak sekaligus!).',
      'Isi nominal yang diminta (opsional) dan WAJIB ketik pesan penjelasan untuk Admin.',
      'Klik "Kirim Permintaan ke Admin", lalu buka Panel Admin untuk mengabulkannya secara instan!',
    ],
    formulaOrSimulation: [
      'Tersedia 35 Fitur Bantuan Mintol yang terhubung langsung dengan mesin eksekusi otomatis Panel Admin.',
    ],
    tipsAndTroubleshooting: [
      'Jika tombol kirim menolak karena pesan kosong, pastikan Anda telah mengetik minimal beberapa kata di kolom pesan wajib.',
    ],
  },
  {
    id: 'bab-22-panel-admin-56-super-tools',
    chapterNumber: 22,
    category: 'Otoritas Panel Admin',
    icon: '🔐',
    title: '🔐 Panel Admin Utama (PIN 159357) & Kamus Lengkap 56+ Super Tools Eksekusi Instan',
    subtitle: 'Panduan tertinggi mengendalikan seluruh uang, koin, diskon, probabilitas spin, mining, dan kartu nasabah',
    deepExplanationParagraphs: [
      'Panel Admin Utama adalah pusat komando tertinggi Bank Nusantara yang dilindungi oleh PIN Khusus Admin: 159357. Anda dapat membukanya melalui tombol "🔐 Panel Admin" di pojok kanan bawah layar.',
      'Di dalam Panel Admin, Anda memiliki wewenang mutlak untuk: (1) Menyetujui/menolak Kartu Baru, Upgrade Kartu, Pinjaman, Lupa PIN, dan Transaksi Keuangan, (2) Mengatur Diskon Spin the Wheel (1x/3x/5x/7x/10x), Diskon 100 Paket Koin, menurunkan Harga Dasar 1 Koin, serta menaikkan Kemungkinan Pendapatan Jackpot (Luck Multiplier), (3) Mengatur Diskon & Profit Multiplier pada 💎 Pusat Mining Kripto, Lelang Supercar & Cyber Vault, (4) Mengabulkan permintaan Mintol Admin, (5) Mengelola Riwayat Update Aplikasi, dan (6) Mengeksekusi 56+ Super Tools Instan.',
      'Untuk melihat penjelasan satu per satu dari ke-56 Super Tools Admin, silakan klik tab "🛠️ Kamus 56+ Super Tools Admin" di bagian atas jendela Tutorial ini!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Tombol [🔐 Panel Admin]',
        location: 'Pojok Kanan Bawah Layar',
        functionDetail: 'Membuka gerbang otoritas Panel Admin menggunakan kode PIN 159357.',
      },
      {
        buttonName: 'Tombol [⚡ Sapu Bersih / ACC Semua Antrean]',
        location: 'Header Panel Admin',
        functionDetail: 'Menyetujui seluruh kartu baru, upgrade, pinjaman, dan transaksi pending secara serentak.',
      },
    ],
    stepByStepGuide: [
      'Klik tombol "🔐 Panel Admin" di kanan bawah layar.',
      'Ketik kode PIN Admin: 159357.',
      'Pilih tab pengaturan yang ingin Anda ubah (Rekening, Spin Wheel, Mining & Lelang VIP, Mintol, Keamanan Fitur, atau Super Tools).',
    ],
    formulaOrSimulation: [
      'PIN Resmi Panel Admin: 159357 | Kartu Admin Unlimited: Saldo Rp ∞ (Tak Terbatas).',
    ],
    tipsAndTroubleshooting: [
      'Semua perubahan diskon dan multiplier yang Anda simpan di Panel Admin langsung berdampak detik itu juga pada seluruh layar nasabah.',
    ],
  },
  {
    id: 'bab-23-emas-24k-transfer-bebas',
    chapterNumber: 23,
    category: 'Emas 24K & Transfer Bebas',
    icon: '👑',
    title: '👑 Tab Emas Mewah 24K Real-Time & Mode Transfer Bebas (Admin 5% — Uang, Coin, Emas)',
    subtitle: 'Panduan lengkap koleksi Emas Batangan/Perhiasan, aturan harga Tanggal 1 (+5%), penalti hari sama, dan transfer lintas aset',
    deepExplanationParagraphs: [
      'Pada Tab Transfer, Anda dapat beralih ke mode "Transfer Bebas 5% (Uang, Coin & Emas)" untuk mengirim Uang Rupiah, Coin Spin, Saldo Emas 24K, ataupun Paket Gabungan ketiganya sekaligus mulai Rp 1.000 hingga tak terbatas. Biaya admin 5% dipotong langsung dari nominal yang dikirim (contoh: kirim Rp 10.000.000 maka penerima menerima bersih Rp 9.500.000).',
      'Pada Tab Emas 24K, Anda dapat memilih bentuk visual Emas Batangan (persegi panjang tebal 3D) maupun Emas Perhiasan (persegi panjang tipis elegan) dengan 3 motif pilihan (Klasik, Nusantara, Royal Platinum), sertifikat digital 24K 999.9, serta tombol putar depan-belakang.',
      'Anda bebas mengkustom nominal beli/jual mulai Rp 1.000 hingga tak terbatas, menyesuaikan otomatis dengan 25%/50%/100% saldo uang, atau mengatur patokan harga kustom. Jika emas dijual di hari pembelian yang sama, nilainya disesuaikan turun 1% (atau 5% bila diaktifkan Admin); sedangkan setiap tanggal 1 bulan berganti secara real-time, harga emas otomatis naik +5% per bulan!',
    ],
    buttonsAndInputs: [
      {
        buttonName: 'Segmen [Transfer Bebas 5% (Uang, Coin & Emas)]',
        location: 'Tab Transfer Dashboard',
        functionDetail: 'Mengirim Uang, Coin, Emas, atau Gabungan ke rekening terdaftar maupun tujuan bebas manual dengan otorisasi PIN 6 digit.',
      },
      {
        buttonName: 'Pemilih [Emas Batangan] vs [Emas Perhiasan] & [Putar]',
        location: 'Tab Emas 24K',
        functionDetail: 'Mengubah tampilan fisik emas 3D, memilih motif, membalik tampilan depan/belakang, dan mengatur patokan harga serta target tabungan.',
      },
    ],
    stepByStepGuide: [
      'Buka Tab Transfer lalu pilih mode Transfer Bebas 5% untuk mengirim Uang, Coin, Emas, atau Gabungan.',
      'Buka Tab Emas 24K untuk memilih bentuk Batangan/Perhiasan, lihat hitung mundur real-time menuju Tanggal 1, dan lakukan Beli/Jual emas mulai Rp 1.000.',
      'Admin dapat membuka Tab "Kontrol Emas 24K & Transfer Bebas 5%" di Panel Admin untuk menyuntik Emas/Coin atau menekan tombol Simulasi Tanggal 1 (+5%).',
    ],
    formulaOrSimulation: [
      'Transfer Bebas: Kirim X -> Admin 5% (0.05 × X) -> Penerima Terima Bersih 0.95 × X.',
      'Emas 24K: Jual hari sama = -1% (atau -5% di Admin) | Ganti bulan Tanggal 1 = +5% majemuk real-time.',
    ],
    tipsAndTroubleshooting: [
      'Untuk mengetes kenaikan bulanan +5% tanpa menunggu kalender bulan depan, Admin dapat langsung menekan tombol "Simulasi Tgl 1 (+1 Bulan)" di Panel Admin.',
    ],
  },
];

const ADMIN_SUPER_TOOLS_DICTIONARY: {
  group: string;
  tools: { number: number; name: string; desc: string }[];
}[] = [
  {
    group: 'A. Manipulasi Saldo, Kekayaan & Hujan Uang',
    tools: [
      { number: 1, name: 'Suntik / Kurangi / Set Saldo Rekening', desc: 'Menambah, mengurangi, atau menetapkan nominal saldo Rupiah rekening mana pun secara bebas.' },
      { number: 2, name: 'Lipat Gandakan Saldo (Multiplier 2x s/d 100x)', desc: 'Mengalikan saldo rekening nasabah secara instan berkali-kali lipat.' },
      { number: 3, name: 'Hujan Saldo Massal (Mass Balance Rain)', desc: 'Membagikan uang tunai gratis ke seluruh rekening nasabah secara serentak.' },
      { number: 4, name: 'Kirim Paket THR Sultan Komplit', desc: 'Mengirimkan paket berisi Uang Tunai + Voucher Level + Poin Reward + Pulsa + Token PLN sekaligus.' },
      { number: 5, name: 'Bagi Dividen Keuntungan Bank', desc: 'Membagikan persentase bonus dividen kepada seluruh nasabah aktif.' },
      { number: 6, name: 'Pajak / Potongan Biaya Admin Massal', desc: 'Menerapkan simulasi pemotongan biaya admin ke rekening non-perisai VIP.' },
      { number: 7, name: 'Force Transfer Antar Rekening (Tanpa PIN)', desc: 'Memindahkan dana paksa dari satu rekening ke rekening lain langsung oleh Admin.' },
      { number: 8, name: 'Refill Kas Brankas Mesin ATM', desc: 'Mengisi ulang uang kertas di dalam brankas fisik Simulator Mesin ATM hingga miliaran Rupiah.' },
    ],
  },
  {
    group: 'B. Kontrol Spin the Wheel & 100 Paket Koin',
    tools: [
      { number: 9, name: 'Atur Harga Dasar 1 Koin Spin', desc: 'Mengubah harga dasar 1 Koin (standar Rp 10.000) menjadi lebih murah (misal Rp 1.000 atau Rp 100).' },
      { number: 10, name: 'Diskon Global 100 Paket Pembelian Koin (0–99%)', desc: 'Memberikan potongan harga persentase untuk seluruh 100 pilihan paket pembelian koin.' },
      { number: 11, name: 'Diskon Biaya Koin Spin (1x, 3x, 5x, 7x, 10x)', desc: 'Memangkas jumlah koin yang dibutuhkan untuk memutar roda Spin the Wheel.' },
      { number: 12, name: 'Luck Multiplier (Peluang Hadiah Besar 1x–1.000.000x)', desc: 'Memperbesar kemungkinan nasabah memenangkan hadiah Rp 1 Juta hingga Rp 20 Juta.' },
      { number: 13, name: 'Mode Jackpot Paksa (Force Jackpot 15M & 20M)', desc: 'Mengunci roda agar pasti berhenti di hadiah besar atau khusus Rp 15 Juta & Rp 20 Juta.' },
      { number: 14, name: 'Suntik / Set Koin Spin Nasabah', desc: 'Menambahkan atau mengatur jumlah Koin Spin milik nasabah tertentu.' },
      { number: 15, name: 'Hujan Koin Spin Massal (Mass Coin Rain)', desc: 'Membagikan Koin Spin gratis ke seluruh nasabah Bank Nusantara.' },
    ],
  },
  {
    group: 'C. Kontrol 💎 Pusat Mining Kripto, Lelang Supercar & Cyber Vault',
    tools: [
      { number: 16, name: 'Diskon Akuisisi Rig Mining & Supercar (0–99%)', desc: 'Memberikan diskon harga beli seluruh 12 Rig Mining, Supercar, dan Cyber Container.' },
      { number: 17, name: 'Multiplier Hasil Panen Mining & Lelang (1x–1.000x)', desc: 'Melipatgandakan uang tunai dan koin yang didapat saat klaim mining maupun jual lelang.' },
      { number: 18, name: 'Hadiahkan Semua 12 Rig Mining & Supercar', desc: 'Memberikan seluruh 12 unit Rig Mining & Koleksi Supercar gratis ke akun nasabah.' },
      { number: 19, name: 'Pump / Dump Harga Bursa Crypto, Saham AI & Emas', desc: 'Mengatur kenaikan atau penurunan harga pasar Bitcoin, Saham AI, Emas, dan Berlian.' },
      { number: 20, name: 'Jaminan Max Jackpot Cyber Container', desc: 'Memastikan setiap pembukaan Mystery Cyber Container menghasilkan hadiah maksimal.' },
    ],
  },
  {
    group: 'D. Kontrol Karir, Level Pekerjaan & Kekuatan Klik',
    tools: [
      { number: 21, name: 'Set Level Pekerjaan Instan (1–50)', desc: 'Mengubah level karir nasabah langsung ke Level 50 agar semua 9 pekerjaan terbuka.' },
      { number: 22, name: 'Upgrade Massal Level Semua Nasabah', desc: 'Menaikkan level pekerjaan seluruh nasabah secara serentak.' },
      { number: 23, name: 'Suntik Voucher Level Pekerjaan', desc: 'Memberikan Voucher Level gratis tanpa harus bermain Suit.' },
      { number: 24, name: 'Hujan Voucher Level Massal', desc: 'Membagikan Voucher Level gratis ke seluruh nasabah.' },
      { number: 25, name: 'Set Kekuatan Klik (Click Power 1x–500x)', desc: 'Membuat 1 kali pencet tombol kerja dihitung sebagai puluhan atau ratusan klik sekaligus.' },
      { number: 26, name: 'Set Multiplier Gaji Pekerjaan (1x–50x)', desc: 'Melipatgandakan nominal gaji yang cair setiap kali pekerjaan selesai.' },
      { number: 27, name: 'Cairkan Gaji Pekerjaan Instan Tanpa Klik', desc: 'Langsung mentransfer gaji pekerjaan (hingga Rp 2 Juta) ke rekening nasabah tanpa klik.' },
      { number: 28, name: 'Reset Statistik Karir ke Level 1', desc: 'Mengembalikan level dan progres klik kerja nasabah ke kondisi awal.' },
    ],
  },
  {
    group: 'E. Manajemen Kartu, Tier, PIN & Identitas',
    tools: [
      { number: 29, name: 'Ubah Tier Kartu Langsung (Silver/Gold/Platinum/Admin ∞)', desc: 'Meng-upgrade kartu nasabah termasuk menjadi Kartu Admin dengan saldo tak terbatas.' },
      { number: 30, name: 'Set Semua Akun ke Tier Tertentu', desc: 'Mengubah tier kartu seluruh nasabah sekaligus.' },
      { number: 31, name: 'Berikan / Cabut Lencana Centang Biru (Verified)', desc: 'Menyematkan centang biru resmi di samping nama nasabah.' },
      { number: 32, name: 'Verifikasi Centang Biru Semua Nasabah', desc: 'Memberikan centang biru ke seluruh rekening yang terdaftar.' },
      { number: 33, name: 'Ban / Blokir Kartu & Unban Kartu', desc: 'Memblokir kartu yang melanggar aturan atau membuka kembali blokir kartu.' },
      { number: 34, name: 'Unban Semua Kartu Serentak', desc: 'Membuka blokir seluruh kartu nasabah dengan 1 klik.' },
      { number: 35, name: 'Bekukan / Cairkan Semua Kartu (Mass Freeze)', desc: 'Membekukan atau mengaktifkan kembali seluruh kartu secara massal.' },
      { number: 36, name: 'Ganti PIN Kartu Langsung oleh Admin', desc: 'Mengubah 6 digit PIN kartu nasabah tanpa perlu tahu PIN lamanya.' },
      { number: 37, name: 'Custom Nomor Rekening Cantik', desc: 'Mengganti nomor rekening nasabah menjadi angka cantik pilihan (misal 8888999988).' },
      { number: 38, name: 'Custom Nomor Kartu ATM, CVV & Expiry', desc: 'Mengatur nomor 16 digit kartu, kode CVV, dan tanggal kadaluarsa.' },
      { number: 39, name: 'Edit Identitas KTP, Nama, Email & Alamat', desc: 'Memperbarui data profil lengkap nasabah dari Panel Admin.' },
      { number: 40, name: 'Buat Rekening Aktif Instan Baru', desc: 'Menerbitkan rekening baru yang langsung berstatus Aktif tanpa antrean.' },
      { number: 41, name: 'Kloning / Duplikasi Rekening Nasabah', desc: 'Menggandakan akun nasabah beserta profilnya menjadi rekening baru.' },
      { number: 42, name: 'Gabungkan Dua Rekening (Merge Accounts)', desc: 'Menyatukan saldo dan aset dari dua rekening ke dalam satu rekening utama.' },
      { number: 43, name: 'Hapus Rekening Nasabah', desc: 'Menghapus rekening tertentu dari database.' },
    ],
  },
  {
    group: 'F. Otomatisasi Fitur, Pinjaman, Deposito, Resi & Audit',
    tools: [
      { number: 44, name: 'Sapu Bersih / Master Approve Semua Antrean', desc: 'Menyetujui seluruh kartu baru, upgrade, pinjaman, dan transaksi pending sekaligus.' },
      { number: 45, name: 'Aktifkan Perisai VIP & Cashback Belanja', desc: 'Memberikan kekebalan biaya admin dan cashback otomatis setiap transaksi.' },
      { number: 46, name: 'Reset Kuota Tarik Tunai Harian', desc: 'Mengembalikan sisa kuota penarikan ATM harian nasabah menjadi penuh.' },
      { number: 47, name: 'Atur Limit Belanja & Akses Internasional', desc: 'Mengubah batas belanja harian dan izin transaksi luar negeri.' },
      { number: 48, name: 'Putihkan / Lunasi Semua Pinjaman Nasabah', desc: 'Melunasi seluruh sisa pokok dan bunga pinjaman online nasabah secara gratis.' },
      { number: 49, name: 'Bonus Bunga Deposito & Celengan Impian', desc: 'Menambahkan persentase bonus dana ke seluruh Deposito dan Celengan nasabah.' },
      { number: 50, name: 'Cairkan Paksa Semua Deposito ke Saldo Utama', desc: 'Melikuidasi seluruh deposito aktif beserta bunganya langsung ke saldo rekening.' },
      { number: 51, name: 'Suntik Pulsa HP, Token Listrik kWh & Poin Reward', desc: 'Menambahkan saldo pulsa, token listrik, dan poin reward secara instan.' },
      { number: 52, name: 'Konversi Poin Reward & Pulsa/PLN Jadi Uang Tunai', desc: 'Mengubah poin reward serta saldo pulsa/listrik nasabah menjadi saldo Rupiah.' },
      { number: 53, name: 'Terbitkan & Gandakan Kode Voucher / Kode Redeem', desc: 'Membuat banyak kode redeem sekaligus dan menggandakan voucher milik nasabah.' },
      { number: 54, name: 'Lunasi Gratis Semua Paket COD & Buat Resi Baru', desc: 'Melunasi seluruh tagihan COD ekspedisi dan menerbitkan resi pengiriman baru.' },
      { number: 55, name: 'Rollback Transaksi Terakhir & Buat Mutasi Kustom', desc: 'Membatalkan transaksi terakhir (refund saldo) atau menyisipkan catatan mutasi khusus.' },
      { number: 56, name: 'Audit Forensik Auto-Heal & Ekspor Master JSON', desc: 'Memperbaiki otomatis seluruh anomali data rekening dan mengekspor database ke JSON.' },
    ],
  },
];

export const AppTutorialModal: React.FC = () => {
  const {
    currentAccount,
    isTutorialModalOpen,
    setIsTutorialModalOpen,
    markTutorialCompleted,
    featureConfigs,
    deletedFeaturesList,
    appUpdates,
  } = useBank();

  const [activeSectionTab, setActiveSectionTab] = useState<
    'chapters' | 'super_tools' | 'auto_features'
  >('chapters');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const filteredChapters = useMemo(() => {
    return COMPREHENSIVE_TUTORIAL_CHAPTERS.filter((ch) => {
      const matchCat = selectedCategory === 'Semua' || ch.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchCat;
      const inTitle = ch.title.toLowerCase().includes(q);
      const inSub = ch.subtitle.toLowerCase().includes(q);
      const inBody = ch.deepExplanationParagraphs.some((p) => p.toLowerCase().includes(q));
      const inBtns = ch.buttonsAndInputs.some(
        (b) =>
          b.buttonName.toLowerCase().includes(q) || b.functionDetail.toLowerCase().includes(q)
      );
      return matchCat && (inTitle || inSub || inBody || inBtns);
    });
  }, [searchQuery, selectedCategory]);

  if (!isTutorialModalOpen) return null;

  const isCardApproved = currentAccount?.cardStatus === 'active';
  const categories = [
    'Semua',
    ...Array.from(new Set(COMPREHENSIVE_TUTORIAL_CHAPTERS.map((c) => c.category))),
  ];

  const activeChapter =
    filteredChapters[selectedChapterIdx] ||
    filteredChapters[0] ||
    COMPREHENSIVE_TUTORIAL_CHAPTERS[0];

  const handleSpeakChapter = (chapter: TutorialChapter) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const fullText = `${chapter.title}. ${chapter.subtitle}. ${chapter.deepExplanationParagraphs.join(
      ' '
    )} Langkah-langkah: ${chapter.stepByStepGuide.join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'id-ID';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleClose = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    if (currentAccount && isCardApproved) {
      markTutorialCompleted(currentAccount.id);
    }
    setIsTutorialModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 px-5 py-4 border-b border-indigo-500/30 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-[10px] font-black uppercase">
                  ENSIKLOPEDIA TUTORIAL SUPER LENGKAP • PANDUAN LAYANAN &amp; OTORITAS
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                📘 Pusat Tutorial &amp; Kamus Lengkap Semua Tombol Aplikasi Bank Nusantara
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            title="Tutup Tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GATE: WAJIB DISETUJUI ADMIN DULU BARU TERBUKA TUTORIALNYA */}
        {!isCardApproved ? (
          <div className="p-8 text-center space-y-5 overflow-y-auto">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center mx-auto text-amber-300">
              <Lock className="w-10 h-10" />
            </div>
            <div className="max-w-xl mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase">
                🔒 Menunggu Persetujuan Admin
              </span>
              <h3 className="text-2xl font-black text-white">
                Kartu Baru Anda Harus Disetujui Admin Terlebih Dahulu!
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sesuai ketentuan sistem, pembuatan kartu baru atas nama{' '}
                <strong className="text-amber-300">{currentAccount?.fullName}</strong> (Status saat ini:{' '}
                <strong className="uppercase text-rose-400">{currentAccount?.cardStatus}</strong>) wajib disetujui oleh Admin di{' '}
                <strong>Panel Admin (PIN: 159357)</strong> terlebih dahulu sebelum Tutorial Super Lengkap dapat diakses.
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 max-w-lg mx-auto text-left text-xs space-y-2 text-slate-300">
              <p className="font-black text-amber-300">Cara Menyetujui Kartu Ini Sekarang:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Tutup jendela ini lalu klik tombol <strong>🔐 Panel Admin</strong> di pojok kanan bawah layar.</li>
                <li>Masukkan PIN Admin: <strong className="font-mono text-emerald-400">159357</strong>.</li>
                <li>Klik tombol <strong>Setujui (ACC)</strong> pada kartu <strong>{currentAccount?.fullName}</strong>.</li>
                <li>Begitu disetujui, Tutorial Super Lengkap ini akan langsung terbuka secara otomatis!</li>
              </ol>
            </div>
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
            >
              Mengerti &amp; Tutup Sementara
            </button>
          </div>
        ) : (
          <>
            {/* SUB-NAVIGATION BAR DI DALAM MODAL TUTORIAL */}
            <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSectionTab('chapters')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                    activeSectionTab === 'chapters'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-cyan-300" />
                  <span>📚 22 Bab Penjelasan Super Lengkap</span>
                </button>
                <button
                  onClick={() => setActiveSectionTab('super_tools')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                    activeSectionTab === 'super_tools'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>🛠️ Kamus 56+ Super Tools Panel Admin</span>
                </button>
                <button
                  onClick={() => setActiveSectionTab('auto_features')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                    activeSectionTab === 'auto_features'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-emerald-300" />
                  <span>
                    ⚡ Modul Otomatis &amp; Status Layanan ({deletedFeaturesList.length} Dihapus)
                  </span>
                </button>
              </div>

              {activeSectionTab === 'chapters' && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedChapterIdx(0);
                    }}
                    placeholder="Cari penjelasan tombol / fitur..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400 w-56"
                  />
                </div>
              )}
            </div>

            {/* BODY CONTENT */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* =============================================================== */}
              {/* TAB 1: 22 BAB UTAMA SUPER DETAIL */}
              {/* =============================================================== */}
              {activeSectionTab === 'chapters' && (
                <>
                  {/* LEFT SIDEBAR: DAFTAR 22 BAB */}
                  <div className="w-full lg:w-80 bg-slate-950/70 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 max-h-52 lg:max-h-none">
                    <div className="p-2.5 border-b border-slate-800 flex gap-1.5 overflow-x-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedChapterIdx(0);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold whitespace-nowrap cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
                      {filteredChapters.map((ch, idx) => {
                        const isSelected = ch.id === activeChapter.id;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => {
                              if (isSpeaking && typeof window !== 'undefined') {
                                window.speechSynthesis.cancel();
                                setIsSpeaking(false);
                              }
                              setSelectedChapterIdx(idx);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition flex items-start gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                                : 'hover:bg-slate-900 text-slate-300'
                            }`}
                          >
                            <span className="text-lg shrink-0">{ch.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] font-black uppercase opacity-80">
                                  Bab #{ch.chapterNumber} • {ch.category}
                                </span>
                              </div>
                              <p className="text-xs font-extrabold leading-snug line-clamp-2 mt-0.5">
                                {ch.title}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT PANEL: ISI DETAIL BAB YANG DIPILIH */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase">
                          Bab {activeChapter.chapterNumber} dari {COMPREHENSIVE_TUTORIAL_CHAPTERS.length} •{' '}
                          {activeChapter.category}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
                          <span>{activeChapter.icon}</span>
                          <span>{activeChapter.title}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                          {activeChapter.subtitle}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSpeakChapter(activeChapter)}
                        className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shrink-0 transition cursor-pointer ${
                          isSpeaking
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300'
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span>Hentikan Suara</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4" />
                            <span>🔊 Bacakan Penjelasan Bab Ini</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 1. PENJELASAN MENDALAM */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        1. Penjelasan Lengkap &amp; Cara Kerja Mendalam
                      </h4>
                      <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
                        {activeChapter.deepExplanationParagraphs.map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </div>

                    {/* 2. KAMUS SEMUA TOMBOL & INPUT DI FITUR INI */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        2. Fungsi Setiap Tombol &amp; Kolom Input (Semua Dikasih Tahu Lengkap)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeChapter.buttonsAndInputs.map((btn, i) => (
                          <div
                            key={i}
                            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1"
                          >
                            <p className="text-xs font-black text-amber-300">{btn.buttonName}</p>
                            <p className="text-[11px] font-semibold text-cyan-400">
                              📍 Lokasi: {btn.location}
                            </p>
                            <p className="text-xs text-slate-300 leading-relaxed pt-1">
                              {btn.functionDetail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. PANDUAN LANGKAH DEMI LANGKAH */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                        <h4 className="text-sm font-black text-emerald-400 uppercase tracking-wider">
                          3. Urutan Langkah Pemakaian (Step-by-Step)
                        </h4>
                        <ol className="space-y-2 text-xs text-slate-200">
                          {activeChapter.stepByStepGuide.map((step, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2.5">
                          <h4 className="text-sm font-black text-fuchsia-300 uppercase tracking-wider">
                            4. Rumus Perhitungan &amp; Simulasi Angka
                          </h4>
                          <ul className="space-y-1.5 text-xs text-slate-300">
                            {activeChapter.formulaOrSimulation.map((sim, i) => (
                              <li key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                                {sim}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-4 space-y-2">
                          <h4 className="text-xs font-black text-indigo-300 uppercase flex items-center gap-1.5">
                            <HelpCircle className="w-4 h-4" />
                            5. Tips Rahasia &amp; Solusi Kendala
                          </h4>
                          {activeChapter.tipsAndTroubleshooting.map((tip, i) => (
                            <p key={i} className="text-xs text-indigo-200 leading-relaxed">
                              💡 {tip}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* PREV / NEXT CHAPTER BUTTONS */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        disabled={selectedChapterIdx <= 0}
                        onClick={() => setSelectedChapterIdx((p) => Math.max(0, p - 1))}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Bab Sebelumnya
                      </button>
                      <span className="text-xs font-bold text-slate-400">
                        Bab {selectedChapterIdx + 1} / {filteredChapters.length}
                      </span>
                      <button
                        disabled={selectedChapterIdx >= filteredChapters.length - 1}
                        onClick={() =>
                          setSelectedChapterIdx((p) =>
                            Math.min(filteredChapters.length - 1, p + 1)
                          )
                        }
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        Bab Selanjutnya
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* =============================================================== */}
              {/* TAB 2: KAMUS LENGKAP 56+ SUPER TOOLS PANEL ADMIN */}
              {/* =============================================================== */}
              {activeSectionTab === 'super_tools' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                    <h3 className="text-lg font-black text-amber-300">
                      🛠️ Kamus Lengkap 56+ Super Tools Eksekusi Instan di Panel Admin (PIN: 159357)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Berikut adalah penjelasan fungsi lengkap seluruh 56 Super Tools yang tersedia di dalam Panel Admin Utama Bank Nusantara:
                    </p>
                  </div>

                  <div className="space-y-6">
                    {ADMIN_SUPER_TOOLS_DICTIONARY.map((grp) => (
                      <div key={grp.group} className="space-y-3">
                        <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wider border-b border-slate-800 pb-1.5">
                          {grp.group}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {grp.tools.map((t) => (
                            <div
                              key={t.number}
                              className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3"
                            >
                              <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-black text-xs shrink-0">
                                #{t.number}
                              </span>
                              <div>
                                <p className="text-xs font-black text-white">{t.name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                  {t.desc}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =============================================================== */}
              {/* TAB 3: MODUL OTOMATIS FITUR AKTIF, RIWAYAT UPDATE & FITUR DIHAPUS */}
              {/* =============================================================== */}
              {activeSectionTab === 'auto_features' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                    <h3 className="text-lg font-black text-emerald-300">
                      ⚡ Modul Tutorial Otomatis (Selalu Bertambah Saat Ada Fitur Baru &amp; Menyesuaikan Fitur yang Dihapus)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Setiap kali Anda atau Admin menambahkan fitur baru maupun pembaruan aplikasi, penjelasannya otomatis tercatat di sini. Jika ada fitur yang Anda hapus di Pengaturan, statusnya juga ditampilkan di bagian Fitur Dihapus di bawah.
                    </p>
                  </div>

                  {/* RIWAYAT UPDATE SEBELUMNYA */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-cyan-300 uppercase">
                      A. Panduan Fitur dari Arsip Pembaruan Aplikasi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {appUpdates
                        .filter((upd) => !upd.isCurrent)
                        .slice(0, 6)
                        .map((upd) => (
                          <div
                            key={upd.id}
                            className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black">
                                {upd.version}
                              </span>
                              <span className="text-[10px] text-slate-400">{upd.fullDate}</span>
                            </div>
                            <p className="text-xs font-black text-white">{upd.title}</p>
                            <p className="text-[11px] text-slate-400">{upd.description}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* DAFTAR FITUR YANG DIHAPUS */}
                  {deletedFeaturesList.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-black text-rose-400 uppercase flex items-center gap-1.5">
                        <Trash2 className="w-4 h-4" />
                        B. Fitur yang Saat Ini Dihapus ({deletedFeaturesList.length} Fitur — Bisa Dipulihkan di Pengaturan)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {deletedFeaturesList.map((df) => (
                          <div
                            key={df.id}
                            className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs"
                          >
                            <span className="text-[10px] font-bold text-rose-300 uppercase">
                              DIHAPUS • {df.category}
                            </span>
                            <p className="font-black text-white mt-0.5">{df.title}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* DAFTAR SELURUH FITUR AKTIF */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-amber-300 uppercase">
                      C. Katalog Layanan Digital Aktif Beserta Status PIN Admin
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {featureConfigs.map((fc) => (
                        <div
                          key={fc.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-300">
                              {fc.category}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400">
                              {fc.defaultAmount ? formatRupiah(fc.defaultAmount) : 'Fleksibel'}
                            </span>
                          </div>
                          <p className="font-black text-white">{fc.title}</p>
                          <p className="text-[11px] text-slate-400">{fc.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FOOTER MODAL */}
            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Kartu Aktif: <strong className="text-white">{currentAccount?.fullName}</strong> (Disetujui Admin)
                </span>
              </div>
              <button
                onClick={handleClose}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md cursor-pointer"
              >
                Selesai Membaca &amp; Tutup Tutorial
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
