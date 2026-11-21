/**
 * Offline Fallback Dataset for All 38 Indonesian Provinces, Major Regencies, Districts, Villages,
 * Indonesian Postal Code Lookup & Official KTP Address Formatter.
 */
import { StructuredIndonesiaAddress } from '../types/bank';

export interface RegionItem {
  code: string;
  name: string;
  postalCode?: string;
}

// 38 Provinsi Resmi Republik Indonesia (Kepmendagri terbaru termasuk 4 DOB Papua)
export const OFFLINE_PROVINCES_38: RegionItem[] = [
  { code: '11', name: 'Aceh' },
  { code: '12', name: 'Sumatera Utara' },
  { code: '13', name: 'Sumatera Barat' },
  { code: '14', name: 'Riau' },
  { code: '15', name: 'Jambi' },
  { code: '16', name: 'Sumatera Selatan' },
  { code: '17', name: 'Bengkulu' },
  { code: '18', name: 'Lampung' },
  { code: '19', name: 'Kepulauan Bangka Belitung' },
  { code: '21', name: 'Kepulauan Riau' },
  { code: '31', name: 'DKI Jakarta' },
  { code: '32', name: 'Jawa Barat' },
  { code: '33', name: 'Jawa Tengah' },
  { code: '34', name: 'Daerah Istimewa Yogyakarta' },
  { code: '35', name: 'Jawa Timur' },
  { code: '36', name: 'Banten' },
  { code: '51', name: 'Bali' },
  { code: '52', name: 'Nusa Tenggara Barat' },
  { code: '53', name: 'Nusa Tenggara Timur' },
  { code: '61', name: 'Kalimantan Barat' },
  { code: '62', name: 'Kalimantan Tengah' },
  { code: '63', name: 'Kalimantan Selatan' },
  { code: '64', name: 'Kalimantan Timur' },
  { code: '65', name: 'Kalimantan Utara' },
  { code: '71', name: 'Sulawesi Utara' },
  { code: '72', name: 'Sulawesi Tengah' },
  { code: '73', name: 'Sulawesi Selatan' },
  { code: '74', name: 'Sulawesi Tenggara' },
  { code: '75', name: 'Gorontalo' },
  { code: '76', name: 'Sulawesi Barat' },
  { code: '81', name: 'Maluku' },
  { code: '82', name: 'Maluku Utara' },
  { code: '91', name: 'Papua' },
  { code: '92', name: 'Papua Barat' },
  { code: '93', name: 'Papua Selatan' },
  { code: '94', name: 'Papua Tengah' },
  { code: '95', name: 'Papua Pegunungan' },
  { code: '96', name: 'Papua Barat Daya' },
];

