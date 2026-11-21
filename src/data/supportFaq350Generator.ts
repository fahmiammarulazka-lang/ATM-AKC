import { SupportFaqCategory, SupportFaqItem } from '../types/bank';

interface TopicBlueprint {
  category: SupportFaqCategory;
  subject: string;
  context: string;
  menuName: string;
  keyAction: string;
  verificationDetail: string;
  securityAdvice: string;
  keywords: string[];
}

const TEN_CATEGORY_BLUEPRINTS: TopicBlueprint[] = [
  {
    category: 'akun',
    subject: 'Pengelolaan Profil, Pendaftaran & Kredensial Akun',
    context: 'sinkronisasi identitas KTP, alamat 38 provinsi, serta akses masuk multi-jalur di Lobi Awal',
    menuName: 'Pengaturan Akun & Lobi Awal',
    keyAction: 'memverifikasi kesesuaian Nama Lengkap, NIK 16 Digit, Nomor Rekening, dan ID User 16 Digit',
    verificationDetail: 'pastikan indikator Sinkronisasi Cloud di Navbar berwarna hijau aktif',
    securityAdvice: 'Simpan salinan Nomor Rekening dan ID User 16 Digit di catatan pribadi yang aman agar mudah masuk kembali kapan saja.',
    keywords: ['akun', 'profil', 'lobi', 'buat akun', 'login', 'alamat', 'ktp', 'google'],
  },
  {
    category: 'kartu',
    subject: 'Aktivasi, Tier, Limit & Kontrol Kartu ATM',
    context: 'pengaturan status kartu aktif, pengajuan kartu baru saldo awal Rp 0, serta peningkatan tier kartu',
    menuName: 'Manajemen Kartu & Upgrade Tier di Dashboard',
    keyAction: 'memeriksa status kartu (Aktif / Menunggu Persetujuan Admin / Dibekukan) dan limit transaksi harian',
    verificationDetail: 'konfirmasikan perubahan status kartu menggunakan kode PIN Kartu 6 Digit yang valid',
    securityAdvice: 'Gunakan fitur Bekukan Kartu (Freeze) segera apabila kartu sedang tidak digunakan dalam waktu lama.',
    keywords: ['kartu', 'tier', 'reguler', 'gold', 'platinum', 'prioritas', 'freeze', 'limit', 'aktivasi'],
  },
  {
    category: 'atm',
    subject: 'Operasional Mesin Simulator ATM, Tarik & Setor Tunai',
    context: 'transaksi tarik tunai pecahan resmi, setor tunai instan, dan token tarik tunai tanpa kartu',
    menuName: 'Simulator Mesin ATM Digital',
    keyAction: 'memasukkan kartu aktif atau kode token 6 digit lalu menginput PIN 6 Digit di layar mesin ATM',
    verificationDetail: 'periksa struk digital ATM dan riwayat mutasi untuk memastikan saldo langsung diperbarui',
    securityAdvice: 'Selalu tekan tombol Keluarkan Kartu (Eject) setelah selesai bertransaksi di Mesin ATM.',
    keywords: ['atm', 'tarik tunai', 'setor tunai', 'token', 'tanpa kartu', 'struk', 'pecahan'],
  },
  {
    category: 'pinjaman',
    subject: 'Pinjaman Daring, Cicilan Bulanan & Kotak Hutang',
    context: 'pengajuan fasilitas pinjaman sesuai plafon tier kartu, pembayaran angsuran, dan hitung mundur tenggat hutang',
    menuName: 'Pinjaman Daring & Tab Kotak Hutang',
    keyAction: 'memilih nominal pokok pinjaman, tenor cicilan, serta memeriksa jadwal jatuh tempo tagihan',
    verificationDetail: 'pastikan saldo utama mencukupi sebelum menekan tombol Bayar Cicilan atau Pelunasan Dipercepat',
    securityAdvice: 'Lunasi tagihan Kotak Hutang sebelum hitung mundur tenggat berakhir untuk menjaga skor kredit tetap bersih.',
    keywords: ['pinjaman', 'hutang', 'kotak hutang', 'cicilan', 'plafon', 'tenor', 'bunga', 'tenggat'],
  },
  {
    category: 'keamanan',
    subject: 'Keamanan Rekening, Proteksi PIN & Anti-Phishing',
    context: 'perlindungan berlapis VIP Shield, manajemen PIN 6 Digit, audit sesi perangkat, dan pencegahan penipuan',
    menuName: 'Pusat Keamanan (Security Command Center)',
    keyAction: 'mengaktifkan seluruh lapisan proteksi akun dan meninjau 10 kategori notifikasi keamanan real-time',
    verificationDetail: 'laporkan setiap indikasi akses mencurigakan melalui tombol Contact Us WhatsApp atau Email resmi',
    securityAdvice: 'Petugas dan Admin Bank Nusantara tidak pernah meminta kode PIN 6 Digit maupun nomor CVV kartu Anda.',
    keywords: ['keamanan', 'pin', 'cvv', 'phishing', 'shield', 'notifikasi', 'darurat', 'proteksi'],
  },
  {
    category: 'transfer',
    subject: 'Transfer Antar Rekening, Multi-Kartu & Mutasi',
    context: 'pengiriman dana real-time antar nasabah, pemindahan saldo antar kartu sendiri, dan audit buku mutasi',
    menuName: 'Transfer Dana & Riwayat Mutasi',
    keyAction: 'memasukkan nomor rekening tujuan 10 digit, memverifikasi nama penerima, dan menginput nominal transfer',
    verificationDetail: 'simpan bukti transfer digital beserta nomor referensi unik untuk arsip transaksi',
    securityAdvice: 'Periksa kembali kecocokan nama pemilik rekening tujuan yang muncul otomatis sebelum memasukkan PIN.',
    keywords: ['transfer', 'mutasi', 'kirim uang', 'rekening tujuan', 'referensi', 'riwayat', 'bukti'],
  },
  {
    category: 'emas',
    subject: 'Investasi Emas 24K, Buyback & Cetak Fisik',
    context: 'pembelian gramasi Emas 24K murni, penjualan kembali (buyback) ke Rupiah, dan transfer emas antar rekening',
    menuName: 'Brankas & Perdagangan Emas 24K',
    keyAction: 'memantau harga beli/buyback real-time per gram lalu menginput jumlah gramasi atau nominal Rupiah',
    verificationDetail: 'cek pembaruan saldo gramasi emas pada kartu portofolio Emas 24K dan riwayat transaksi emas',
    securityAdvice: 'Pantau grafik pergerakan harga Emas 24K secara berkala untuk menentukan waktu beli dan buyback terbaik.',
    keywords: ['emas', '24k', 'gramasi', 'buyback', 'investasi', 'cetak emas', 'portofolio'],
  },
  {
    category: 'spin',
    subject: 'Spin the Wheel, Coin Nusantara, Redeem & Surat Hadiah',
    context: 'putaran roda keberuntungan berhadiah, penukaran Coin Nusantara, klaim kode redeem, dan amplop hadiah Admin',
    menuName: 'Spin the Wheel & Popup Surat Hadiah Admin',
    keyAction: 'menggunakan tiket putaran aktif atau membuka amplop Surat & Kotak Hadiah di pojok kanan bawah Dashboard',
    verificationDetail: 'pastikan hadiah uang, emas, atau koin langsung tercatat pada indikator saldo di Navbar atas',
    securityAdvice: 'Ingat bahwa transfer Kotak Hadiah ke teman hanya dapat dilakukan sebelum Kotak Hadiah tersebut dibuka.',
    keywords: ['spin', 'wheel', 'koin', 'coin nusantara', 'redeem', 'hadiah', 'surat admin'],
  },
  {
    category: 'oa_guest',
    subject: 'Akun OA (Official Admin), Akun Guest & Tab Buat Akun',
    context: 'penggunaan 5 jalur autentikasi Lobi Awal termasuk Akun OA khusus, Akun Guest tanpa alamat, dan Buat Akun mandiri',
    menuName: '5 Tab Autentikasi Lobi Awal Bank Nusantara',
    keyAction: 'memilih tab jalur masuk yang sesuai dengan jenis akun (Google, Buat Akun, Login Ke Akun, Akun OA, atau Guest)',
    verificationDetail: 'gunakan tombol Sambungkan ke Google kapan saja untuk mengamankan akun lokal ke penyimpanan Cloud',
    securityAdvice: 'Akun Guest dan Buat Akun di Lobi dibatasi maksimal 1 akun per perangkat untuk menjaga integritas sistem.',
    keywords: ['akun oa', 'guest', 'buat akun', 'tanpa google', 'perangkat', 'kredensial', 'lobi awal'],
  },
  {
    category: 'umum',
    subject: 'Layanan Nasabah 24 Jam, Contact Us & Kantong Deposito',
    context: 'pengiriman tiket bantuan WhatsApp/Email otomatis, pengelolaan Kantong Tabungan, serta Deposito Berjangka',
    menuName: 'Pusat Bantuan, Contact Us & Tabungan Berjangka',
    keyAction: 'memilih 1 dari 10 kategori topik beserta sub-pilihannya atau mengatur alokasi dana tabungan',
    verificationDetail: 'tinjau pratinjau pesan tiket otomatis yang sudah memuat data lengkap rekening sebelum mengirim',
    securityAdvice: 'Gunakan saluran resmi Contact Us berlogo WhatsApp hijau di kanan bawah Dashboard untuk respon tercepat.',
    keywords: ['bantuan', 'contact us', 'whatsapp', 'email', 'kantong tabungan', 'deposito', 'tiket'],
  },
];

