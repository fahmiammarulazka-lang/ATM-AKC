/**
 * Bank Nusantara — Mesin Deteksi Rilis & Build Otomatis (Auto-Update Release Registry)
 * ------------------------------------------------------------------------------------
 * - Membaca metadata build hasil injeksi Vite (__APP_BUILD_ID__, __APP_BUILD_DATE_WIB__, dll.)
 * - Menggabungkan katalog rilis terbaru bawaan kode dengan arsip Cloud RTDB tanpa pernah
 *   menghapus atau menimpa catatan manual / hasil suntingan Admin.
 * - Mendeteksi secara otomatis jika aplikasi di-update atau di-publish ulang di masa depan
 *   dengan ID Build baru yang belum tercatat, lalu membuat entri versi berurutan otomatis
 *   (mis. v18.1, v18.2) tanpa duplikasi ID Build lintas perangkat.
 */
import { AppUpdateRecord } from '../types/bank';

export interface ActiveAppBuildInfo {
  buildId: string;
  buildIso: string;
  buildDateWib: string;
  catalogVersion: string;
}

export function getActiveAppBuildInfo(): ActiveAppBuildInfo {
  const buildId =
    typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__
      ? __APP_BUILD_ID__
      : 'BLD-20261119-0000';
  const buildIso =
    typeof __APP_BUILD_ISO__ !== 'undefined' && __APP_BUILD_ISO__
      ? __APP_BUILD_ISO__
      : new Date().toISOString();
  const buildDateWib =
    typeof __APP_BUILD_DATE_WIB__ !== 'undefined' && __APP_BUILD_DATE_WIB__
      ? __APP_BUILD_DATE_WIB__
      : 'Kamis, 19 November 2026 • Pukul 19:50 WIB';
  const catalogVersion =
    typeof __APP_CATALOG_RELEASE_VERSION__ !== 'undefined' && __APP_CATALOG_RELEASE_VERSION__
      ? __APP_CATALOG_RELEASE_VERSION__
      : 'v19.0';

  return { buildId, buildIso, buildDateWib, catalogVersion };
}

function parseSemverPair(versionStr: string): { major: number; minor: number } {
  const match = String(versionStr || '').match(/v?(\d+)(?:\.(\d+))?/i);
  if (!match) return { major: 18, minor: 0 };
  const major = Number.parseInt(match[1], 10);
  const minor = match[2] !== undefined ? Number.parseInt(match[2], 10) : 0;
  return {
    major: Number.isFinite(major) ? major : 18,
    minor: Number.isFinite(minor) ? minor : 0,
  };
}

function computeNextMinorVersion(records: AppUpdateRecord[]): string {
  let maxMajor = 18;
  let maxMinor = 0;
  for (const rec of records) {
    const parsed = parseSemverPair(rec.version);
    if (
      parsed.major > maxMajor ||
      (parsed.major === maxMajor && parsed.minor > maxMinor)
    ) {
      maxMajor = parsed.major;
      maxMinor = parsed.minor;
    }
  }
  return `v${maxMajor}.${maxMinor + 1}`;
}

function getRecordSortTime(rec: AppUpdateRecord): number {
  const parsed = Date.parse(rec.createdAt || '');
  if (Number.isFinite(parsed)) return parsed;
  const ver = parseSemverPair(rec.version);
  return ver.major * 1_000_000 + ver.minor * 1_000;
}

export interface AutoMergeUpdatesResult {
  mergedUpdates: AppUpdateRecord[];
  didChange: boolean;
  newlyAddedIds: string[];
}