// Cadangan Kabupaten/Kota untuk setiap 38 Provinsi saat offline
export const OFFLINE_REGENCIES_BY_PROVINCE: Record<string, RegionItem[]> = {
  '11': [
    { code: '11.71', name: 'Kota Banda Aceh', postalCode: '23111' },
    { code: '11.06', name: 'Kabupaten Aceh Besar', postalCode: '23351' },
    { code: '11.73', name: 'Kota Lhokseumawe', postalCode: '24311' },
  ],
  '12': [
    { code: '12.71', name: 'Kota Medan', postalCode: '20111' },
    { code: '12.07', name: 'Kabupaten Deli Serdang', postalCode: '20511' },
    { code: '12.75', name: 'Kota Binjai', postalCode: '20711' },
    { code: '12.72', name: 'Kota Pematangsiantar', postalCode: '21111' },
  ],
  '13': [
    { code: '13.71', name: 'Kota Padang', postalCode: '25111' },
    { code: '13.75', name: 'Kota Bukittinggi', postalCode: '26111' },
    { code: '13.06', name: 'Kabupaten Agam', postalCode: '26411' },
  ],
  '14': [
    { code: '14.71', name: 'Kota Pekanbaru', postalCode: '28111' },
    { code: '14.72', name: 'Kota Dumai', postalCode: '28811' },
    { code: '14.01', name: 'Kabupaten Kampar', postalCode: '28411' },
  ],
  '15': [
    { code: '15.71', name: 'Kota Jambi', postalCode: '36111' },
    { code: '15.05', name: 'Kabupaten Muaro Jambi', postalCode: '36381' },
  ],
  '16': [
    { code: '16.71', name: 'Kota Palembang', postalCode: '30111' },
    { code: '16.73', name: 'Kota Lubuklinggau', postalCode: '31611' },
    { code: '16.07', name: 'Kabupaten Banyuasin', postalCode: '30911' },
  ],
  '17': [
    { code: '17.71', name: 'Kota Bengkulu', postalCode: '38111' },
    { code: '17.02', name: 'Kabupaten Rejang Lebong', postalCode: '39111' },
  ],
  '18': [
    { code: '18.71', name: 'Kota Bandar Lampung', postalCode: '35111' },
    { code: '18.72', name: 'Kota Metro', postalCode: '34111' },
    { code: '18.01', name: 'Kabupaten Lampung Selatan', postalCode: '35511' },
  ],
  '19': [
    { code: '19.71', name: 'Kota Pangkalpinang', postalCode: '33111' },
    { code: '19.01', name: 'Kabupaten Bangka', postalCode: '33211' },
  ],
  '21': [
    { code: '21.71', name: 'Kota Batam', postalCode: '29411' },
    { code: '21.72', name: 'Kota Tanjungpinang', postalCode: '29111' },
  ],
  '31': [
    { code: '31.71', name: 'Kota Administrasi Jakarta Pusat', postalCode: '10110' },
    { code: '31.72', name: 'Kota Administrasi Jakarta Utara', postalCode: '14110' },
    { code: '31.73', name: 'Kota Administrasi Jakarta Barat', postalCode: '11110' },
    { code: '31.74', name: 'Kota Administrasi Jakarta Selatan', postalCode: '12110' },
    { code: '31.75', name: 'Kota Administrasi Jakarta Timur', postalCode: '13110' },
    { code: '31.01', name: 'Kabupaten Administrasi Kepulauan Seribu', postalCode: '14510' },
  ],
  '32': [
    { code: '32.73', name: 'Kota Bandung', postalCode: '40111' },
    { code: '32.04', name: 'Kabupaten Bandung', postalCode: '40911' },
    { code: '32.75', name: 'Kota Bekasi', postalCode: '17111' },
    { code: '32.16', name: 'Kabupaten Bekasi', postalCode: '17510' },
    { code: '32.76', name: 'Kota Depok', postalCode: '16411' },
    { code: '32.71', name: 'Kota Bogor', postalCode: '16111' },
    { code: '32.01', name: 'Kabupaten Bogor', postalCode: '16911' },
    { code: '32.74', name: 'Kota Cirebon', postalCode: '45111' },
    { code: '32.15', name: 'Kabupaten Karawang', postalCode: '41311' },
  ],
  '33': [
    { code: '33.74', name: 'Kota Semarang', postalCode: '50134' },
    { code: '33.72', name: 'Kota Surakarta', postalCode: '57111' },
    { code: '33.02', name: 'Kabupaten Banyumas', postalCode: '53111' },
    { code: '33.71', name: 'Kota Magelang', postalCode: '56111' },
    { code: '33.75', name: 'Kota Pekalongan', postalCode: '51111' },
    { code: '33.76', name: 'Kota Tegal', postalCode: '52111' },
    { code: '33.19', name: 'Kabupaten Kudus', postalCode: '59311' },
    { code: '33.10', name: 'Kabupaten Klaten', postalCode: '57411' },
  ],
  '34': [
    { code: '34.71', name: 'Kota Yogyakarta', postalCode: '55111' },
    { code: '34.04', name: 'Kabupaten Sleman', postalCode: '55511' },
    { code: '34.02', name: 'Kabupaten Bantul', postalCode: '55711' },
    { code: '34.01', name: 'Kabupaten Kulon Progo', postalCode: '55611' },
    { code: '34.03', name: 'Kabupaten Gunungkidul', postalCode: '55811' },
  ],
  '35': [
    { code: '35.78', name: 'Kota Surabaya', postalCode: '60111' },
    { code: '35.73', name: 'Kota Malang', postalCode: '65111' },
    { code: '35.15', name: 'Kabupaten Sidoarjo', postalCode: '61211' },
    { code: '35.25', name: 'Kabupaten Gresik', postalCode: '61111' },
    { code: '35.71', name: 'Kota Kediri', postalCode: '64111' },
    { code: '35.09', name: 'Kabupaten Jember', postalCode: '68111' },
    { code: '35.10', name: 'Kabupaten Banyuwangi', postalCode: '68411' },
  ],
  '36': [
    { code: '36.71', name: 'Kota Tangerang', postalCode: '15111' },
    { code: '36.74', name: 'Kota Tangerang Selatan', postalCode: '15310' },
    { code: '36.03', name: 'Kabupaten Tangerang', postalCode: '15710' },
    { code: '36.73', name: 'Kota Serang', postalCode: '42111' },
    { code: '36.72', name: 'Kota Cilegon', postalCode: '42411' },
  ],
  '51': [
    { code: '51.71', name: 'Kota Denpasar', postalCode: '80111' },
    { code: '51.03', name: 'Kabupaten Badung', postalCode: '80351' },
    { code: '51.04', name: 'Kabupaten Gianyar', postalCode: '80511' },
  ],
  '52': [
    { code: '52.71', name: 'Kota Mataram', postalCode: '83111' },
    { code: '52.02', name: 'Kabupaten Lombok Tengah', postalCode: '83511' },
  ],
  '53': [
    { code: '53.71', name: 'Kota Kupang', postalCode: '85111' },
    { code: '53.15', name: 'Kabupaten Manggarai Barat', postalCode: '86754' },
  ],
  '61': [
    { code: '61.71', name: 'Kota Pontianak', postalCode: '78111' },
    { code: '61.72', name: 'Kota Singkawang', postalCode: '79111' },
  ],
  '62': [
    { code: '62.71', name: 'Kota Palangka Raya', postalCode: '73111' },
    { code: '62.02', name: 'Kabupaten Kotawaringin Timur', postalCode: '74311' },
  ],
  '63': [
    { code: '63.71', name: 'Kota Banjarmasin', postalCode: '70111' },
    { code: '63.72', name: 'Kota Banjarbaru', postalCode: '70711' },
  ],
  '64': [
    { code: '64.72', name: 'Kota Samarinda', postalCode: '75111' },
    { code: '64.71', name: 'Kota Balikpapan', postalCode: '76111' },
    { code: '64.09', name: 'Kabupaten Penajam Paser Utara', postalCode: '76141' },
  ],
  '65': [
    { code: '65.71', name: 'Kota Tarakan', postalCode: '77111' },
    { code: '65.01', name: 'Kabupaten Bulungan', postalCode: '77211' },
  ],
  '71': [
    { code: '71.71', name: 'Kota Manado', postalCode: '95111' },
    { code: '71.72', name: 'Kota Bitung', postalCode: '95511' },
  ],
  '72': [
    { code: '72.71', name: 'Kota Palu', postalCode: '94111' },
    { code: '72.01', name: 'Kabupaten Banggai', postalCode: '94711' },
  ],
  '73': [
    { code: '73.71', name: 'Kota Makassar', postalCode: '90111' },
    { code: '73.06', name: 'Kabupaten Gowa', postalCode: '92111' },
    { code: '73.72', name: 'Kota Parepare', postalCode: '91111' },
  ],
  '74': [
    { code: '74.71', name: 'Kota Kendari', postalCode: '93111' },
    { code: '74.72', name: 'Kota Baubau', postalCode: '93711' },
  ],
  '75': [
    { code: '75.71', name: 'Kota Gorontalo', postalCode: '96111' },
    { code: '75.01', name: 'Kabupaten Gorontalo', postalCode: '96211' },
  ],
  '76': [
    { code: '76.02', name: 'Kabupaten Mamuju', postalCode: '91511' },
    { code: '76.04', name: 'Kabupaten Polewali Mandar', postalCode: '91311' },
  ],
  '81': [
    { code: '81.71', name: 'Kota Ambon', postalCode: '97111' },
    { code: '81.01', name: 'Kabupaten Maluku Tengah', postalCode: '97511' },
  ],
  '82': [
    { code: '82.71', name: 'Kota Ternate', postalCode: '97711' },
    { code: '82.72', name: 'Kota Tidore Kepulauan', postalCode: '97811' },
  ],
  '91': [
    { code: '91.71', name: 'Kota Jayapura', postalCode: '99111' },
    { code: '91.03', name: 'Kabupaten Jayapura', postalCode: '99352' },
  ],
  '92': [
    { code: '92.02', name: 'Kabupaten Manokwari', postalCode: '98311' },
    { code: '92.03', name: 'Kabupaten Fakfak', postalCode: '98611' },
  ],
  '93': [
    { code: '93.01', name: 'Kabupaten Merauke', postalCode: '99611' },
    { code: '93.02', name: 'Kabupaten Boven Digoel', postalCode: '99663' },
  ],
  '94': [
    { code: '94.01', name: 'Kabupaten Nabire', postalCode: '98811' },
    { code: '94.04', name: 'Kabupaten Mimika', postalCode: '99910' },
  ],
  '95': [
    { code: '95.01', name: 'Kabupaten Jayawijaya', postalCode: '99511' },
    { code: '95.02', name: 'Kabupaten Pegunungan Bintang', postalCode: '99573' },
  ],
  '96': [
    { code: '96.71', name: 'Kota Sorong', postalCode: '98411' },
    { code: '96.01', name: 'Kabupaten Sorong', postalCode: '98451' },
  ],
};