interface ScenarioTemplate {
  questionPattern: (bp: TopicBlueprint, variantLabel: string) => string;
  answerPattern: (bp: TopicBlueprint, variantLabel: string) => string;
  stepsPattern: (bp: TopicBlueprint, variantLabel: string) => string[];
  tipPattern: (bp: TopicBlueprint, variantLabel: string) => string;
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    questionPattern: (bp, v) =>
      `Bagaimana panduan lengkap dan langkah-langkah ${v} pada fitur ${bp.subject}?`,
    answerPattern: (bp, v) =>
      `Fitur ${bp.subject} di Bank Nusantara dirancang untuk memudahkan nasabah dalam ${v} yang berkaitan dengan ${bp.context}. Seluruh perubahan dan transaksi yang Anda lakukan pada menu ${bp.menuName} akan divalidasi secara berlapis dan langsung disinkronkan ke penyimpanan Cloud serta perangkat lokal secara real-time.`,
    stepsPattern: (bp, v) => [
      `Masuk ke akun Bank Nusantara Anda melalui Lobi Awal dan buka halaman Dashboard utama.`,
      `Arahkan navigasi ke menu "${bp.menuName}" pada bilah navigasi atau kartu pintasan Dashboard.`,
      `Pilih opsi "${v}" dan lakukan proses ${bp.keyAction} sesuai petunjuk di layar.`,
      `Periksa kembali rincian parameter yang tampil pada layar konfirmasi agar tidak terjadi kesalahan input.`,
      `Masukkan kode PIN Kartu 6 Digit Anda apabila sistem meminta otorisasi keamanan transaksi.`,
      `Selesai — ${bp.verificationDetail} sebagai tanda proses telah berhasil disimpan.`,
    ],
    tipPattern: (bp) => bp.securityAdvice,
  },
  {
    questionPattern: (bp, v) =>
      `Apa yang harus dilakukan jika terjadi kendala saat ${v} di menu ${bp.menuName}?`,
    answerPattern: (bp, v) =>
      `Apabila Anda mengalami kendala teknis atau penolakan otomatis ketika ${v} pada layanan ${bp.subject}, hal tersebut umumnya disebabkan oleh status kartu yang belum aktif, batas limit harian, atau koneksi sinkronisasi yang sedang memuat. Sistem Bank Nusantara melindungi dana Anda sehingga tidak ada saldo yang hilang selama proses verifikasi berlangsung.`,
    stepsPattern: (bp, v) => [
      `Periksa terlebih dahulu status kartu aktif Anda di bagian atas Dashboard (pastikan tidak berstatus Pending atau Frozen).`,
      `Buka kembali menu "${bp.menuName}" dan periksa pesan pemberitahuan yang muncul saat Anda mencoba ${v}.`,
      `Lakukan pengecekan ulang dengan ${bp.keyAction} secara teliti.`,
      `Klik indikator Sync di Navbar atas untuk memastikan data perangkat Anda sudah selaras dengan server Cloud.`,
      `Jika kendala masih berlanjut, klik tombol bulat hijau WhatsApp (Contact Us) di pojok kanan bawah Dashboard.`,
      `Pilih kategori topik terkait dan kirimkan tiket bantuan otomatis kepada Tim Admin untuk penanganan langsung.`,
    ],
    tipPattern: (bp) =>
      `${bp.securityAdvice} Jangan ragu melampirkan nomor referensi transaksi saat menghubungi Contact Us.`,
  },
  {
    questionPattern: (bp, v) =>
      `Bagaimana aturan keamanan dan verifikasi resmi saat melakukan ${v} (${bp.subject})?`,
    answerPattern: (bp, v) =>
      `Setiap aktivitas ${v} di dalam cakupan ${bp.subject} dilindungi oleh standar keamanan perbankan digital Bank Nusantara. Sistem secara otomatis memvalidasi kepemilikan rekening, kecocokan ID User 16 Digit, serta otorisasi PIN 6 Digit untuk memastikan bahwa instruksi tersebut benar-benar berasal dari pemilik sah rekening.`,
    stepsPattern: (bp, v) => [
      `Pastikan Anda mengakses aplikasi dari perangkat pribadi yang aman dan sesi login Anda aktif.`,
      `Buka bagian "${bp.menuName}" lalu pilih sub-layanan "${v}".`,
      `Lengkapi tahapan ${bp.keyAction} tanpa membagikan layar atau kode rahasia kepada pihak mana pun.`,
      `Tinjau ringkasan keamanan yang muncul sebelum menekan tombol konfirmasi eksekusi.`,
      `Lakukan langkah akhir yakni ${bp.verificationDetail} dan cek lonceng notifikasi di Navbar atas.`,
    ],
    tipPattern: (bp) => bp.securityAdvice,
  },
  {
    questionPattern: (bp, v) =>
      `Apakah proses ${v} pada layanan ${bp.subject} bisa dilakukan dari HP maupun Laptop?`,
    answerPattern: (bp, v) =>
      `Ya, seluruh layanan ${bp.subject} termasuk proses ${v} telah dioptimalkan secara responsif penuh untuk layar HP (Mobile) maupun Laptop (Desktop). Berkat arsitektur sinkronisasi Cloud dan penyimpanan lokal terpadu, setiap aksi yang Anda lakukan di HP akan langsung terlihat sama persis ketika dibuka di Laptop.`,
    stepsPattern: (bp, v) => [
      `Buka aplikasi Bank Nusantara melalui browser di HP atau Laptop Anda dan masuk ke rekening aktif.`,
      `Ketuk atau klik menu "${bp.menuName}" yang telah menyesuaikan ukuran layar perangkat secara otomatis.`,
      `Jalankan prosedur "${v}" dengan ${bp.keyAction}.`,
      `Tekan tombol Simpan atau Konfirmasi dan tunggu hingga notifikasi berhasil tampil di layar.`,
      `Untuk memastikan keselarasan antar perangkat, ${bp.verificationDetail}.`,
    ],
    tipPattern: (bp) =>
      `Sambungkan akun Anda ke Google agar sinkronisasi lintas HP dan Laptop berjalan otomatis tanpa hambatan. ${bp.securityAdvice}`,
  },
  {
    questionPattern: (bp, v) =>
      `Bagaimana cara mengecek riwayat dan status keberhasilan setelah ${v} di ${bp.menuName}?`,
    answerPattern: (bp, v) =>
      `Setiap kali Anda menyelesaikan proses ${v} pada modul ${bp.subject}, sistem Bank Nusantara secara otomatis mencatat log aktivitas beserta stempel waktu resmi. Anda dapat menelusuri kembali bukti keberhasilan tersebut melalui buku riwayat mutasi maupun panel status di dalam menu ${bp.menuName}.`,
    stepsPattern: (bp, v) => [
      `Setelah menyelesaikan aksi "${v}", tetaplah berada di halaman Dashboard atau menu "${bp.menuName}".`,
      `Lihat kartu status terbaru di bagian atas halaman atau buka daftar riwayat aktivitas di bagian bawahnya.`,
      `Cocokkan detail hasil proses dengan ${bp.keyAction}.`,
      `Buka ikon Lonceng Notifikasi (10 Jenis Notifikasi) di Navbar kanan atas untuk melihat log waktu transaksi.`,
      `Terakhir, ${bp.verificationDetail} dan simpan bukti referensi digital jika diperlukan.`,
    ],
    tipPattern: (bp) => bp.securityAdvice,
  },
];