export function mergeAutoDetectedAppUpdates(
  existingUpdates: AppUpdateRecord[],
  builtInCatalog: AppUpdateRecord[]
): AutoMergeUpdatesResult {
  const buildInfo = getActiveAppBuildInfo();
  const safeExisting = Array.isArray(existingUpdates)
    ? existingUpdates.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];
  const safeCatalog = Array.isArray(builtInCatalog)
    ? builtInCatalog.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];

  const byId = new Map<string, AppUpdateRecord>();
  const existingVersions = new Set<string>();
  const existingBuildIds = new Set<string>();

  for (const item of safeExisting) {
    byId.set(item.id, { ...item });
    if (item.version) existingVersions.add(item.version.trim().toLowerCase());
    if (item.buildId) existingBuildIds.add(item.buildId.trim().toUpperCase());
  }

  let didChange = false;
  const newlyAddedIds: string[] = [];
  const newestCatalogId = safeCatalog[0]?.id;

  // 1. Gabungkan katalog rilis bawaan baru (mis. v16.0, v17.0, v18.0) tanpa pernah menghapus / menimpa suntingan Admin
  for (const catItem of safeCatalog) {
    const prev = byId.get(catItem.id);
    const isNewestCatalog = catItem.id === newestCatalogId;
    const versionAlreadyPresent =
      Boolean(catItem.version) && existingVersions.has(catItem.version.trim().toLowerCase());

    if (!prev && !versionAlreadyPresent) {
      const enriched: AppUpdateRecord = {
        ...catItem,
        ...(isNewestCatalog && !catItem.buildId ? { buildId: buildInfo.buildId } : {}),
        isAutoDetected: catItem.isAutoDetected ?? true,
      };
      byId.set(enriched.id, enriched);
      existingVersions.add(enriched.version.trim().toLowerCase());
      if (enriched.buildId) existingBuildIds.add(enriched.buildId.trim().toUpperCase());
      newlyAddedIds.push(enriched.id);
      didChange = true;
    } else if (prev && !prev.editedByAdmin && isNewestCatalog && !prev.buildId) {
      // Lengkapi tag buildId jika entri katalog terbaru belum memiliki buildId
      byId.set(prev.id, {
        ...prev,
        buildId: buildInfo.buildId,
      });
      existingBuildIds.add(buildInfo.buildId.trim().toUpperCase());
      didChange = true;
    }
  }

  // 2. Deteksi build/publish baru di masa depan (buildId baru belum tercatat di entri mana pun)
  const normalizedActiveBuildId = buildInfo.buildId.trim().toUpperCase();
  const autoBuildRecordId = `upd-auto-${normalizedActiveBuildId.toLowerCase()}`;
  const buildAlreadyTracked =
    existingBuildIds.has(normalizedActiveBuildId) || byId.has(autoBuildRecordId);

  if (!buildAlreadyTracked && safeExisting.length > 0) {
    const currentPool = Array.from(byId.values());
    const nextVersion = computeNextMinorVersion(currentPool);
    const autoRecord: AppUpdateRecord = {
      id: autoBuildRecordId,
      version: nextVersion,
      title: `Pembaruan Otomatis Aplikasi ${nextVersion} (${buildInfo.buildId})`,
      fullDate: buildInfo.buildDateWib,
      dateText: buildInfo.buildDateWib,
      description: `Aplikasi Bank Nusantara Digital baru saja diperbarui dan dipublikasikan ulang secara otomatis dengan identitas kompilasi ${buildInfo.buildId} pada ${buildInfo.buildDateWib}. Seluruh pembaruan sistem, optimalisasi performa, serta perbaikan stabilitas terbaru telah aktif secara instan di seluruh perangkat nasabah tanpa perlu login ulang. Admin dapat mengedit judul, deskripsi, maupun poin rincian catatan ini kapan saja melalui Panel Admin.`,
      highlights: [
        `⚡ Rilis & Publikasi Otomatis Terdeteksi: Versi ${nextVersion} (${buildInfo.buildId}) aktif pada ${buildInfo.buildDateWib}.`,
        '🔐 Sesi Login Permanen Terjaga: Nasabah yang sudah masuk langsung diarahkan ke Dashboard tanpa kembali ke halaman Login.',
        '☁️ Sinkronisasi Otomatis Cloud RTDB: Catatan pembaruan ini disebarkan otomatis ke seluruh perangkat tanpa duplikasi ID Build.',
        '🛠️ Bebas Diedit di Panel Admin: Admin dapat melengkapi rincian fitur khusus pada versi ini kapan saja.',
      ],
      changes: [
        `Rilis & Publikasi Otomatis Terdeteksi: Versi ${nextVersion} (${buildInfo.buildId}) pada ${buildInfo.buildDateWib}.`,
        'Sinkronisasi otomatis catatan update ke Cloud RTDB tanpa menghapus riwayat buatan Admin.',
      ],
      isCurrent: true,
      categoryBadge: `UPDATE SEKARANG (${nextVersion})`,
      author: 'Sistem Deteksi Rilis Otomatis Bank Nusantara',
      createdAt: buildInfo.buildIso,
      buildId: buildInfo.buildId,
      isAutoDetected: true,
      editedByAdmin: false,
    };
    byId.set(autoRecord.id, autoRecord);
    newlyAddedIds.push(autoRecord.id);
    didChange = true;
  }

  // 3. Urutkan kronologis terbaru di atas dan pastikan tepat satu entri aktif sebagai Update Sekarang
  const mergedList = Array.from(byId.values()).sort((a, b) => {
    const timeDiff = getRecordSortTime(b) - getRecordSortTime(a);
    if (Math.abs(timeDiff) > 1000) return timeDiff;
    const va = parseSemverPair(a.version);
    const vb = parseSemverPair(b.version);
    if (vb.major !== va.major) return vb.major - va.major;
    return vb.minor - va.minor;
  });

  if (mergedList.length > 0) {
    let targetCurrentId: string;
    if (newlyAddedIds.length > 0) {
      // Jika baru saja ada rilis/build baru yang masuk, jadikan rilis terbaru itu sebagai Update Sekarang
      const newestAdded = mergedList.find((u) => newlyAddedIds.includes(u.id)) || mergedList[0];
      targetCurrentId = newestAdded.id;
    } else {
      const existingCurrent = mergedList.find((u) => u.isCurrent);
      targetCurrentId = existingCurrent ? existingCurrent.id : mergedList[0].id;
    }

    const normalizedList = mergedList.map((u) => {
      const shouldBeCurrent = u.id === targetCurrentId;
      let nextBadge = u.categoryBadge;
      if (shouldBeCurrent) {
        if (!nextBadge || nextBadge === 'Update Sebelumnya') {
          nextBadge = `UPDATE SEKARANG (${u.version})`;
        }
      } else if (nextBadge && nextBadge.toUpperCase().includes('UPDATE SEKARANG')) {
        nextBadge = 'Update Sebelumnya';
      }
      if (u.isCurrent !== shouldBeCurrent || u.categoryBadge !== nextBadge) {
        didChange = true;
      }
      return {
        ...u,
        isCurrent: shouldBeCurrent,
        categoryBadge: nextBadge,
      };
    });

    // Pastikan item isCurrent selalu tampil di index 0 agar konsisten dengan seluruh komponen
    normalizedList.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return 0;
    });

    return {
      mergedUpdates: normalizedList,
      didChange,
      newlyAddedIds,
    };
  }

  return {
    mergedUpdates: mergedList,
    didChange,
    newlyAddedIds,
  };
}