// Cadangan Kecamatan populer saat offline
export const OFFLINE_DISTRICTS_BY_REGENCY: Record<string, RegionItem[]> = {
  '31.71': [
    { code: '31.71.01', name: 'Gambir', postalCode: '10110' },
    { code: '31.71.06', name: 'Menteng', postalCode: '10310' },
    { code: '31.71.07', name: 'Tanah Abang', postalCode: '10210' },
  ],
  '31.74': [
    { code: '31.74.07', name: 'Kebayoran Baru', postalCode: '12110' },
    { code: '31.74.01', name: 'Tebet', postalCode: '12810' },
    { code: '31.74.02', name: 'Setiabudi', postalCode: '12910' },
  ],
  '32.73': [
    { code: '32.73.05', name: 'Sumur Bandung', postalCode: '40111' },
    { code: '32.73.02', name: 'Coblong', postalCode: '40132' },
    { code: '32.73.09', name: 'Bandung Wetan', postalCode: '40114' },
  ],
  '32.75': [
    { code: '32.75.04', name: 'Bekasi Selatan', postalCode: '17141' },
    { code: '32.75.02', name: 'Bekasi Barat', postalCode: '17134' },
  ],
  '33.74': [
    { code: '33.74.01', name: 'Semarang Tengah', postalCode: '50134' },
    { code: '33.74.11', name: 'Banyumanik', postalCode: '50264' },
    { code: '33.74.10', name: 'Tembalang', postalCode: '50275' },
  ],
  '33.72': [
    { code: '33.72.01', name: 'Laweyan', postalCode: '57141' },
    { code: '33.72.05', name: 'Banjarsari', postalCode: '57131' },
  ],
  '34.71': [
    { code: '34.71.04', name: 'Danurejan', postalCode: '55213' },
    { code: '34.71.03', name: 'Gondokusuman', postalCode: '55221' },
  ],
  '35.78': [
    { code: '35.78.07', name: 'Genteng', postalCode: '60275' },
    { code: '35.78.04', name: 'Wonokromo', postalCode: '60241' },
    { code: '35.78.08', name: 'Gubeng', postalCode: '60281' },
  ],
  '51.71': [
    { code: '51.71.02', name: 'Denpasar Timur', postalCode: '80239' },
    { code: '51.71.01', name: 'Denpasar Selatan', postalCode: '80221' },
  ],
};