const VARIANT_TOPICS_PER_CATEGORY: Record<SupportFaqCategory, string[]> = {
  akun: [
    'pendaftaran akun baru melalui tab Buat Akun tanpa sambungan Google',
    'penautan akun lokal ke email Google melalui tombol Sambungkan ke Google',
    'pengisian alamat berjenjang 38 provinsi hingga RT/RW dan Kode Pos otomatis',
    'penggunaan opsi ketik manual nama desa ketika wilayah belum terdaftar atau offline',
    'penyalinan paket kredensial Nomor Rekening dan ID User 16 Digit dengan 1 klik',
    'pemulihan akses masuk melalui tab Login Ke Akun menggunakan 3 kredensial utama',
    'penggabungan kartu otomatis (Zero-Loss Merge) saat menautkan ke akun Google yang sudah punya kartu',
  ],
  kartu: [
    'pemantauan status kartu baru yang masih Menunggu Persetujuan Admin',
    'pengajuan upgrade tier kartu dari Reguler ke Gold, Platinum, atau Prioritas',
    'pembekuan kartu sementara (Freeze Card) untuk mencegah transaksi keluar',
    'pembukaan kembali status kartu beku (Unfreeze) dari halaman Dashboard',
    'penambahan kartu kedua atau multi-kartu di dalam satu profil rekening',
    'pengecekan batas limit transaksi harian dan plafon sesuai tier kartu',
    'penanganan kartu yang ditolak (Rejected) beserta cara pengajuan ulangnya',
  ],
  atm: [
    'penarikan uang tunai menggunakan pecahan resmi di Simulator Mesin ATM',
    'penyetoran uang tunai (Setor Tunai CDM) agar saldo rekening langsung bertambah',
    'pembuatan dan pemakaian kode Token Tarik Tunai Tanpa Kartu (Cardless)',
    'penggantian kode PIN Kartu 6 Digit langsung melalui layar Mesin ATM',
    'pencetakan dan penyimpanan struk bukti transaksi digital dari Mesin ATM',
    'pengecekan informasi saldo dan 5 mutasi terakhir melalui layar Mesin ATM',
    'pengeluaran kartu secara aman (Eject Card) setelah selesai menggunakan ATM',
  ],
  pinjaman: [
    'pengajuan pencairan Pinjaman Daring baru sesuai plafon maksimal tier kartu',
    'pembayaran angsuran atau cicilan bulanan pinjaman aktif tepat waktu',
    'pelunasan seluruh sisa pokok pinjaman lebih awal (Early Full Settlement)',
    'pemantauan hitung mundur tenggat waktu pada tab dan banner Kotak Hutang',
    'pelunasan tagihan aktif di dalam menu Kotak Hutang agar bebas denda',
    'simulasi perhitungan bunga transparan dan jadwal jatuh tempo cicilan',
    'permohonan restrukturisasi atau konsultasi keringanan tenggat hutang ke Admin',
  ],
  keamanan: [
    'penggantian berkala kode PIN Transaksi & Kartu 6 Digit dari Dashboard',
    'permohonan reset PIN 6 Digit melalui verifikasi Admin saat lupa PIN',
    'pengaktifan fitur perlindungan di Pusat Keamanan (Security Command Center)',
    'pengaturan centang izin pada 10 kategori notifikasi keamanan dan transaksi',
    'identifikasi dan pelaporan pesan penipuan (Phishing) yang mengatasnamakan bank',
    'pengamanan darurat rekening dalam 60 detik saat perangkat hilang atau dicuri',
    'pelaporan temuan bug tampilan atau celah teknis melalui fitur Lapor Bug',
  ],
  transfer: [
    'pengiriman dana real-time ke nomor rekening nasabah Bank Nusantara lainnya',
    'pemindahan saldo secara instan antar kartu milik sendiri dalam satu akun',
    'verifikasi otomatis nama pemilik rekening tujuan sebelum konfirmasi PIN',
    'penelusuran nomor referensi unik dan bukti struk transfer di buku mutasi',
    'pemfilteran riwayat mutasi uang masuk dan uang keluar berdasarkan tanggal',
    'penanganan mediasi melalui Contact Us apabila salah memasukkan rekening tujuan',
    'pemindahan dana antara saldo rekening utama, Kantong Tabungan, dan Deposito',
  ],
  emas: [
    'pembelian investasi Emas 24K murni mulai dari gramasi terkecil dengan saldo Rupiah',
    'penjualan kembali (Buyback) saldo gramasi Emas 24K menjadi saldo Rupiah instan',
    'pengiriman atau transfer gramasi Emas 24K ke nomor rekening nasabah lain',
    'pemantauan grafik harga beli dan harga buyback Emas 24K secara real-time',
    'perhitungan nilai estimasi keuntungan portofolio tabungan Emas 24K di brankas',
    'pengajuan permohonan cetak fisik emas batangan 24K bersertifikat resmi',
    'rekonsiliasi riwayat mutasi pembelian, penjualan, dan hadiah gramasi Emas 24K',
  ],
  spin: [
    'pemutaran roda keberuntungan Spin the Wheel untuk memenangkan saldo, emas, dan koin',
    'pengumpulan dan pemantauan saldo Coin Nusantara di indikator Navbar atas',
    'penukaran Coin Nusantara menjadi hadiah saldo atau tiket putaran tambahan',
    'pembukaan amplop Surat Resmi dan klaim isi Kotak Hadiah Royal dari Admin',
    'pengiriman (Transfer) Kotak Hadiah Admin yang belum dibuka ke rekening teman',
    'penukaran kode voucher pada menu Klaim Kode Redeem Resmi Bank Nusantara',
    'pemeriksaan jadwal buka pada paket Surat & Hadiah yang masih berstatus terkunci',
  ],
  oa_guest: [
    'otentikasi khusus pada tab Login Dengan Akun OA (Official Admin Account)',
    'pembuatan dan akses cepat Akun Guest (Tanpa Alamat) di Lobi Awal',
    'aturan kuota maksimal 1 Akun Guest dan 1 Buat Akun Lobi per perangkat',
    'peningkatan status Akun Guest atau Akun Tanpa Google menjadi tersambung Google',
    'perbedaan hak akses dan fitur antara akun Google, Buat Akun, OA, dan Guest',
    'penyimpanan kredensial otomatis perangkat lokal di IndexedDB tanpa kehilangan sesi',
    'pendaftaran akun baru tanpa batas oleh Admin melalui Studio Buat Akun Panel Admin',
  ],
  umum: [
    'penggunaan tombol bulat hijau WhatsApp di sebelah kanan tombol Surat & Hadiah',
    'pemilihan 1 dari 10 kategori topik beserta 60+ sub-pilihan preset di Contact Us',
    'pengeditan langsung teks penjelasan kendala sebelum mengirim pesan WhatsApp atau Email',
    'penggabungan beberapa sub-pilihan kendala sekaligus ke dalam satu tiket Contact Us',
    'pembuatan dan penarikan dana pada fitur Kantong Tabungan (Savings Pocket)',
    'pembukaan penempatan Deposito Berjangka beserta perhitungan imbal hasil bunga',
    'pencarian instan dan pengacakan urutan panduan di antara 350 topik Pusat Bantuan',
  ],
};

