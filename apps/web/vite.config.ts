import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'InnerFlame',
        short_name: 'InnerFlame',
        description: 'Insights for founders to thrive',
        theme_color: '#f97316',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'https://lpxnyybizytwcqdqasll.supabase.co/storage/v1/object/public/innerflame_asset//logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/lpxnyybizytwcqdqasll\.supabase\.co\/storage\/v1\/object\/public\/innerflame_asset\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'innerflame-assets-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});