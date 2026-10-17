import { fileURLToPath } from 'node:url'
import {
  DEV_PWA_ASSETS_NAME,
  DEV_READY_NAME,
  DEV_REGISTER_SW_NAME,
  DEV_SWITCHER_NAME,
} from '@unplugin-pwa/core/constants'
import { defineConfig } from 'tsdown'
import {
  attw,
  pwaBanner as banner,
  cleanupJSTypes,
  publint,
} from '../../tsdown-helper'

const cwd = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig([{
  entry: [
    {
      'node/*': ['./src/node/*.ts'],
      'node/config/*': ['./src/node/config/*.ts'],
      'node/dev/*': ['./src/node/dev/*.ts'],
      'node/plugins/*': ['./src/node/plugins/*.ts'],
    },
  ],
  platform: 'node',
  clean: true,
  dts: true,
  banner,
  attw,
  publint,
  deps: {
    neverBundle: [
      '@vitejs/devtools',
      '@vitejs/devtools-kit',
      'devframe',
      'vite',
      'rolldown',
      '@rolldown/pluginutils',
      '@unplugin-pwa/core',
      '@vite-pwa/workbox-build',
      '@vite-pwa/workbox-window',
      'sirv',
    ],
  },
  hooks: {
    'build:done': async () => {
      await cleanupJSTypes(cwd)
    },
  },
}, {
  entry: {
    'client/build/*': ['./src/client/build/*.ts'],
    'client/dev/*': ['./src/client/dev/*.ts'],
    'client/dev/vite/*': ['./src/client/dev/vite/*.ts'],
  },
  platform: 'browser',
  clean: false,
  banner,
  define: {
    'import.meta.PWA_ESM_FALLBACK_SW': 'import.meta.PWA_ESM_FALLBACK_SW',
    'import.meta.PWA_SW_URL': 'import.meta.PWA_SW_URL',
    'import.meta.PWA_SW_CLASSIC_URL': 'import.meta.PWA_SW_CLASSIC_URL',
    'import.meta.PWA_SW_MODULE_URL': 'import.meta.PWA_SW_MODULE_URL',
    'import.meta.PWA_SW_SCOPE': 'import.meta.PWA_SW_SCOPE',
    'import.meta.PWA_SW_TYPE': 'import.meta.PWA_SW_TYPE',
    'import.meta.PWA_SW_UPDATE_VIA_CACHE': 'import.meta.PWA_SW_UPDATE_VIA_CACHE',
    'import.meta.PWA_DEV_SERVER': 'import.meta.PWA_DEV_SERVER',
    'import.meta.PWA_SW_AUTO_UPDATE': 'import.meta.PWA_SW_AUTO_UPDATE',
    'import.meta.PWA_DEV_ENABLED': 'import.meta.PWA_DEV_ENABLED',
    'import.meta.PWA_DEV_UI_ENABLED': 'import.meta.PWA_DEV_UI_ENABLED',
    // HMR
    'import.meta.PWA_DEV_REGISTER_SW_EVENT_NAME': JSON.stringify(DEV_REGISTER_SW_NAME),
    'import.meta.PWA_DEV_PWA_ASSETS_EVENT_NAME': JSON.stringify(DEV_PWA_ASSETS_NAME),
    'import.meta.PWA_DEV_READY_EVENT_NAME': JSON.stringify(DEV_READY_NAME),
    'import.meta.PWA_DEV_PWA_SWITCHER_EVENT_NAME': JSON.stringify(DEV_SWITCHER_NAME),
    'import.meta.PWA_DEV_CURRENT_SW_TYPE': 'import.meta.PWA_DEV_CURRENT_SW_TYPE',
  },
  deps: {
    neverBundle: [
      '@vite-pwa/workbox-window',
      'preact/hooks',
      'react',
      'solid-js',
      'svelte/store',
      'vue',
    ],
  },
  dts: false,
}])
