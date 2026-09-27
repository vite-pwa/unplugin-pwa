import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'
import { pwaBanner as banner, cleanupDistFiles } from '../../tsdown-helper'

const cwd = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  entry: [
    {
      '*': ['./src/*.ts', '!./src/types.ts'],
      'dev/*': ['./src/dev/*.ts'],
      'pwa-assets/*': ['./src/pwa-assets/*.ts'],
    },
  ],
  platform: 'node',
  clean: true,
  dts: true,
  banner,
  attw: {
    profile: 'esm-only',
  },
  deps: {
    neverBundle: [
      'hookable',
      'vite',
      'rolldown',
      '@vite-pwa/assets-generator',
      '@vite-pwa/workbox-window',
      '@vite-pwa/workbox-build',
    ],
  },
  hooks: {
    'build:done': async () => {
      await cleanupDistFiles(cwd, [
        'index.mjs',
        'context-types.mjs',
        'pwa-assets/types.mjs',
      ])
    },
  },
})
