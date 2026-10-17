import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Charm',
        short_name: 'Charm',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        // TODO: replace with PNG icons (192, 512, apple-touch 180) from Natalia's art.
        icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
      },
      workbox: {
        // Serverless functions must always hit the network, never the SPA fallback.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
