/**
 * Komponen Pemilih Alamat Wilayah Indonesia Berjenjang (38 Provinsi hingga Desa/Kelurahan)
 * - Alur urut ketat dari atas:
 *   1. Provinsi (38 Provinsi Indonesia)
 *   2. Kabupaten / Kota (hanya milik Provinsi terpilih -> otomatis isi Kode Pos awal)
 *   3. Kecamatan (hanya milik Kabupaten/Kota terpilih -> otomatis perbarui Kode Pos)
 *   4. Desa / Kelurahan (hanya milik Kecamatan terpilih -> otomatis perbarui Kode Pos paling akurat)
 *   5. Kode Pos (5 digit otomatis terisi dan tetap dapat diedit manual)
 *   6. RT & RW (2 kotak angka terpisah 3 digit, wajib diisi)
 *   7. Alamat Jalan / Nomor Rumah / Patokan (opsional)
 * - Opsi Ketik Manual pada Kabupaten/Kecamatan/Desa bila desa pemekaran baru atau sedang offline.
 * - Opsi Tab Peta Google Maps (Opsional) di samping Tab Wilayah Indonesia (Utama).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapPin,
  Search,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Edit3,
  ListFilter,
  Compass,
  Lock,
} from 'lucide-react';
import { StructuredIndonesiaAddress } from '../types/bank';
import {
  fetchProvinces,
  fetchRegencies,
  fetchDistricts,
  fetchVillages,
  lookupAutoPostalCode,
  type RegionItem,
} from '../services/indonesiaRegionService';
import {
  createEmptyStructuredAddress,
  formatStructuredAddressKtp,
  padRtRw3,
  validateStructuredAddress,
} from '../data/indonesiaRegionsOffline';
import { GoogleMapsAddressPicker } from './GoogleMapsAddressPicker';

interface SearchableRegionSelectProps {
  stepNumber: number;
  label: string;
  placeholder: string;
  lockedHint: string;
  valueName: string;
  valueCode: string;
  options: RegionItem[];
  disabled: boolean;
  loading: boolean;
  allowManualToggle?: boolean;
  isManualMode?: boolean;
  onToggleManual?: () => void;
  onSelect: (item: RegionItem) => void;
  onManualChange?: (text: string) => void;
}

const SearchableRegionSelect: React.FC<SearchableRegionSelectProps> = ({
  stepNumber,
  label,
  placeholder,
  lockedHint,
  valueName,
  valueCode,
  options,
  disabled,
  loading,
  allowManualToggle = false,
  isManualMode = false,
  onToggleManual,
  onSelect,
  onManualChange,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery('');
      window.setTimeout(() => searchRef.current?.focus(), 20);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between gap-2 mb-1">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="font-mono tabular-nums text-cyan-400">{stepNumber}.</span>
          <span>{label}</span>
          <span className="text-rose-400">*</span>
        </label>
        {allowManualToggle && !disabled && onToggleManual && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onToggleManual();
            }}
            className="text-[10px] font-semibold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isManualMode ? (
              <>
                <ListFilter className="w-3 h-3" />
                <span>Pilih dari Daftar</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3" />
                <span>Ketik Manual</span>
              </>
            )}
          </button>
        )}
      </div>

      {isManualMode && !disabled ? (
        <input
          type="text"
          value={valueName}
          onChange={(e) => onManualChange?.(e.target.value)}
          placeholder={`Ketik nama ${label.toLowerCase()} secara manual...`}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-amber-500/60 text-xs text-white focus:border-amber-400 focus:outline-none"
        />
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
          className={`w-full px-3 py-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 transition-colors ${
            disabled
              ? 'bg-slate-950/40 border-slate-800/80 text-slate-500 cursor-not-allowed'
              : open
              ? 'bg-slate-950 border-cyan-400 text-white cursor-pointer'
              : valueName
              ? 'bg-slate-950 border-emerald-500/45 text-white hover:border-cyan-400 cursor-pointer'
              : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500 cursor-pointer'
          }`}
        >
          <span className="truncate font-medium">
            {disabled ? lockedHint : loading ? `Memuat ${label}...` : valueName || placeholder}
          </span>
          <span className="shrink-0 flex items-center gap-1 text-slate-400">
            {disabled ? (
              <Lock className="w-3.5 h-3.5 text-slate-600" />
            ) : loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open ? 'rotate-180 text-cyan-400' : ''}`}
              />
            )}
          </span>
        </button>
      )}

      {open && !disabled && !isManualMode && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-slate-800 bg-slate-950/90">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Cari ${label.toLowerCase()}...`}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Mengambil data wilayah Indonesia...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-3.5 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  {options.length === 0
                    ? `Daftar ${label.toLowerCase()} belum tersedia untuk wilayah ini.`
                    : `Tidak ditemukan hasil untuk "${query}".`}
                </p>
                {allowManualToggle && onToggleManual && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onToggleManual();
                      if (query.trim()) onManualChange?.(query.trim());
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-semibold cursor-pointer"
                  >
                    Ketik {label} Secara Manual
                  </button>
                )}
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected =
                  (valueCode && item.code === valueCode) ||
                  item.name.toLowerCase() === valueName.toLowerCase();
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-200 font-semibold'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    {item.postalCode && (
                      <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                        {item.postalCode}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface IndonesiaAddressPickerProps {
  value: StructuredIndonesiaAddress;
  formattedAddress: string;
  onChange: (formattedAddress: string, structured: StructuredIndonesiaAddress) => void;
  enableGoogleMapsTab?: boolean;
  label?: string;
  compact?: boolean;
}

export const IndonesiaAddressPicker: React.FC<IndonesiaAddressPickerProps> = ({
  value,
  formattedAddress,
  onChange,
  enableGoogleMapsTab = false,
  label = 'Alamat Domisili Lengkap (Wilayah Indonesia)',
  compact = false,
}) => {
  const safeVal: StructuredIndonesiaAddress = value || createEmptyStructuredAddress();
  const [activeTab, setActiveTab] = useState<'region' | 'maps'>('region');

  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingPostal, setLoadingPostal] = useState(false);
  const [postalAutoNote, setPostalAutoNote] = useState<string>('');
  const [dataSourceLabel, setDataSourceLabel] = useState<'api' | 'offline'>('api');

  const [manualRegency, setManualRegency] = useState(false);
  const [manualDistrict, setManualDistrict] = useState(false);
  const [manualVillage, setManualVillage] = useState(false);

  const postalLookupSeqRef = useRef(0);

  // 1. Muat 38 Provinsi Indonesia saat pertama kali tampil
  useEffect(() => {
    let active = true;
    setLoadingProvinces(true);
    void fetchProvinces().then((res) => {
      if (!active) return;
      setProvinces(res.items);
      setDataSourceLabel(res.source);
      setLoadingProvinces(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // 2. Muat Kabupaten/Kota saat Provinsi berubah
  useEffect(() => {
    if (!safeVal.provinceCode) {
      setRegencies([]);
      return;
    }
    let active = true;
    setLoadingRegencies(true);
    void fetchRegencies(safeVal.provinceCode).then((res) => {
      if (!active) return;
      setRegencies(res.items);
      setLoadingRegencies(false);
    });
    return () => {
      active = false;
    };
  }, [safeVal.provinceCode]);

  // 3. Muat Kecamatan saat Kabupaten/Kota berubah
  useEffect(() => {
    if (!safeVal.regencyCode || manualRegency) {
      setDistricts([]);
      return;
    }
    let active = true;
    setLoadingDistricts(true);
    void fetchDistricts(safeVal.regencyCode).then((res) => {
      if (!active) return;
      setDistricts(res.items);
      setLoadingDistricts(false);
    });
    return () => {
      active = false;
    };
  }, [safeVal.regencyCode, manualRegency]);

  // 4. Muat Desa/Kelurahan saat Kecamatan berubah
  useEffect(() => {
    if (!safeVal.districtCode || manualDistrict) {
      setVillages([]);
      return;
    }
    let active = true;
    setLoadingVillages(true);
    void fetchVillages(safeVal.districtCode).then((res) => {
      if (!active) return;
      setVillages(res.items);
      setLoadingVillages(false);
    });
    return () => {
      active = false;
    };
  }, [safeVal.districtCode, manualDistrict]);

  const emitUpdate = (next: StructuredIndonesiaAddress) => {
    onChange(formatStructuredAddressKtp(next), next);
  };

  const triggerAutoPostalLookup = async (
    nextState: StructuredIndonesiaAddress,
    levelLabel: string,
    villagePostalCode?: string
  ) => {
    const seq = ++postalLookupSeqRef.current;
    setLoadingPostal(true);
    const found = await lookupAutoPostalCode({
      provinceCode: nextState.provinceCode,
      provinceName: nextState.provinceName,
      regencyCode: nextState.regencyCode,
      regencyName: nextState.regencyName,
      districtCode: nextState.districtCode,
      districtName: nextState.districtName,
      villageName: nextState.villageName,
      villagePostalCode,
    });
    if (seq !== postalLookupSeqRef.current) return;
    setLoadingPostal(false);
    if (found && /^\d{5}$/.test(found)) {
      const updated = { ...nextState, postalCode: found };
      setPostalAutoNote(`Terisi otomatis dari ${levelLabel} · dapat diedit`);
      emitUpdate(updated);
    }
  };

  const handleSelectProvince = (item: RegionItem) => {
    setManualRegency(false);
    setManualDistrict(false);
    setManualVillage(false);
    setPostalAutoNote('');
    const next: StructuredIndonesiaAddress = {
      ...createEmptyStructuredAddress(),
      provinceCode: item.code,
      provinceName: item.name,
      rt: safeVal.rt,
      rw: safeVal.rw,
      streetAddress: safeVal.streetAddress,
    };
    emitUpdate(next);
  };

  const handleSelectRegency = (item: RegionItem) => {
    setManualDistrict(false);
    setManualVillage(false);
    const next: StructuredIndonesiaAddress = {
      ...safeVal,
      regencyCode: item.code,
      regencyName: item.name,
      districtCode: '',
      districtName: '',
      villageCode: '',
      villageName: '',
      postalCode: item.postalCode || safeVal.postalCode,
    };
    emitUpdate(next);
    void triggerAutoPostalLookup(next, item.name, item.postalCode);
  };

  const handleSelectDistrict = (item: RegionItem) => {
    setManualVillage(false);
    const next: StructuredIndonesiaAddress = {
      ...safeVal,
      districtCode: item.code,
      districtName: item.name,
      villageCode: '',
      villageName: '',
      postalCode: item.postalCode || safeVal.postalCode,
    };
    emitUpdate(next);
    void triggerAutoPostalLookup(next, `Kec. ${item.name}`, item.postalCode);
  };

  const handleSelectVillage = (item: RegionItem) => {
    const next: StructuredIndonesiaAddress = {
      ...safeVal,
      villageCode: item.code,
      villageName: item.name,
      postalCode: item.postalCode || safeVal.postalCode,
    };
    emitUpdate(next);
    void triggerAutoPostalLookup(next, `Desa/Kel. ${item.name}`, item.postalCode);
  };

  const hasProvince = Boolean(safeVal.provinceName.trim());
  const hasRegency = hasProvince && Boolean(safeVal.regencyName.trim());
  const hasDistrict = hasRegency && Boolean(safeVal.districtName.trim());
  const hasVillage = hasDistrict && Boolean(safeVal.villageName.trim());

  const validation = validateStructuredAddress(safeVal);
  const ktpPreview = formatStructuredAddressKtp(safeVal);

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/75 ${
        compact ? 'p-3.5 space-y-3' : 'p-4 space-y-3.5'
      }`}
    >
      {/* Header & Optional Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Isi berurutan dari Provinsi hingga RT/RW · Kode Pos terisi otomatis ·{' '}
            {dataSourceLabel === 'api' ? '38 Provinsi Indonesia (Online)' : '38 Provinsi (Mode Offline)'}
          </p>
        </div>

        {enableGoogleMapsTab && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('region')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'region'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Wilayah Indonesia
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('maps')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'maps'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3 h-3" />
              <span>Peta Maps (Opsional)</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'maps' && enableGoogleMapsTab ? (
        <div className="space-y-2">
          <GoogleMapsAddressPicker
            value={formattedAddress}
            onChange={(addr) => {
              onChange(addr, safeVal);
            }}
            required={false}
            label="Pilih Titik Lokasi via Peta Google Maps (Opsional):"
            placeholder="Pilih titik di peta atau kembali ke tab Wilayah Indonesia untuk format resmi KTP..."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Baris 1 & 2: Provinsi -> Kabupaten/Kota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableRegionSelect
              stepNumber={1}
              label="Provinsi"
              placeholder="Pilih Provinsi (38 Provinsi)..."
              lockedHint="Pilih Provinsi..."
              valueName={safeVal.provinceName}
              valueCode={safeVal.provinceCode}
              options={provinces}
              disabled={false}
              loading={loadingProvinces}
              onSelect={handleSelectProvince}
            />

            <SearchableRegionSelect
              stepNumber={2}
              label="Kabupaten / Kota"
              placeholder="Pilih Kabupaten / Kota..."
              lockedHint="Pilih Provinsi terlebih dahulu"
              valueName={safeVal.regencyName}
              valueCode={safeVal.regencyCode}
              options={regencies}
              disabled={!hasProvince}
              loading={loadingRegencies}
              allowManualToggle={true}
              isManualMode={manualRegency}
              onToggleManual={() => {
                setManualRegency((prev) => !prev);
              }}
              onSelect={handleSelectRegency}
              onManualChange={(text) => {
                const next: StructuredIndonesiaAddress = {
                  ...safeVal,
                  regencyCode: '',
                  regencyName: text,
                  districtCode: '',
                  districtName: '',
                  villageCode: '',
                  villageName: '',
                };
                emitUpdate(next);
              }}
            />
          </div>

          {/* Baris 3 & 4: Kecamatan -> Desa/Kelurahan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SearchableRegionSelect
              stepNumber={3}
              label="Kecamatan"
              placeholder="Pilih Kecamatan..."
              lockedHint="Pilih Kabupaten / Kota terlebih dahulu"
              valueName={safeVal.districtName}
              valueCode={safeVal.districtCode}
              options={districts}
              disabled={!hasRegency}
              loading={loadingDistricts}
              allowManualToggle={true}
              isManualMode={manualDistrict || manualRegency}
              onToggleManual={() => {
                setManualDistrict((prev) => !prev);
              }}
              onSelect={handleSelectDistrict}
              onManualChange={(text) => {
                const next: StructuredIndonesiaAddress = {
                  ...safeVal,
                  districtCode: '',
                  districtName: text,
                  villageCode: '',
                  villageName: '',
                };
                emitUpdate(next);
              }}
            />

            <SearchableRegionSelect
              stepNumber={4}
              label="Desa / Kelurahan"
              placeholder="Pilih Desa / Kelurahan..."
              lockedHint="Pilih Kecamatan terlebih dahulu"
              valueName={safeVal.villageName}
              valueCode={safeVal.villageCode}
              options={villages}
              disabled={!hasDistrict}
              loading={loadingVillages}
              allowManualToggle={true}
              isManualMode={manualVillage || manualDistrict || manualRegency}
              onToggleManual={() => {
                setManualVillage((prev) => !prev);
              }}
              onSelect={handleSelectVillage}
              onManualChange={(text) => {
                const next: StructuredIndonesiaAddress = {
                  ...safeVal,
                  villageCode: '',
                  villageName: text,
                };
                emitUpdate(next);
              }}
            />
          </div>

          {/* Baris 5 & 6: Kode Pos Otomatis (Editable) + RT & RW 3 Digit Wajib */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="font-mono tabular-nums text-cyan-400">5.</span>
                  <span>Kode Pos</span>
                  <span className="text-rose-400">*</span>
                </label>
                {loadingPostal && (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                )}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                disabled={!hasRegency}
                value={safeVal.postalCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setPostalAutoNote('Kode Pos diedit manual');
                  emitUpdate({ ...safeVal, postalCode: digits });
                }}
                placeholder={hasRegency ? '5 Digit (Otomatis)' : 'Pilih Kab/Kota dulu'}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 disabled:bg-slate-950/40 disabled:border-slate-800/80 disabled:text-slate-500 text-xs font-mono tabular-nums font-bold text-amber-300 tracking-wider focus:border-amber-400 focus:outline-none"
              />
              {postalAutoNote && (
                <p className="text-[10px] text-amber-300/90 mt-1 truncate">{postalAutoNote}</p>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <span className="font-mono tabular-nums text-cyan-400">6a.</span>
                <span>RT (3 Digit)</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                disabled={!hasVillage}
                value={safeVal.rt}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                  emitUpdate({ ...safeVal, rt: digits });
                }}
                onBlur={() => {
                  if (safeVal.rt.trim()) {
                    emitUpdate({ ...safeVal, rt: padRtRw3(safeVal.rt) });
                  }
                }}
                placeholder={hasVillage ? 'Contoh: 001' : 'Pilih Desa dulu'}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 disabled:bg-slate-950/40 disabled:border-slate-800/80 disabled:text-slate-500 text-xs font-mono tabular-nums font-bold text-white tracking-widest focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <span className="font-mono tabular-nums text-cyan-400">6b.</span>
                <span>RW (3 Digit)</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                disabled={!hasVillage}
                value={safeVal.rw}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                  emitUpdate({ ...safeVal, rw: digits });
                }}
                onBlur={() => {
                  if (safeVal.rw.trim()) {
                    emitUpdate({ ...safeVal, rw: padRtRw3(safeVal.rw) });
                  }
                }}
                placeholder={hasVillage ? 'Contoh: 005' : 'Pilih Desa dulu'}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 disabled:bg-slate-950/40 disabled:border-slate-800/80 disabled:text-slate-500 text-xs font-mono tabular-nums font-bold text-white tracking-widest focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Baris 7: Alamat Jalan / Nomor Rumah (Opsional) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="font-mono tabular-nums text-cyan-400">7.</span>
                <span>Alamat Jalan / Nomor Rumah / Patokan</span>
              </label>
              <span className="text-[10px] text-slate-400">Opsional · boleh dikosongkan</span>
            </div>
            <input
              type="text"
              disabled={!hasVillage}
              value={safeVal.streetAddress || ''}
              onChange={(e) => {
                emitUpdate({ ...safeVal, streetAddress: e.target.value });
              }}
              placeholder={
                hasVillage
                  ? 'Contoh: Jl. Merdeka No. 12, Perum Graha Asri Blok B2 (opsional)'
                  : 'Lengkapi Provinsi hingga Desa terlebih dahulu...'
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 disabled:bg-slate-950/40 disabled:border-slate-800/80 disabled:text-slate-500 text-xs text-white focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Live KTP Format Preview */}
          <div className="pt-2.5 border-t border-slate-800 space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-semibold text-slate-400">Pratinjau Format Resmi KTP</span>
              {validation.valid ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Alamat Lengkap</span>
                </span>
              ) : (
                <span className="text-amber-300/90 text-[10px] truncate">{validation.message}</span>
              )}
            </div>
            <p className="text-xs text-slate-200 font-medium leading-relaxed bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-2">
              {ktpPreview || (
                <span className="text-slate-500 italic">
                  Belum ada wilayah dipilih. Mulai dari langkah 1 (Provinsi) di atas.
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
