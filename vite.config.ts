import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Manifest icons are precached automatically; this one is only linked from index.html.
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Charm',
        short_name: 'Charm',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // The app background (--color-bg): the splash screen and status bar color.
        background_color: '#3e5c64',
        theme_color: '#3e5c64',
        // Generated from public/icon-1024.png by `npm run icons` (scripts/icons.mjs).
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Serverless functions must always hit the network, never the SPA fallback.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
