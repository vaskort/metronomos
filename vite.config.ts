import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import aliases from './vite.aliases';
import csp from './vite.csp';

// Web target. Builds a static site into dist-web/ for any static host.
// VITE_BASE lets the same build serve from a sub-path (GitHub Pages project
// sites live at /<repo>/) without touching the config.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    csp(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Metronomos — Online Metronome',
        short_name: 'Metronomos',
        description:
          'A precise and reliable metronome for musicians. Works offline.',
        theme_color: '#1890ff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        // Relative so the app installs correctly from a sub-path too.
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-256.png', sizes: '256x256', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The click samples must be cached or the metronome is silent offline.
        globPatterns: ['**/*.{js,css,html,png,svg,wav}'],
      },
    }),
  ],
  resolve: { alias: aliases },
  // The scheduler worker has no imports, so a classic worker keeps us
  // compatible with older Safari that lacks module-worker support.
  worker: { format: 'iife' },
  build: {
    outDir: 'dist-web',
    // Not shipped: the map is ~2.2 MB, publishes the original source, and is
    // only ever wanted locally — `vite build --sourcemap` covers that case.
    sourcemap: false,
    assetsInlineLimit: 0, // never inline the .wav samples
  },
  server: { port: 5173 },
});