// Cadangan Desa/Kelurahan saat offline
export const OFFLINE_VILLAGES_BY_DISTRICT: Record<string, RegionItem[]> = {
  '31.71.06': [
    { code: '31.71.06.1001', name: 'Menteng', postalCode: '10310' },
    { code: '31.71.06.1002', name: 'Pegangsaan', postalCode: '10320' },
    { code: '31.71.06.1003', name: 'Cikini', postalCode: '10330' },
  ],
  '31.74.07': [
    { code: '31.74.07.1007', name: 'Senayan', postalCode: '12190' },
    { code: '31.74.07.1001', name: 'Melawai', postalCode: '12160' },
    { code: '31.74.07.1003', name: 'Selong', postalCode: '12110' },
  ],
  '32.73.05': [
    { code: '32.73.05.1001', name: 'Braga', postalCode: '40111' },
    { code: '32.73.05.1002', name: 'Kebon Pisang', postalCode: '40112' },
    { code: '32.73.05.1003', name: 'Merdeka', postalCode: '40113' },
  ],
  '33.74.01': [
    { code: '33.74.01.1001', name: 'Pekunden', postalCode: '50134' },
    { code: '33.74.01.1005', name: 'Miroto', postalCode: '50134' },
    { code: '33.74.01.1011', name: 'Sekayu', postalCode: '50132' },
  ],
  '35.78.07': [
    { code: '35.78.07.1001', name: 'Genteng', postalCode: '60275' },
    { code: '35.78.07.1002', name: 'Embong Kaliasin', postalCode: '60271' },
    { code: '35.78.07.1003', name: 'Ketabang', postalCode: '60272' },
  ],
};

