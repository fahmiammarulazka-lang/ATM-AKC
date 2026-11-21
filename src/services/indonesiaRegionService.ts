/**
 * Hybrid Indonesian Administrative Region & Auto Postal Code Service
 * - Primary: Backend Express Proxy (/api/regions/*) backed by wilayah.id & emsifa v2 with server cache
 * - Secondary: Direct public CORS JSON fallback if running without Express backend
 * - Tertiary: Built-in 38-Province Offline Dataset + Postal Code Resolver (never hangs or breaks)
 */
import {
  OFFLINE_PROVINCES_38,
  OFFLINE_REGENCIES_BY_PROVINCE,
  OFFLINE_DISTRICTS_BY_REGENCY,
  OFFLINE_VILLAGES_BY_DISTRICT,
  resolveOfflinePostalCode,
  type RegionItem,
} from '../data/indonesiaRegionsOffline';

export type { RegionItem };

const provinceCache: { items: RegionItem[] | null; source: 'api' | 'offline' } = {
  items: null,
  source: 'offline',
};
const regencyCache = new Map<string, { items: RegionItem[]; source: 'api' | 'offline' }>();
const districtCache = new Map<string, { items: RegionItem[]; source: 'api' | 'offline' }>();
const villageCache = new Map<string, { items: RegionItem[]; source: 'api' | 'offline' }>();
const postalCache = new Map<string, string>();

function normalizeItems(rawList: unknown): RegionItem[] {
  if (!Array.isArray(rawList)) return [];
  const items: RegionItem[] = [];
  for (const raw of rawList) {
    if (!raw || typeof raw !== 'object') continue;
    const rec = raw as Record<string, unknown>;
    const code = String(rec.code ?? rec.id ?? '').trim();
    const name = String(rec.name ?? rec.nama ?? '').trim();
    const postalRaw = rec.postal_code ?? rec.postalCode ?? rec.kodepos;
    const postalCode =
      typeof postalRaw === 'string' || typeof postalRaw === 'number'
        ? String(postalRaw).replace(/\D/g, '').slice(0, 5)
        : undefined;
    if (code && name) {
      items.push({
        code,
        name,
        postalCode: postalCode && postalCode.length === 5 ? postalCode : undefined,
      });
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name, 'id'));
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 4500): Promise<any | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchProvinces(): Promise<{ items: RegionItem[]; source: 'api' | 'offline' }> {
  if (provinceCache.items && provinceCache.items.length >= 34) {
    return { items: provinceCache.items, source: provinceCache.source };
  }

  // 1. Backend proxy
  const proxyRes = await fetchJsonWithTimeout('/api/regions/provinces', 4000);
  const proxyItems = normalizeItems(proxyRes?.data ?? proxyRes);
  if (proxyItems.length >= 34) {
    provinceCache.items = proxyItems;
    provinceCache.source = 'api';
    return { items: proxyItems, source: 'api' };
  }

  // 2. Direct public CORS fallback (emsifa v2 / wilayah.id)
  const directUrls = [
    'https://wilayah.id/api/provinces.json',
    'https://www.emsifa.com/api-wilayah-indonesia/v2/provinces.json',
    'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
  ];
  for (const url of directUrls) {
    const data = await fetchJsonWithTimeout(url, 3500);
    const items = normalizeItems(data?.data ?? data);
    if (items.length >= 34) {
      provinceCache.items = items;
      provinceCache.source = 'api';
      return { items, source: 'api' };
    }
  }

  // 3. Offline 38 Provinces
  const offlineSorted = [...OFFLINE_PROVINCES_38].sort((a, b) => a.name.localeCompare(b.name, 'id'));
  provinceCache.items = offlineSorted;
  provinceCache.source = 'offline';
  return { items: offlineSorted, source: 'offline' };
}

export async function fetchRegencies(
  provinceCode: string
): Promise<{ items: RegionItem[]; source: 'api' | 'offline' }> {
  const cleanCode = String(provinceCode || '').trim();
  if (!cleanCode) return { items: [], source: 'offline' };

  const cached = regencyCache.get(cleanCode);
  if (cached) return cached;

  const proxyRes = await fetchJsonWithTimeout(
    `/api/regions/regencies/${encodeURIComponent(cleanCode)}`,
    4500
  );
  const proxyItems = normalizeItems(proxyRes?.data ?? proxyRes);
  if (proxyItems.length > 0) {
    const entry = { items: proxyItems, source: 'api' as const };
    regencyCache.set(cleanCode, entry);
    return entry;
  }

  const flatCode = cleanCode.replace(/\./g, '');
  const directUrls = [
    `https://wilayah.id/api/regencies/${encodeURIComponent(cleanCode)}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/v2/regencies/${encodeURIComponent(flatCode)}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${encodeURIComponent(flatCode)}.json`,
  ];
  for (const url of directUrls) {
    const data = await fetchJsonWithTimeout(url, 3500);
    const items = normalizeItems(data?.data ?? data);
    if (items.length > 0) {
      const entry = { items, source: 'api' as const };
      regencyCache.set(cleanCode, entry);
      return entry;
    }
  }

  const offlineList = OFFLINE_REGENCIES_BY_PROVINCE[flatCode] || [];
  const entry = { items: offlineList, source: 'offline' as const };
  regencyCache.set(cleanCode, entry);
  return entry;
}

