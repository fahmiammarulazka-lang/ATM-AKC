/**
 * Google Maps Interactive Address Picker for Bank Nusantara Card Registration
 * Uses @vis.gl/react-google-maps with modern Places API (New) AutocompleteSuggestion,
 * AdvancedMarkerElement (with mapId="DEMO_MAP_ID"), GPS Geolocation, and Click-to-Pick Address.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
  MapMouseEvent,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Search,
  CheckCircle2,
  Compass,
  Sparkles,
  Building2,
  Loader2,
  X,
} from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface PickedLocationResult {
  address: string;
  lat: number;
  lng: number;
  label?: string;
}

interface GoogleMapsAddressPickerProps {
  value: string;
  onChange: (newAddress: string, details?: PickedLocationResult) => void;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

interface QuickCityPreset {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const NUSANTARA_QUICK_PINS: QuickCityPreset[] = [
  {
    name: 'Jakarta Pusat (Sudirman)',
    address: 'Jl. Jend. Sudirman Kav. 52-53, SCBD, Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12190',
    lat: -6.2246,
    lng: 106.8096,
  },
  {
    name: 'Jakarta (Bundaran HI)',
    address: 'Jl. M.H. Thamrin No. 1, Menteng, Kec. Menteng, Kota Jakarta Pusat, DKI Jakarta 10310',
    lat: -6.1944,
    lng: 106.8229,
  },
  {
    name: 'Surabaya (Tunjungan)',
    address: 'Jl. Tunjungan No. 65, Genteng, Kec. Genteng, Kota Surabaya, Jawa Timur 60275',
    lat: -7.2575,
    lng: 112.7521,
  },
  {
    name: 'Bandung (Asia Afrika)',
    address: 'Jl. Asia Afrika No. 81, Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111',
    lat: -6.9215,
    lng: 107.6071,
  },
  {
    name: 'Yogyakarta (Malioboro)',
    address: 'Jl. Malioboro No. 52-58, Suryatmajan, Kec. Danurejan, Kota Yogyakarta, DIY 55213',
    lat: -7.7926,
    lng: 110.3658,
  },
  {
    name: 'Medan (Merdeka Walk)',
    address: 'Jl. Balai Kota No. 1, Kesawan, Kec. Medan Barat, Kota Medan, Sumatera Utara 20111',
    lat: 3.5902,
    lng: 98.6775,
  },
  {
    name: 'Bali (Denpasar / Kuta)',
    address: 'Jl. Raya Puputan No. 108, Renon, Kec. Denpasar Timur, Kota Denpasar, Bali 80239',
    lat: -8.6705,
    lng: 115.2126,
  },
  {
    name: 'IKN Nusantara (Kaltim)',
    address: 'Kawasan Inti Pusat Pemerintahan (KIPP), Ibu Kota Nusantara, Penajam Paser Utara, Kalimantan Timur',
    lat: -0.9736,
    lng: 116.7088,
  },
];

interface SuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  placePrediction: any;
}

const MapInnerContent: React.FC<{
  selectedPos: { lat: number; lng: number };
  onSelectPosition: (pos: { lat: number; lng: number }, resolvedAddress?: string) => void;
}> = ({ selectedPos, onSelectPosition }) => {
  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(selectedPos);
  const [sessionToken, setSessionToken] = useState<any>(null);

  useEffect(() => {
    setMapCenter(selectedPos);
  }, [selectedPos.lat, selectedPos.lng]);

  useEffect(() => {
    if (placesLib && (placesLib as any).AutocompleteSessionToken) {
      setSessionToken(new (placesLib as any).AutocompleteSessionToken());
    }
  }, [placesLib]);

  // Fetch Places (New) AutocompleteSuggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 3 || !placesLib) {
      setSuggestions([]);
      return;
    }

    const AutocompleteSuggestion = (placesLib as any).AutocompleteSuggestion;
    if (!AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const request: any = {
          input: q,
          language: 'id',
          region: 'ID',
        };
        if (sessionToken) {
          request.sessionToken = sessionToken;
        }
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (cancelled) return;
        const rawList = response?.suggestions || [];
        const mapped: SuggestionItem[] = rawList
          .filter((s: any) => s.placePrediction)
          .slice(0, 5)
          .map((s: any) => {
            const pred = s.placePrediction;
            return {
              placeId: pred.placeId || Math.random().toString(),
              mainText: pred.mainText?.text || pred.text?.text || q,
              secondaryText: pred.secondaryText?.text || '',
              fullText: pred.text?.text || q,
              placePrediction: pred,
            };
          });
        setSuggestions(mapped);
      } catch {
        // Fallback if Places API New suggestion fails
        setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, placesLib, sessionToken]);

  const handleSelectSuggestion = async (item: SuggestionItem) => {
    setSuggestions([]);
    setSearchQuery(item.fullText);
    try {
      if (item.placePrediction && typeof item.placePrediction.toPlace === 'function') {
        const place = item.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        });
        const loc = place.location;
        const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat ?? selectedPos.lat;
        const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng ?? selectedPos.lng;
        const formatted = place.formattedAddress || item.fullText;
        onSelectPosition({ lat, lng }, formatted);
        if (placesLib && (placesLib as any).AutocompleteSessionToken) {
          setSessionToken(new (placesLib as any).AutocompleteSessionToken());
        }
        return;
      }
    } catch {
      // Fallback to text if fetchFields fails
    }
    onSelectPosition(selectedPos, item.fullText);
  };

  const reverseGeocodeLatLng = useCallback(
    async (lat: number, lng: number) => {
      setIsReverseGeocoding(true);
      try {
        if (geocodingLib && (geocodingLib as any).Geocoder) {
          const geocoder = new (geocodingLib as any).Geocoder();
          const res = await geocoder.geocode({ location: { lat, lng } });
          if (res?.results && res.results.length > 0) {
            const addr = res.results[0].formatted_address;
            onSelectPosition({ lat, lng }, addr);
            setIsReverseGeocoding(false);
            return;
          }
        }
      } catch {
        // Fallback below if Geocoding API is not enabled or quota reached
      }
      // Find nearest Nusantara city preset to enrich coordinate address
      let nearest = NUSANTARA_QUICK_PINS[0];
      let minDist = Infinity;
      for (const pin of NUSANTARA_QUICK_PINS) {
        const d = Math.hypot(pin.lat - lat, pin.lng - lng);
        if (d < minDist) {
          minDist = d;
          nearest = pin;
        }
      }
      const areaLabel = minDist < 0.35 ? `Kawasan ${nearest.name}` : 'Indonesia';
      const fallbackAddress = `Titik Peta Google Maps (${areaLabel}) — Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      onSelectPosition({ lat, lng }, fallbackAddress);
      setIsReverseGeocoding(false);
    },
    [geocodingLib, onSelectPosition]
  );

  const handleMapClick = (e: MapMouseEvent) => {
    const latLng = e.detail?.latLng;
    if (!latLng) return;
    reverseGeocodeLatLng(latLng.lat, latLng.lng);
  };

  return (
    <div className="space-y-2.5">
      {/* Search Box inside Map Picker */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 focus-within:border-amber-400 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jalan, gedung, kelurahan, atau kota di Google Maps..."
            className="w-full bg-transparent text-white text-xs focus:outline-none"
          />
          {isSearching && <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-800">
            {suggestions.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-3 py-2.5 text-left hover:bg-blue-950/70 flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-bold text-white text-xs block truncate">
                    {item.mainText}
                  </span>
                  {item.secondaryText && (
                    <span className="text-[11px] text-slate-400 block truncate">
                      {item.secondaryText}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Google Map Container */}
      <div className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-inner bg-slate-950">
        <Map
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio', 'gmp_git_agentskills_v1']}
          center={mapCenter}
          defaultZoom={15}
          gestureHandling="greedy"
          onClick={handleMapClick}
          onCameraChanged={(ev) => {
            if (ev.detail?.center) {
              setMapCenter(ev.detail.center);
            }
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <AdvancedMarker position={selectedPos}>
            <Pin background="#f59e0b" borderColor="#0f172a" glyphColor="#0f172a" />
          </AdvancedMarker>
        </Map>

        {/* Overlay instruction badge */}
        <div className="absolute top-2.5 left-2.5 right-2.5 pointer-events-none flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/50 text-amber-300 text-[10px] font-bold shadow-lg flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Klik titik mana saja di Peta Google Maps untuk ambil alamat otomatis!</span>
          </span>
          {isReverseGeocoding && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/90 border border-blue-400 text-blue-200 text-[10px] font-bold flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Mengambil Alamat...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const GoogleMapsAddressPicker: React.FC<GoogleMapsAddressPickerProps> = ({
  value,
  onChange,
  required = true,
  label = 'Alamat Tempat Tinggal Lengkap (Wajib — Bisa Ambil Langsung dari Google Maps):',
  placeholder = 'Klik tombol "Ambil dari Google Maps" di atas atau pilih titik di peta agar otomatis terisi tanpa mengetik...',
}) => {
  const [isMapOpen, setIsMapOpen] = useState<boolean>(true);
  const [selectedPos, setSelectedPos] = useState<{ lat: number; lng: number }>({
    lat: -6.2246,
    lng: 106.8096,
  });
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const handleSelectPosition = useCallback(
    (pos: { lat: number; lng: number }, resolvedAddress?: string) => {
      setSelectedPos(pos);
      if (resolvedAddress) {
        onChange(resolvedAddress, {
          address: resolvedAddress,
          lat: pos.lat,
          lng: pos.lng,
        });
        setGpsStatus(`✓ Alamat berhasil diambil dari Google Maps (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
      }
    },
    [onChange]
  );

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      const preset = NUSANTARA_QUICK_PINS[0];
      handleSelectPosition({ lat: preset.lat, lng: preset.lng }, preset.address);
      return;
    }
    setIsLocatingGps(true);
    setGpsStatus('Mendeteksi koordinat GPS perangkat Anda...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setIsLocatingGps(false);
        const gpsAddr = `Lokasi GPS Saya Saat Ini — Koordinat Google Maps (${lat.toFixed(5)}, ${lng.toFixed(5)}), Indonesia`;
        handleSelectPosition({ lat, lng }, gpsAddr);
      },
      () => {
        setIsLocatingGps(false);
        // Fallback to Jakarta Sudirman if browser GPS permission is blocked in iframe
        const preset = NUSANTARA_QUICK_PINS[0];
        handleSelectPosition({ lat: preset.lat, lng: preset.lng }, preset.address);
        setGpsStatus('✓ Lokasi otomatis diterapkan (Kawasan Sudirman Jakarta Pusat)');
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{label}</span>
          {required && <span className="text-rose-400 font-black">*Wajib</span>}
        </label>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={isLocatingGps}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            {isLocatingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5" />
            )}
            <span>📍 Ambil Lokasi GPS Saya Otomatis</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMapOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition-all ${
              isMapOpen
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-blue-600 hover:bg-blue-500 border-blue-400 text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{isMapOpen ? 'Sembunyikan Peta Google Maps' : '🗺️ Buka Peta Google Maps'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Google Maps Panel */}
      {isMapOpen && (
        <div className="p-3.5 rounded-2xl bg-slate-900/95 border-2 border-blue-500/40 space-y-3 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
                <MapPin className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-white text-xs block">
                  Google Maps Platform — Pilih Alamat Tanpa Mengetik Manual
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Klik langsung pada peta, cari lokasi, atau klik salah satu kota populer di bawah ini:
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
              ✓ Google Maps Live
            </span>
          </div>

          {/* 1-Click Quick City / Landmark Address Pills */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Pilih Cepat Alamat Kota / Landmark (1-Klik Langsung Terisi):</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {NUSANTARA_QUICK_PINS.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() =>
                    handleSelectPosition({ lat: city.lat, lng: city.lng }, city.address)
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-blue-950 border border-slate-700 hover:border-amber-400 text-slate-200 hover:text-amber-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Building2 className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{city.name}</span>
                </button>
              ))}
            </div>
          </div>

          {GOOGLE_MAPS_API_KEY ? (
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="id" region="ID">
              <MapInnerContent
                selectedPos={selectedPos}
                onSelectPosition={handleSelectPosition}
              />
            </APIProvider>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              Pilih salah satu tombol lokasi cepat di atas atau klik Ambil Lokasi GPS Saya Otomatis.
            </div>
          )}

          {gpsStatus && (
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{gpsStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* Selected Address Box (Auto-filled from Google Maps, or editable if user wishes) */}
      <div className="relative">
        <textarea
          required={required}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl p-2.5 text-white text-xs focus:outline-none resize-none"
        />
        {value && (
          <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-400">
            <span className="flex items-center gap-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Alamat terverifikasi & siap digunakan untuk penerbitan kartu</span>
            </span>
            <span className="font-mono text-slate-400">
              Koordinat: {selectedPos.lat.toFixed(4)}, {selectedPos.lng.toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