// Prefix & Default Kode Pos resmi Indonesia per kode provinsi (2 digit)
export const PROVINCE_DEFAULT_POSTAL_CODE: Record<string, string> = {
  '11': '23111',
  '12': '20111',
  '13': '25111',
  '14': '28111',
  '15': '36111',
  '16': '30111',
  '17': '38111',
  '18': '35111',
  '19': '33111',
  '21': '29111',
  '31': '10110',
  '32': '40111',
  '33': '50134',
  '34': '55111',
  '35': '60111',
  '36': '15111',
  '51': '80111',
  '52': '83111',
  '53': '85111',
  '61': '78111',
  '62': '73111',
  '63': '70111',
  '64': '75111',
  '65': '77111',
  '71': '95111',
  '72': '94111',
  '73': '90111',
  '74': '93111',
  '75': '96111',
  '76': '91511',
  '81': '97111',
  '82': '97711',
  '91': '99111',
  '92': '98311',
  '93': '99611',
  '94': '98811',
  '95': '99511',
  '96': '98411',
};

// Pemetaan kata kunci nama Kabupaten/Kota -> Kode Pos default Indonesia (fallback cepat offline)
const REGENCY_KEYWORD_POSTAL: Array<[string, string]> = [
  ['jakarta pusat', '10110'],
  ['jakarta barat', '11110'],
  ['jakarta selatan', '12110'],
  ['jakarta timur', '13110'],
  ['jakarta utara', '14110'],
  ['kepulauan seribu', '14510'],
  ['tangerang selatan', '15310'],
  ['kota tangerang', '15111'],
  ['tangerang', '15710'],
  ['bogor', '16111'],
  ['depok', '16411'],
  ['kota bekasi', '17111'],
  ['bekasi', '17510'],
  ['medan', '20111'],
  ['deli serdang', '20511'],
  ['binjai', '20711'],
  ['banda aceh', '23111'],
  ['padang', '25111'],
  ['bukittinggi', '26111'],
  ['pekanbaru', '28111'],
  ['batam', '29411'],
  ['tanjungpinang', '29111'],
  ['palembang', '30111'],
  ['pangkalpinang', '33111'],
  ['bandar lampung', '35111'],
  ['jambi', '36111'],
  ['bengkulu', '38111'],
  ['kota bandung', '40111'],
  ['bandung barat', '40552'],
  ['bandung', '40911'],
  ['cimahi', '40511'],
  ['karawang', '41311'],
  ['purwakarta', '41111'],
  ['subang', '41211'],
  ['serang', '42111'],
  ['cilegon', '42411'],
  ['sukabumi', '43111'],
  ['cianjur', '43211'],
  ['garut', '44111'],
  ['cirebon', '45111'],
  ['indramayu', '45211'],
  ['majalengka', '45411'],
  ['kuningan', '45511'],
  ['tasikmalaya', '46111'],
  ['ciamis', '46211'],
  ['semarang', '50134'],
  ['salatiga', '50711'],
  ['pekalongan', '51111'],
  ['batang', '51211'],
  ['kendal', '51311'],
  ['tegal', '52111'],
  ['brebes', '52211'],
  ['pemalang', '52311'],
  ['banyumas', '53111'],
  ['cilacap', '53211'],
  ['purbalingga', '53311'],
  ['banjarnegara', '53411'],
  ['kebumen', '54311'],
  ['purworejo', '54111'],
  ['wonosobo', '56311'],
  ['temanggung', '56211'],
  ['magelang', '56111'],
  ['yogyakarta', '55111'],
  ['sleman', '55511'],
  ['bantul', '55711'],
  ['kulon progo', '55611'],
  ['gunungkidul', '55811'],
  ['surakarta', '57111'],
  ['solo', '57111'],
  ['boyolali', '57311'],
  ['klaten', '57411'],
  ['sukoharjo', '57511'],
  ['wonogiri', '57611'],
  ['karanganyar', '57711'],
  ['sragen', '57211'],
  ['grobogan', '58111'],
  ['blora', '58211'],
  ['pati', '59111'],
  ['rembang', '59211'],
  ['kudus', '59311'],
  ['jepara', '59411'],
  ['demak', '59511'],
  ['surabaya', '60111'],
  ['gresik', '61111'],
  ['sidoarjo', '61211'],
  ['mojokerto', '61311'],
  ['jombang', '61411'],
  ['bojonegoro', '62111'],
  ['lamongan', '62211'],
  ['tuban', '62311'],
  ['madiun', '63111'],
  ['magetan', '63311'],
  ['ngawi', '63211'],
  ['ponorogo', '63411'],
  ['pacitan', '63511'],
  ['kediri', '64111'],
  ['nganjuk', '64411'],
  ['malang', '65111'],
  ['batu', '65311'],
  ['blitar', '66111'],
  ['tulungagung', '66211'],
  ['trenggalek', '66311'],
  ['pasuruan', '67111'],
  ['probolinggo', '67211'],
  ['lumajang', '67311'],
  ['jember', '68111'],
  ['bondowoso', '68211'],
  ['situbondo', '68311'],
  ['banyuwangi', '68411'],
  ['bangkalan', '69111'],
  ['sampang', '69211'],
  ['pamekasan', '69311'],
  ['sumenep', '69411'],
  ['banjarmasin', '70111'],
  ['banjarbaru', '70711'],
  ['palangka raya', '73111'],
  ['samarinda', '75111'],
  ['balikpapan', '76111'],
  ['penajam paser utara', '76141'],
  ['tarakan', '77111'],
  ['pontianak', '78111'],
  ['singkawang', '79111'],
  ['denpasar', '80111'],
  ['badung', '80351'],
  ['gianyar', '80511'],
  ['tabanan', '82111'],
  ['buleleng', '81111'],
  ['mataram', '83111'],
  ['lombok', '83511'],
  ['kupang', '85111'],
  ['makassar', '90111'],
  ['parepare', '91111'],
  ['gowa', '92111'],
  ['kendari', '93111'],
  ['palu', '94111'],
  ['manado', '95111'],
  ['gorontalo', '96111'],
  ['ambon', '97111'],
  ['ternate', '97711'],
  ['manokwari', '98311'],
  ['sorong', '98411'],
  ['nabire', '98811'],
  ['jayapura', '99111'],
  ['merauke', '99611'],
  ['mimika', '99910'],
  ['jayawijaya', '99511'],
];