/**
 * Menghasilkan 300 FAQ tambahan (faq-51 s/d faq-350) yang unik, lengkap dengan
 * penjelasan mendalam, 5-6 langkah bernomor, dan tips keamanan.
 * (10 kategori x 7 varian topik x 5 skenario = 350 slot, kita ambil 300 item unik
 *  untuk melengkapi 50 FAQ kurasi pertama sehingga tepat 350 FAQ!)
 */
export function generateAdditional300SupportFaqs(): SupportFaqItem[] {
  const generated: SupportFaqItem[] = [];
  let counter = 51;

  // Kita iterasi secara silang (interleaved) antar skenario & varian lalu antar kategori
  // agar urutan item yang dihasilkan langsung tersebar merata di seluruh 10 kategori!
  for (let variantIdx = 0; variantIdx < 7; variantIdx++) {
    for (let scenarioIdx = 0; scenarioIdx < SCENARIO_TEMPLATES.length; scenarioIdx++) {
      for (let catIdx = 0; catIdx < TEN_CATEGORY_BLUEPRINTS.length; catIdx++) {
        if (counter > 350) break;
        const bp = TEN_CATEGORY_BLUEPRINTS[catIdx];
        const variants = VARIANT_TOPICS_PER_CATEGORY[bp.category];
        const variantText = variants[variantIdx % variants.length];
        const scenario = SCENARIO_TEMPLATES[scenarioIdx];

        const id = `faq-${String(counter).padStart(2, '0')}`;
        generated.push({
          id,
          category: bp.category,
          question: scenario.questionPattern(bp, variantText),
          answer: scenario.answerPattern(bp, variantText),
          steps: scenario.stepsPattern(bp, variantText),
          tip: scenario.tipPattern(bp, variantText),
          keywords: [
            ...bp.keywords,
            ...variantText
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 3)
              .slice(0, 6),
          ],
          isActive: true,
        });
        counter++;
      }
    }
  }

  return generated;
}

