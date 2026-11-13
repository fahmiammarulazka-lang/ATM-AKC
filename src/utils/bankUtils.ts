/**
 * Bank Nusantara Utilities and Configurations
 */
import { CardTierConfig, LoanTierConfig } from '../types/bank';

export const UNLIMITED_BALANCE = 999_999_999_999_999;

export function isUnlimitedNumber(val?: number): boolean {
  if (val === undefined || val === null) return false;
  return !Number.isFinite(val) || val >= 900_000_000_000_000;
}

export const CARD_TIER_CONFIGS: Record<string, CardTierConfig> = {
  regular: {
    tier: 'regular',
    name: 'Reguler',
    nameIndo: '1. Kartu Reguler (Biasa)',
    colorName: 'Biru',
    primaryColor: '#1e40af',
    accentColor: '#60a5fa',
    gradientClass: 'from-blue-700 via-blue-800 to-indigo-950',
    dailyWithdrawalLimit: 2_000_000,
    monthlyFee: 2_000,
    validityYears: 5,
    idealFor: 'Kebutuhan sehari-hari',
    badgeColor: 'bg-blue-600 text-white',
    isUnlimited: false,
  },
  gold: {
    tier: 'gold',
    name: 'Emas',
    nameIndo: '2. Kartu Emas',
    colorName: 'Emas',
    primaryColor: '#b45309',
    accentColor: '#fde047',
    gradientClass: 'from-amber-600 via-yellow-600 to-amber-950',
    dailyWithdrawalLimit: 5_000_000,
    monthlyFee: 5_000,
    validityYears: 5,
    idealFor: 'Kebutuhan keluarga',
    badgeColor: 'bg-amber-500 text-slate-950 font-bold',
    isUnlimited: false,
  },
  premium: {
    tier: 'premium',
    name: 'Premium',
    nameIndo: '3. Kartu Premium',
    colorName: 'Hitam Emas',
    primaryColor: '#18181b',
    accentColor: '#eab308',
    gradientClass: 'from-zinc-900 via-neutral-900 to-amber-950 border border-amber-500/40',
    dailyWithdrawalLimit: 10_000_000,
    monthlyFee: 10_000,
    validityYears: 5,
    idealFor: 'Kebutuhan bisnis',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950 font-bold',
    isUnlimited: false,
  },
  platinum: {
    tier: 'platinum',
    name: 'Platinum',
    nameIndo: '4. Kartu Platinum Prioritas',
    colorName: 'Ungu Berlian',
    primaryColor: '#4c1d95',
    accentColor: '#c084fc',
    gradientClass: 'from-purple-800 via-indigo-900 to-slate-950 border border-purple-400/50',
    dailyWithdrawalLimit: 50_000_000,
    monthlyFee: 25_000,
    validityYears: 10,
    idealFor: 'Eksekutif & Prioritas VVIP',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold',
    isUnlimited: false,
  },
  admin: {
    tier: 'admin',
    name: 'ADMIN ∞',
    nameIndo: '5. Kartu Admin (Infinity ∞)',
    colorName: 'Merah Emas ∞',
    primaryColor: '#881337',
    accentColor: '#fbbf24',
    gradientClass: 'from-rose-900 via-amber-700 to-slate-950 border-2 border-amber-300',
    dailyWithdrawalLimit: UNLIMITED_BALANCE,
    monthlyFee: 0,
    validityYears: 999,
    idealFor: 'Semua Tidak Terbatas (Infinity / ∞)',
    badgeColor: 'bg-gradient-to-r from-rose-500 via-amber-400 to-yellow-500 text-slate-950 font-black',
    isUnlimited: true,
  },
};

