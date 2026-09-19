import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '도슨트 · Docent',
        short_name: '도슨트',
        lang: 'ko',
        description: '로마 핵심 명소 5곳의 한국어 오디오 가이드',
        start_url: '/',
        display: 'standalone',
        background_color: '#0F1419',
        theme_color: '#0F1419',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // mp3/이미지는 precache 제외 (앱 셸만) — 오프라인은 런타임 캐시 + 수동 다운로드로
        globPatterns: ['**/*.{js,css,html,svg,woff2,ico}', 'icon-*.png'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://upload.wikimedia.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'docent-wikimedia',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 오디오: 전체(439개)보다 넉넉히
            urlPattern: /\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'docent-audio',
              expiration: { maxEntries: 600, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 작품 이미지: 오프라인 썸네일용
            urlPattern: /\/images\/wiki\/.*\.(jpg|jpeg|png|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'docent-images',
              expiration: { maxEntries: 600, maxAgeSeconds: 90 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/claude/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide': ['lucide-react'],
        },
      },
    },
  },
});