/**
 * Fungsi pengacakan deterministik berbasis seed (Mulberry32 PRNG)
 * yang juga memastikan dua item berurutan sedapat mungkin berasal dari kategori berbeda
 * sehingga daftar 350 FAQ benar-benar tampak acak campuran lintas kategori!
 */
export function shuffleSupportFaqsList(
  items: SupportFaqItem[],
  seed = 20261121
): SupportFaqItem[] {
  const arr = [...items];
  let a = seed >>> 0;
  const nextRand = () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  // Pass kedua ringan: jika ada 2 item bersebelahan dengan kategori yang sama,
  // tukar dengan item terdekat yang kategorinya berbeda agar 100% selang-seling acak
  for (let i = 1; i < arr.length; i++) {
    if (arr[i].category === arr[i - 1].category) {
      for (let k = i + 1; k < Math.min(i + 15, arr.length); k++) {
        if (arr[k].category !== arr[i - 1].category) {
          const tmp = arr[i];
          arr[i] = arr[k];
          arr[k] = tmp;
          break;
        }
      }
    }
  }

  return arr;
}

/**
 * Menggabungkan 50 FAQ utama dengan 300 FAQ tambahan menjadi tepat 350 FAQ
 * yang teracak secara merata lintas seluruh kategori.
 */
