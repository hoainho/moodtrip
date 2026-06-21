import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { devEdgeProxy } from './vite.devEdgeProxy';

export default defineConfig({
    server: {
      watch: {
        // Do NOT trigger HMR full-page reloads when in-repo agent/tooling state
        // directories change. They are not app source, but writes to them (e.g.
        // oh-my-claudecode's `.omc/state/*`, Playwright's `test-results/`) otherwise
        // reload the browser mid-session — restarting the intro splash and detaching
        // whatever element is being interacted with, which causes spurious E2E flakiness.
        ignored: [
          '**/.omc/**',
          '**/.sisyphus/**',
          '**/.agent/**',
          '**/.campaign/**',
          '**/test-results/**',
          '**/.playwright-mcp/**',
          '**/playwright-report/**',
        ],
      },
    },
    plugins: [
      tailwindcss(),
      devEdgeProxy(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png', 'maskable-icon-512x512.png'],
        manifest: {
          name: 'MoodTrip - Để cảm xúc dẫn đường',
          short_name: 'MoodTrip',
          description: 'Ứng dụng du lịch AI - Khám phá và tạo lịch trình du lịch dựa trên tâm trạng.',
          theme_color: '#0a0e1a',
          background_color: '#0a0e1a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['travel', 'lifestyle'],
          lang: 'vi',
          icons: [
            {
              src: 'pwa-72x72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: 'pwa-96x96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: 'pwa-128x128.png',
              sizes: '128x128',
              type: 'image/png',
            },
            {
              src: 'pwa-144x144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: 'pwa-152x152.png',
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          screenshots: [
            {
              src: 'screenshot-narrow-1.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'MoodTrip - Trang chủ',
            },
            {
              src: 'screenshot-narrow-2.png',
              sizes: '540x720',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'MoodTrip - Lên kế hoạch',
            },
            {
              src: 'screenshot-wide-1.png',
              sizes: '1024x593',
              type: 'image/png',
              form_factor: 'wide',
              label: 'MoodTrip - Trang chủ Desktop',
            },
            {
              src: 'screenshot-wide-2.png',
              sizes: '1024x593',
              type: 'image/png',
              form_factor: 'wide',
              label: 'MoodTrip - Lịch trình chi tiết',
            },
          ],
          shortcuts: [
            {
              name: 'Tạo lịch trình mới',
              short_name: 'Lịch trình',
              url: '/?action=new-trip',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
            {
              name: 'Mẹo du lịch',
              short_name: 'Mẹo',
              url: '/?view=tips',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'cdn-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/api\.moodtrip\.app\/.*/i,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /\.workers\.dev\/.*/i,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
            'vendor-map': ['maplibre-gl'],
          },
        },
      },
    },
});