export async function fetchDistricts(
  regencyCode: string
): Promise<{ items: RegionItem[]; source: 'api' | 'offline' }> {
  const cleanCode = String(regencyCode || '').trim();
  if (!cleanCode) return { items: [], source: 'offline' };

  const cached = districtCache.get(cleanCode);
  if (cached) return cached;

  const proxyRes = await fetchJsonWithTimeout(
    `/api/regions/districts/${encodeURIComponent(cleanCode)}`,
    4500
  );
  const proxyItems = normalizeItems(proxyRes?.data ?? proxyRes);
  if (proxyItems.length > 0) {
    const entry = { items: proxyItems, source: 'api' as const };
    districtCache.set(cleanCode, entry);
    return entry;
  }

  const flatCode = cleanCode.replace(/\./g, '');
  const dottedCode =
    cleanCode.includes('.') || flatCode.length !== 4
      ? cleanCode
      : `${flatCode.slice(0, 2)}.${flatCode.slice(2, 4)}`;

  const directUrls = [
    `https://wilayah.id/api/districts/${encodeURIComponent(dottedCode)}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/v2/districts/${encodeURIComponent(flatCode)}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${encodeURIComponent(flatCode)}.json`,
  ];
  for (const url of directUrls) {
    const data = await fetchJsonWithTimeout(url, 3500);
    const items = normalizeItems(data?.data ?? data);
    if (items.length > 0) {
      const entry = { items, source: 'api' as const };
      districtCache.set(cleanCode, entry);
      return entry;
    }
  }

  const offlineList =
    OFFLINE_DISTRICTS_BY_REGENCY[dottedCode] || OFFLINE_DISTRICTS_BY_REGENCY[cleanCode] || [];
  const entry = { items: offlineList, source: 'offline' as const };
  districtCache.set(cleanCode, entry);
  return entry;
}

export async function fetchVillages(
  districtCode: string
): Promise<{ items: RegionItem[]; source: 'api' | 'offline' }> {
  const cleanCode = String(districtCode || '').trim();
  if (!cleanCode) return { items: [], source: 'offline' };

  const cached = villageCache.get(cleanCode);
  if (cached) return cached;

  const proxyRes = await fetchJsonWithTimeout(
    `/api/regions/villages/${encodeURIComponent(cleanCode)}`,
    4500
  );
  const proxyItems = normalizeItems(proxyRes?.data ?? proxyRes);
  if (proxyItems.length > 0) {
    const entry = { items: proxyItems, source: 'api' as const };
    villageCache.set(cleanCode, entry);
    return entry;
  }

  const flatCode = cleanCode.replace(/\./g, '');
  const dottedCode =
    cleanCode.includes('.') || flatCode.length !== 6
      ? cleanCode
      : `${flatCode.slice(0, 2)}.${flatCode.slice(2, 4)}.${flatCode.slice(4, 6)}`;

  const directUrls = [
    `https://wilayah.id/api/villages/${encodeURIComponent(dottedCode)}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/v2/villages/${encodeURIComponent(flatCode)}.json`,
    `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${encodeURIComponent(flatCode)}.json`,
  ];
  for (const url of directUrls) {
    const data = await fetchJsonWithTimeout(url, 3500);
    const items = normalizeItems(data?.data ?? data);
    if (items.length > 0) {
      const entry = { items, source: 'api' as const };
      villageCache.set(cleanCode, entry);
      return entry;
    }
  }

  const offlineList =
    OFFLINE_VILLAGES_BY_DISTRICT[dottedCode] || OFFLINE_VILLAGES_BY_DISTRICT[cleanCode] || [];
  const entry = { items: offlineList, source: 'offline' as const };
  villageCache.set(cleanCode, entry);
  return entry;
}

export async function lookupAutoPostalCode(params: {
  provinceCode?: string;
  provinceName?: string;
  regencyCode?: string;
  regencyName?: string;
  districtCode?: string;
  districtName?: string;
  villageName?: string;
  villagePostalCode?: string;
}): Promise<string> {
  // 1. Jika item Desa/Kelurahan dari API sudah langsung membawa postalCode 5 digit
  if (params.villagePostalCode && /^\d{5}$/.test(params.villagePostalCode.trim())) {
    return params.villagePostalCode.trim();
  }

  const cacheKey = [
    params.regencyName || params.regencyCode || '',
    params.districtName || params.districtCode || '',
    params.villageName || '',
  ]
    .join('|')
    .toLowerCase();

  if (postalCache.has(cacheKey)) {
    return postalCache.get(cacheKey)!;
  }

  // 2. Query backend postal-code proxy (menggunakan kodepos.vercel.app & normalisasi wilayah)
  const qs = new URLSearchParams();
  if (params.villageName) qs.set('village', params.villageName);
  if (params.districtName) qs.set('district', params.districtName);
  if (params.regencyName) qs.set('regency', params.regencyName);
  if (params.provinceName) qs.set('province', params.provinceName);

  if (qs.toString()) {
    const proxyRes = await fetchJsonWithTimeout(`/api/regions/postal-code?${qs.toString()}`, 3500);
    const foundPostal = String(proxyRes?.postalCode || '').replace(/\D/g, '').slice(0, 5);
    if (foundPostal.length === 5) {
      postalCache.set(cacheKey, foundPostal);
      return foundPostal;
    }
  }

  // 3. Fallback offline lookup berdasarkan Kabupaten/Kota/Kecamatan/Provinsi
  const offlinePostal = resolveOfflinePostalCode({
    provinceCode: params.provinceCode,
    regencyCode: params.regencyCode,
    regencyName: params.regencyName,
    districtCode: params.districtCode,
    villagePostalCode: params.villagePostalCode,
  });
  if (offlinePostal) {
    postalCache.set(cacheKey, offlinePostal);
  }
  return offlinePostal;
}