export const LOAN_TIER_CONFIGS: Record<string, LoanTierConfig> = {
  kecil: {
    type: 'kecil',
    title: 'Pinjaman Kecil',
    minAmount: 1_000_000,
    maxAmount: 5_000_000,
    minTenor: 1,
    maxTenor: 6,
    interestRateMonthly: 0.02, // 2% per month
    idealFor: 'Kebutuhan mendesak yang kecil',
    color: 'from-cyan-500 to-blue-600',
  },
  menengah: {
    type: 'menengah',
    title: 'Pinjaman Menengah',
    minAmount: 5_000_000,
    maxAmount: 25_000_000,
    minTenor: 6,
    maxTenor: 24,
    interestRateMonthly: 0.015, // 1.5% per month
    idealFor: 'Pendidikan, kesehatan, renovasi rumah',
    color: 'from-indigo-500 to-purple-600',
  },
  bisnis: {
    type: 'bisnis',
    title: 'Pinjaman Bisnis',
    minAmount: 25_000_000,
    maxAmount: 100_000_000,
    minTenor: 12,
    maxTenor: 36,
    interestRateMonthly: 0.01, // 1% per month
    idealFor: 'Modal usaha dan pengembangan bisnis',
    color: 'from-emerald-500 to-teal-700',
  },
};

export const SUPPORTED_BANKS = [
  { code: 'BNUS', name: 'Bank Nusantara (Rekening Sama)', fee: 0, icon: '🏛️' },
  { code: 'BCA', name: 'Bank Central Asia (BCA)', fee: 6500, icon: '🏦' },
  { code: 'MANDIRI', name: 'Bank Mandiri', fee: 6500, icon: '🏦' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)', fee: 6500, icon: '🏦' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)', fee: 6500, icon: '🏦' },
  { code: 'CIMB', name: 'CIMB Niaga', fee: 6500, icon: '🏦' },
];

/**
 * Generates an automatic 10-digit random unique account number
 * As per Section 4: System generates 10 digits uniquely, cannot be typed manually
 */
export function generateRandomAccountNumber(existingNumbers: string[] = []): string {
  let newNumber = '';
  let attempts = 0;
  do {
    // Generate 10 random digits (first digit 1-9 to look like standard bank account)
    const firstDigit = Math.floor(Math.random() * 9) + 1;
    let rest = '';
    for (let i = 0; i < 9; i++) {
      rest += Math.floor(Math.random() * 10).toString();
    }
    newNumber = `${firstDigit}${rest}`;
    attempts++;
  } while (existingNumbers.includes(newNumber) && attempts < 100);

  return newNumber;
}

/**
 * Generates an automatic 16-digit card number starting with BIN 5392 (Bank Nusantara BIN)
 */
