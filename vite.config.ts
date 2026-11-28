import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function buildWibMetadata() {
  const now = new Date();
  const tz = 'Asia/Jakarta';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  const buildId = `BLD-${get('year')}${get('month')}${get('day')}-${get('hour')}${get('minute')}`;

  const weekdayDate = new Intl.DateTimeFormat('id-ID', {
    timeZone: tz,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
  const fullDateWib = `${weekdayDate} • Pukul ${get('hour')}:${get('minute')} WIB`;

  return {
    buildId,
    buildIso: now.toISOString(),
    fullDateWib,
    catalogVersion: 'v16.47.24',
  };
}

export default defineConfig(() => {
  const meta = buildWibMetadata();
  return {
    plugins: [react(), tailwindcss()],
    define: {
      __APP_BUILD_ID__: JSON.stringify(meta.buildId),
      __APP_BUILD_ISO__: JSON.stringify(meta.buildIso),
      __APP_BUILD_DATE_WIB__: JSON.stringify(meta.fullDateWib),
      __APP_CATALOG_RELEASE_VERSION__: JSON.stringify(meta.catalogVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
