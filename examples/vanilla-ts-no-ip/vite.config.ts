import process from 'node:process'
import { VitePWA } from '@unplugin-pwa/vite'
import { defineConfig } from 'vite'

const customSW = process.env.SW === 'true'

export default defineConfig({
  mode: 'development',
  logLevel: 'info',
  define: {
    __DATE__: `'${new Date().toISOString()}'`,
  },
  build: {
    sourcemap: process.env.SOURCE_MAP === 'true',
  },
  plugins: [
    VitePWA({
      base: '/',
      /* buildBase: '/test-build-base/', */
      strategies: customSW ? 'build-sw' : 'generate-sw',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      // filename: customSW ? 'custom-sw.js' : 'sw.js',
      minify: false,
      manifest: {
        name: 'PWA Router',
        short_name: 'PWA Router',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // <== don't add slash, for testing
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png', // <== don't remove slash, for testing
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png', // <== don't add slash, for testing
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      generateSW: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      buildSW: {
        swSrc: 'src/custom-sw.ts',
        injectionPoint: false,
      },
      devOptions: {
        enabled: process.env.SW_DEV === 'true',
        type: 'module',
      },
    }),
  ],
})