export function generateRandomCardNumber(): string {
  const bin = '5392';
  let rest = '';
  for (let i = 0; i < 12; i++) {
    rest += Math.floor(Math.random() * 10).toString();
  }
  const full = bin + rest;
  // Format as 4-4-4-4
  return full.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Generates a random 3-digit security code (CVV)
 */
export function generateRandomCVV(): string {
  return Math.floor(Math.random() * 900 + 100).toString();
}

/**
 * Calculates expiry date 5 years from now (MM/YY)
 */
export function generateExpiryDate(yearsToAdd = 5): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsToAdd);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${month}/${year}`;
}

/**
 * Formats currency to Rupiah: Rp 2.000.000
 */
export function formatRupiah(amount: number): string {
  if (!Number.isFinite(amount) || amount >= 900_000_000_000_000) {
    return '∞ (Tidak Terbatas)';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats Date to Indonesian standard format
 */
export function formatIndoDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateString;
  }
}

/**
 * Plays realistic audio cues using browser Web Audio API
 */
export function playAtmSound(type: 'beep' | 'cash' | 'card' | 'success' | 'alert') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.14);
      });
    } else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'cash') {
      // Simulate multiple fast mechanical clicks/rattles
      for (let i = 0; i < 6; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(120 + Math.random() * 60, ctx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.05);
      }
    } else if (type === 'card') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    }
  } catch {
    // Gracefully ignore audio errors if not permitted yet
  }
}

/**
 * Formats remaining ban countdown in real-time (e.g. "00m 45d" or "01j 12m 08d")
 */
export function formatBanRemainingTime(expiresAt?: string): {
  expired: boolean;
  formatted: string;
  remainingSeconds: number;
} {
  if (!expiresAt) {
    return { expired: false, formatted: 'Permanen', remainingSeconds: Infinity };
  }
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { expired: true, formatted: '00m 00d (Selesai)', remainingSeconds: 0 };
  }
  const totalSec = Math.ceil(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (hours > 0) {
    return {
      expired: false,
      formatted: `${String(hours).padStart(2, '0')}j ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}d`,
      remainingSeconds: totalSec,
    };
  }
  return {
    expired: false,
    formatted: `${String(mins).padStart(2, '0')} Menit ${String(secs).padStart(2, '0')} Detik`,
    remainingSeconds: totalSec,
  };
}

/**
 * Generates 100x Lipat Penjelasan Super Lengkap (10 Bagian Ensiklopedia Mendalam)
 * untuk setiap fitur di Bank Nusantara
 */
export function getFeatureUltraDetailedExplanation(feat: {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultAmount?: number;
  isPaidWithMoney: boolean;
  requireAdminPin: boolean;
  requireAdminApproval: boolean;
}) {
  const isRedeemableCode =
    feat.id === 'pln' ||
    feat.id === 'pulsa' ||
    feat.id === 'voucher_game' ||
    feat.id === 'tukar_pulsa' ||
    feat.id === 'tukar_token' ||
    feat.id === 'redeem_code';

  return {
    summary: `${feat.title} merupakan layanan perbankan digital resmi PT Bank Nusantara (Persero) Tbk dalam kategori "${feat.category}". ${feat.description} Layanan ini terintegrasi langsung dengan Core Banking Real-Time, sistem proteksi EMV Chip 256-bit, verifikasi PIN Kartu 6 digit, serta sistem manajemen otoritas terpusat.`,
    sections: [
      {
        number: '01',
        title: 'Definisi, Fungsi Utama & Ruang Lingkup Layanan',
        content: `Fitur "${feat.title}" dirancang untuk memberikan kemudahan transaksi 24 jam nonstop bagi seluruh pemegang Kartu Reguler, Kartu Emas, Kartu Premium, Kartu Platinum Prioritas, maupun Kartu Admin (∞). Melalui modul ini, nasabah tidak perlu lagi mengantre di kantor cabang atau loket pembayaran fisik karena seluruh instruksi pemrosesan dilakukan secara elektronik dengan nomor referensi unik berstandar perbankan nasional.`,
      },
      {
        number: '02',
        title: 'Arsitektur Pemrosesan & Status "Sedang Diproses"',
        content: feat.requireAdminApproval
          ? `Ketika Anda mengeksekusi transaksi pada fitur "${feat.title}", sistem akan langsung mencatat instruksi Anda dengan status "SEDANG DIPROSES". Demi kenyamanan nasabah, layar tidak menyebutkan istilah teknis internal, melainkan menampilkan indikator pemrosesan sistem secara elegan. Begitu pemeriksaan selesai dilakukan di pusat kendali, status transaksi otomatis berubah menjadi Aktif/Selesai.`
          : `Fitur "${feat.title}" saat ini dikonfigurasi dalam mode EKSEKUSI INSTAN (Tanpa Antrean Pemrosesan). Begitu Anda menekan tombol konfirmasi, transaksi langsung tuntas pada detik itu juga tanpa jeda waktu tunggu.`,
      },
      {
        number: '03',
        title: 'Mekanisme Pemotongan Saldo & Keistimewaan Kartu Admin (∞)',
        content: feat.isPaidWithMoney
          ? `Setiap transaksi berbayar pada "${feat.title}" (estimasi nominal standar ${formatRupiah(feat.defaultAmount || 100000)}) akan LANGSUNG memotong saldo rekening aktif Anda saat transaksi diajukan agar dana terikat secara sah (Escrow Ledger). Khusus bagi pengguna Kartu ke-5 yaitu KARTU ADMIN (Infinity / ∞), saldo tidak akan pernah habis dan tetap bernilai ∞ (Tidak Terbatas) berapapun nominal yang dibelanjakan.`
          : `Fitur "${feat.title}" merupakan layanan non-debit atau klaim manfaat sehingga tidak memotong saldo utama rekening Anda (Rp 0 biaya eksekusi).`,
      },
      {
        number: '04',
        title: 'Sistem Kode Tukar vs Persetujuan Pembeli (Buyer Confirmation)',
        content: isRedeemableCode
          ? `Karena "${feat.title}" termasuk kategori produk berbasis Voucher/Token Digital, sistem akan menerbitkan Kode Tukar Resmi (16-20 digit). Selama pesanan masih berstatus "Sedang Diproses", kode tersebut DISEMBUNYIKAN secara rapat dan baru akan ditampilkan setelah proses verifikasi selesai. Setelah kode muncul, Anda dapat menukarkannya pada menu Tukar Kode.`
          : `Karena "${feat.title}" adalah layanan/pembelian langsung yang TIDAK menggunakan kode voucher (seperti tagihan Air/PDAM, layanan publik, pembayaran tagihan, atau pembelian langsung), sistem TIDAK mengeluarkan kode tukar. Sebagai gantinya, setelah pesanan selesai diproses oleh sistem/Admin, Anda sebagai pembeli akan mendapatkan tombol "Setujui Pesanan (Persetujuan Pembeli)" untuk mengonfirmasi bahwa layanan/pesanan telah diterima dengan baik.`,
      },
      {
        number: '05',
        title: 'Konfigurasi Keamanan PIN Admin & Kebebasan Pengaturan',
        content: feat.requireAdminPin
          ? `Saat ini fitur "${feat.title}" dipasang proteksi ganda berupa Otorisasi PIN Admin. Artinya sebelum membuka formulir fitur ini, pengguna wajib memasukkan 6 digit kode otorisasi. Pengaturan ini dapat diubah kapan saja (diaktifkan atau dimatikan secara bebas) di Panel Admin.`
          : `Saat ini fitur "${feat.title}" dapat diakses langsung oleh nasabah tanpa meminta PIN Admin di awal. Namun Administrator memiliki hak penuh di Panel Admin untuk mengaktifkan kunci PIN Admin pada fitur ini kapan saja.`,
      },
      {
        number: '06',
        title: 'Jaminan Refund 100% Otomatis (Auto-Reversal Guarantee)',
        content: `Apabila transaksi pada "${feat.title}" yang sedang diproses ternyata dibatalkan atau ditolak karena ketidaksesuaian nomor tujuan/ID pelanggan, Core Banking Bank Nusantara menjamin pengembalian dana (Refund) 100% utuh secara otomatis kembali ke saldo rekening Anda detik itu juga beserta notifikasi rincian pengembalian dana.`,
      },
      {
        number: '07',
        title: 'Prosedur Langkah demi Langkah Penggunaan Fitur',
        content: `1) Pastikan Kartu ATM Anda berstatus AKTIF (tidak sedang dibekukan atau di-Banned). 2) Buka tab "65+ Fitur Digital, Redeem & Pulsa" lalu pilih "${feat.title}". 3) Masukkan Nomor Pelanggan / ID Tujuan dan pilih atau ketik nominal pembayaran. 4) Periksa rincian saldo sebelum & sesudah transaksi. 5) Klik tombol Eksekusi/Bayar dan simpan bukti struk digital referensi transaksi.`,
      },
      {
        number: '08',
        title: 'Integrasi Mutasi Rekening & Cetak Ulang Struk ATM',
        content: `Seluruh riwayat penggunaan fitur "${feat.title}" tercatat abadi di buku besar Mutasi & Laporan Rekening lengkap dengan Waktu Transaksi (WIB), Nomor Referensi Unik, Nama Pengirim, ID Tujuan, serta Status Konfirmasi. Anda juga dapat mencetak ulang struk fisik transaksi ini di menu "Simulator Mesin ATM" -> "Cetak Ulang Struk".`,
      },
      {
        number: '09',
        title: 'Kepatuhan Regulasi Perbankan, BI-FAST, GPN & Proteksi Data',
        content: `Seluruh pertukaran data pada "${feat.title}" dilindungi enkripsi TLS 1.3 dan standar keamanan Otoritas Jasa Keuangan (OJK). Identitas nasabah yang telah mendapatkan "Centang Biru (Verified Badge)" dari Panel Admin juga memperoleh prioritas pemrosesan pada antrean transaksi finansial.`,
      },
      {
        number: '10',
        title: 'Tips Keamanan & Solusi Kendala Teknis (Troubleshooting)',
        content: `Pastikan nomor ID tujuan yang Anda masukkan sudah benar sebelum menekan tombol bayar. Jika Anda ingin berpindah dari kartu baru ke kartu lama Anda sebelum bertransaksi, gunakan menu Ganti/Login Kartu dengan memasukkan 6 digit PIN Kartu Lama Anda (bukan PIN Admin). Jika lupa PIN kartu lama, gunakan tombol "Lupa PIN Kartu?" agar ditinjau oleh Admin.`,
      },
    ],
  };
}