export function normalizeRegionCode(code: string): string {
  return String(code || '').trim();
}

export function resolveOfflinePostalCode(params: {
  provinceCode?: string;
  regencyCode?: string;
  regencyName?: string;
  districtCode?: string;
  villagePostalCode?: string;
}): string {
  if (params.villagePostalCode && /^\d{5}$/.test(params.villagePostalCode.trim())) {
    return params.villagePostalCode.trim();
  }
  const dCode = normalizeRegionCode(params.districtCode || '');
  if (dCode) {
    for (const list of Object.values(OFFLINE_DISTRICTS_BY_REGENCY)) {
      const found = list.find((item) => item.code === dCode || item.code.replace(/\./g, '') === dCode.replace(/\./g, ''));
      if (found?.postalCode) return found.postalCode;
    }
  }
  const rCode = normalizeRegionCode(params.regencyCode || '');
  if (rCode) {
    for (const list of Object.values(OFFLINE_REGENCIES_BY_PROVINCE)) {
      const found = list.find((item) => item.code === rCode || item.code.replace(/\./g, '') === rCode.replace(/\./g, ''));
      if (found?.postalCode) return found.postalCode;
    }
  }
  const rName = (params.regencyName || '').toLowerCase();
  if (rName) {
    for (const [kw, postal] of REGENCY_KEYWORD_POSTAL) {
      if (rName.includes(kw)) return postal;
    }
  }
  const pPrefix = (params.provinceCode || rCode || '').replace(/\D/g, '').slice(0, 2);
  if (pPrefix && PROVINCE_DEFAULT_POSTAL_CODE[pPrefix]) {
    return PROVINCE_DEFAULT_POSTAL_CODE[pPrefix];
  }
  return '';
}

