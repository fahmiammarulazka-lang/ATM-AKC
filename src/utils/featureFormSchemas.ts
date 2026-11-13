import { FeatureSecurityConfig } from '../types/bank';

export interface ServiceExtraField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'number';
  options?: string[];
  defaultValue: string;
  placeholder?: string;
  required?: boolean;
}

export interface ServiceFormSchema {
  serviceBadge: string;
  primaryFieldLabel: string;
  primaryFieldPlaceholder: string;
  primaryDefaultValue: string;
  extraFields: ServiceExtraField[];
  nominalPresets: number[];
}

const buildPresets = (baseAmount: number): number[] => {
  const base = Math.max(15_000, baseAmount || 100_000);
  const roundClean = (val: number) => {
    if (val >= 1_000_000) return Math.round(val / 100_000) * 100_000;
    if (val >= 100_000) return Math.round(val / 25_000) * 25_000;
    return Math.round(val / 5_000) * 5_000;
  };
  const candidates = [
    roundClean(base * 0.5),
    base,
    roundClean(base * 1.5),
    roundClean(base * 2),
  ];
  return Array.from(new Set(candidates.filter((v) => v >= 10_000))).slice(0, 4);
};

export function getServiceFormSchema(feat: FeatureSecurityConfig): ServiceFormSchema {
  const id = feat.id.toLowerCase();
  const cat = feat.category;
  const presets = buildPresets(feat.defaultAmount ?? 100_000);

  // 1. E-COMMERCE, MARKETPLACE & LOGISTIK
  if (
    cat === 'E-Commerce & Logistik' ||
    id.includes('ecommerce') ||
    id.includes('marketplace') ||
    id.includes('kirim_') ||
    id.includes('kargo')
  ) {
    return {
      serviceBadge: 'Transaksi E-Commerce & Logistik',
      primaryFieldLabel: 'Kode Pesanan / Nomor Virtual Account / No. Resi',
      primaryFieldPlaceholder: 'Contoh: INV-MKT-88291044 atau JNE9918273',
      primaryDefaultValue: `ORD-${Math.floor(100000 + Math.random() * 899999)}`,
      extraFields: [
        {
          key: 'platform',
          label: 'Platform / Ekspedisi Pilihan',
          type: 'select',
          options: [
            'Tokopedia / Shopee / Lazada',
            'TikTok Shop / Blibli / Zalora',
            'GoSend / GrabExpress Instan',
            'JNE / SiCepat / J&T Express',
            'Paxel Smart Locker / Kargo Trucking',
          ],
          defaultValue: 'Tokopedia / Shopee / Lazada',
          required: true,
        },
        {
          key: 'deliveryOption',
          label: 'Opsi Pengiriman & Proteksi',
          type: 'select',
          options: [
            'Instan Same-Day (1–3 Jam Sampai)',
            'Next-Day Ekspres Prioritas',
            'Reguler + Asuransi Proteksi Paket',
            'Rekening Bersama (Escrow Aman)',
            'Packing Kayu & Cold Chain',
          ],
          defaultValue: 'Reguler + Asuransi Proteksi Paket',
          required: true,
        },
        {
          key: 'recipientAddress',
          label: 'Kota Tujuan / Alamat Penerima',
          type: 'text',
          defaultValue: 'Jakarta Selatan (Alamat Utama)',
          placeholder: 'Masukkan kota atau alamat pengiriman',
          required: true,
        },
      ],
      nominalPresets: presets,
    };
  }

  // 2. KULINER & F&B
  if (
    cat === 'Kuliner & F&B' ||
    id.includes('kuliner') ||
    id.includes('kopi') ||
    id.includes('katering') ||
    id.includes('makan') ||
    id.includes('kue') ||
    id.includes('chef') ||
    id.includes('aqiqah')
  ) {
    return {
      serviceBadge: 'Layanan Kuliner, Restoran & Katering',
      primaryFieldLabel: 'Nama Restoran / Outlet / Kode Pesanan Meja',
      primaryFieldPlaceholder: 'Contoh: Nusantara Kitchen • Meja #08',
      primaryDefaultValue: `KUL-${Math.floor(10000 + Math.random() * 89999)}`,
      extraFields: [
        {
          key: 'merchantType',
          label: 'Kategori Outlet / Layanan',
          type: 'select',
          options: [
            'Pesan Antar Kilat (Food Delivery)',
            'Restoran Dine-In / Fine Dining',
            'Kedai Kopi & Artisan Bakery',
            'Katering Harian / Prasmanan Acara',
            'Supermarket & Groceries Segar',
          ],
          defaultValue: 'Pesan Antar Kilat (Food Delivery)',
          required: true,
        },
        {
          key: 'portionPackage',
          label: 'Pilihan Paket / Jumlah Porsi',
          type: 'select',
          options: [
            'Paket Personal (1–2 Porsi)',
            'Paket Keluarga / Tim (4–6 Porsi)',
            'Paket Acara / Rapat (15–30 Box)',
            'Langganan Mingguan / Bulanan',
          ],
          defaultValue: 'Paket Personal (1–2 Porsi)',
          required: true,
        },
        {
          key: 'deliveryNote',
          label: 'Alamat Antar / Permintaan Khusus Menu',
          type: 'text',
          defaultValue: 'Diantar ke alamat rumah • Tanpa pedas berlebih',
          placeholder: 'Tulis alamat antar, jam saji, atau catatan alergi',
          required: true,
        },
      ],
      nominalPresets: presets,
    };
  }

  // 3. KECERDASAN BUATAN (AI) & TEKNOLOGI CLOUD
  if (cat === 'Teknologi AI & Cloud' || cat === 'Teknologi & Satelit') {
    return {
      serviceBadge: 'Layanan AI, Cloud Compute & Infrastruktur',
      primaryFieldLabel: 'Email Akun Terdaftar / ID Organisasi / Workspace',
      primaryFieldPlaceholder: 'Contoh: developer@perusahaan.co.id',
      primaryDefaultValue: 'workspace@banknusantara.id',
      extraFields: [
        {
          key: 'cloudTier',
          label: 'Paket / Tipe Resource AI & Cloud',
          type: 'select',
          options: [
            'Pro Developer / LLM API Kredit',
            'Cluster GPU Compute (A100 / H100)',
            'Edge Serverless & Vector RAG DB',
            'Studio Generasi Gambar, Video & TTS',
            'Enterprise Security, VPN & Backup 20TB',
          ],
          defaultValue: 'Pro Developer / LLM API Kredit',
          required: true,
        },
        {
          key: 'billingCycle',
          label: 'Siklus Tagihan / Masa Aktif',
          type: 'select',
          options: [
            'Top-Up Kredit Sekali Pakai (Pay-As-You-Go)',
            'Langganan 1 Bulan',
            'Langganan 3 Bulan',
            'Langganan 1 Tahun (Prioritas SLA 99.99%)',
          ],
          defaultValue: 'Langganan 1 Bulan',
          required: true,
        },
        {
          key: 'regionNode',
          label: 'Region Server / Endpoint Tujuan',
          type: 'select',
          options: [
            'Asia Tenggara — Jakarta (id-jkt-1)',
            'Asia Tenggara — Singapura (ap-sg-1)',
            'Global Edge Network (Multi-Region)',
          ],
          defaultValue: 'Asia Tenggara — Jakarta (id-jkt-1)',
          required: true,
        },
      ],
      nominalPresets: presets,
    };
  }

  // 4. PERBANKAN & BISNIS UMKM / BISNIS & UMKM / PERBANKAN PRIORITAS
  if (
    cat === 'Perbankan & Bisnis UMKM' ||
    cat === 'Bisnis & UMKM' ||
    cat === 'Perbankan Prioritas'
  ) {
    return {
      serviceBadge: 'Solusi Perbankan Bisnis, UMKM & Korporasi',
      primaryFieldLabel: 'Nomor Faktur / NPWP Usaha / Kode Kontrak B2B',
      primaryFieldPlaceholder: 'Contoh: INV-2026-1109 / NPWP 01.234.567.8',
      primaryDefaultValue: `BIZ-${Math.floor(100000 + Math.random() * 899999)}`,
      extraFields: [
        {
          key: 'entityName',
          label: 'Nama Badan Usaha / Divisi',
          type: 'text',
          defaultValue: 'PT Nusantara Niaga Sejahtera',
          placeholder: 'Masukkan nama usaha atau divisi',
          required: true,
        },
        {
          key: 'settlementMode',
          label: 'Jenis Penyelesaian / Instrumen',
          type: 'select',
          options: [
            'Pelunasan Faktur / Modal Kerja UMKM',
            'Setoran Pajak PPh Final / PPN (NTPN)',
            'Payroll / Pembagian Dividen Pemegang Saham',
            'Escrow Termin Proyek / Bank Garansi / L/C',
            'Pengadaan Perangkat Kasir & Operasional',
          ],
          defaultValue: 'Pelunasan Faktur / Modal Kerja UMKM',
          required: true,
        },
        {
          key: 'accountingPeriod',
          label: 'Periode Pembukuan / Termin',
          type: 'select',
          options: [
            'Periode November 2026',
            'Kuartal IV (Q4) 2026',
            'Termin Pembayaran Tahap #1',
            'Eksekusi Kontrak Tahunan',
          ],
          defaultValue: 'Periode November 2026',
          required: true,
        },
      ],
      nominalPresets: presets,
    };
  }

  // 5. TAGIHAN HARIAN & UTILITAS
  if (cat === 'Tagihan & Utilitas') {
    return {
      serviceBadge: 'Pembayaran Tagihan Harian & Utilitas',
      primaryFieldLabel: 'ID Pelanggan / Nomor Meter / Nomor Sambungan',
      primaryFieldPlaceholder: 'Contoh: 542109847163',
      primaryDefaultValue: `54${Math.floor(1000000000 + Math.random() * 8999999999)}`,
      extraFields: [
        {
          key: 'utilityProvider',
          label: 'Penyedia Layanan / Wilayah',
          type: 'select',
          options: [
            'PLN / PDAM Nasional',
            'Biznet / IndiHome / MyRepublic / Orbit',
            'PGN Gas Alam / Bright Gas Pertamina',
            'Pengelola Apartemen / Cluster Hunian',
            'Teknisi Utilitas & Sanitasi Resmi',
          ],
          defaultValue: 'PLN / PDAM Nasional',
          required: true,
        },
        {
          key: 'billingPeriod',
          label: 'Periode Pemakaian / Paket',
          type: 'select',
          options: [
            'Bulan November 2026',
            'Bulan Desember 2026',
            'Paket Langganan 3 Bulan',
            'Pembelian / Panggilan Sekali Layanan',
          ],
          defaultValue: 'Bulan November 2026',
          required: true,
        },
        {
          key: 'serviceAddress',
          label: 'Lokasi Pemasangan / Alamat Hunian',
          type: 'text',
          defaultValue: 'Rumah Utama (Terdaftar di Rekening)',
          placeholder: 'Masukkan alamat atau nomor unit hunian',
          required: false,
        },
      ],
      nominalPresets: presets,
    };
  }

  // 6. INVESTASI & PROTEKSI
  if (cat === 'Investasi & Proteksi') {
    return {
      serviceBadge: 'Investasi, Aset & Proteksi Terjamin',
      primaryFieldLabel: 'Nomor SID / Rekening Efek (RDN) / Nomor Polis',
      primaryFieldPlaceholder: 'Contoh: IDD-8891029384',
      primaryDefaultValue: `INV-${Math.floor(1000000 + Math.random() * 8999999)}`,
      extraFields: [
        {
          key: 'assetClass',
          label: 'Produk / Kelas Instrumen',
          type: 'select',
          options: [
            'SBN Ritel (ORI / SBR / Sukuk Negara)',
            'Emas 24K Antam / Tabungan Emas Digital',
            'Reksa Dana / ETF Indeks & Saham RDN',
            'Deposito Valas (USD / SGD / EUR)',
            'Polis Asuransi Jiwa, Kargo & Aset',
          ],
          defaultValue: 'SBN Ritel (ORI / SBR / Sukuk Negara)',
          required: true,
        },
        {
          key: 'investmentTenor',
          label: 'Horizon Waktu / Frekuensi',
          type: 'select',
          options: [
            'Pembelian Sekali (Lump Sum)',
            'Auto-Invest Mingguan Terjadwal',
            'Tenor Menengah (6–12 Bulan)',
            'Proteksi Polis Tahunan',
          ],
          defaultValue: 'Pembelian Sekali (Lump Sum)',
          required: true,
        },
      ],
      nominalPresets: presets,
    };
  }

  // 7. GAYA HIDUP & HIBURAN / TRAVEL / KESEHATAN / PENDIDIKAN / PAJAK
  return {
    serviceBadge: `Layanan ${cat}`,
    primaryFieldLabel:
      cat.includes('Pajak') || cat.includes('Publik')
        ? 'Kode Billing Negara (MPN G3) / NOP / Nomor Polisi'
        : cat.includes('Kesehatan')
        ? 'Nomor Rekam Medis / ID Pasien / Nomor Polis'
        : cat.includes('Pendidikan')
        ? 'NIM / NISN / Kode Pendaftaran Institusi'
        : cat.includes('Travel') || cat.includes('Transportasi')
        ? 'Kode Booking / Nomor Penerbangan / Pelat Kendaraan'
        : 'Nomor Pelanggan / User ID / Kode Reservasi',
    primaryFieldPlaceholder: 'Masukkan nomor identifikasi layanan dengan benar',
    primaryDefaultValue: `SRV-${Math.floor(100000 + Math.random() * 899999)}`,
    extraFields: [
      {
        key: 'serviceTier',
        label: 'Pilihan Paket / Kelas Layanan',
        type: 'select',
        options: [
          'Paket Standar / Reguler',
          'Paket Prioritas / Eksekutif',
          'Paket Keluarga / Korporasi',
          'Langganan Berkala Bulanan',
        ],
        defaultValue: 'Paket Standar / Reguler',
        required: true,
      },
      {
        key: 'scheduleRef',
        label: 'Jadwal / Keterangan Tambahan',
        type: 'text',
        defaultValue: 'Diproses segera pada jam operasional aktif',
        placeholder: 'Tanggal penggunaan, jumlah peserta, atau catatan',
        required: false,
      },
    ],
    nominalPresets: presets,
  };
}