export function buildRandomized350SupportFaqs(
  first50: SupportFaqItem[]
): SupportFaqItem[] {
  const additional300 = generateAdditional300SupportFaqs();
  const combined350 = [...first50, ...additional300];
  return shuffleSupportFaqsList(combined350, 88421973);
}

/**
 * Meng-upgrade daftar FAQ lama (mis. perangkat yang masih menyimpan 50 FAQ lama)
 * menjadi 350 FAQ acak terbaru TANPA menghapus FAQ buatan/editan Admin.
 */
export function ensureUpgraded350SupportFaqs(
  savedFaqs: SupportFaqItem[] | undefined | null,
  default350: SupportFaqItem[]
): SupportFaqItem[] {
  if (!Array.isArray(savedFaqs) || savedFaqs.length === 0) {
    return default350.map((item) => ({ ...item, steps: [...item.steps] }));
  }

  // Jika jumlah FAQ yang tersimpan sudah >= 300, hormati urutan & isi yang sudah ada
  if (savedFaqs.length >= 300) {
    return savedFaqs;
  }

  // Jika masih <= 60 (berarti masih versi 50 FAQ lama), pertahankan semua item yang pernah
  // diedit atau ditambahkan Admin, lalu lengkapi hingga 350 FAQ acak terbaru!
  const savedById = new Map<string, SupportFaqItem>();
  const customAdminItems: SupportFaqItem[] = [];
  const defaultIdSet = new Set(default350.map((d) => d.id));

  for (const item of savedFaqs) {
    if (!item || !item.id) continue;
    if (!defaultIdSet.has(item.id) || item.isCustomAdmin) {
      customAdminItems.push(item);
    } else {
      savedById.set(item.id, item);
    }
  }

  const mergedBase = default350.map((defItem) => {
    const existing = savedById.get(defItem.id);
    if (existing && existing.updatedAt) {
      return existing;
    }
    return { ...defItem, steps: [...defItem.steps] };
  });

  return [...customAdminItems, ...mergedBase];
}