export function padRtRw3(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  return digits.padStart(3, '0');
}

export function createEmptyStructuredAddress(): StructuredIndonesiaAddress {
  return {
    provinceCode: '',
    provinceName: '',
    regencyCode: '',
    regencyName: '',
    districtCode: '',
    districtName: '',
    villageCode: '',
    villageName: '',
    postalCode: '',
    rt: '',
    rw: '',
    streetAddress: '',
  };
}

/**
 * Format Resmi KTP Lengkap:
 * [Jl. ..., ]RT 001/RW 005, Desa/Kel. ..., Kec. ..., Kab./Kota ..., Prov. ..., Kode Pos XXXXX
 */
export function formatStructuredAddressKtp(addr?: StructuredIndonesiaAddress | null): string {
  if (!addr) return '';
  const parts: string[] = [];

  const street = (addr.streetAddress || '').trim();
  if (street) {
    parts.push(street);
  }

  const rtClean = padRtRw3(addr.rt);
  const rwClean = padRtRw3(addr.rw);
  if (rtClean || rwClean) {
    parts.push(`RT ${rtClean || '000'}/RW ${rwClean || '000'}`);
  }

  const village = (addr.villageName || '').trim();
  if (village) {
    parts.push(/^desa\b|^kel\./i.test(village) ? village : `Desa/Kel. ${village}`);
  }

  const district = (addr.districtName || '').trim();
  if (district) {
    parts.push(/^kec\./i.test(district) ? district : `Kec. ${district}`);
  }

  const regency = (addr.regencyName || '').trim();
  if (regency) {
    parts.push(regency);
  }

  const province = (addr.provinceName || '').trim();
  if (province) {
    parts.push(/^prov\./i.test(province) ? province : `Prov. ${province}`);
  }

  const postal = (addr.postalCode || '').replace(/\D/g, '').slice(0, 5);
  if (postal) {
    parts.push(`Kode Pos ${postal}`);
  }

  return parts.join(', ');
}

export function validateStructuredAddress(
  addr?: StructuredIndonesiaAddress | null
): { valid: boolean; message?: string } {
  if (!addr) {
    return { valid: false, message: 'Harap lengkapi pilihan alamat wilayah Indonesia terlebih dahulu.' };
  }
  if (!addr.provinceName.trim()) {
    return { valid: false, message: 'Langkah 1: Provinsi wajib dipilih terlebih dahulu.' };
  }
  if (!addr.regencyName.trim()) {
    return { valid: false, message: 'Langkah 2: Kabupaten / Kota wajib dipilih.' };
  }
  if (!addr.districtName.trim()) {
    return { valid: false, message: 'Langkah 3: Kecamatan wajib dipilih.' };
  }
  if (!addr.villageName.trim()) {
    return { valid: false, message: 'Langkah 4: Desa / Kelurahan wajib dipilih atau diisi manual.' };
  }
  const cleanPostal = (addr.postalCode || '').replace(/\D/g, '');
  if (cleanPostal.length !== 5) {
    return { valid: false, message: 'Langkah 5: Kode Pos wajib 5 digit angka.' };
  }
  const cleanRt = (addr.rt || '').replace(/\D/g, '');
  const cleanRw = (addr.rw || '').replace(/\D/g, '');
  if (!cleanRt || !cleanRw) {
    return { valid: false, message: 'Langkah 6: RT dan RW wajib diisi (angka 1–3 digit, contoh 001 dan 005).' };
  }
  return { valid: true };
}
