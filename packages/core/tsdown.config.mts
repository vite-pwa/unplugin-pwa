import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'
import { pwaBanner as banner, cleanupDistFiles } from '../../tsdown-helper'

const cwd = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  entry: [
    {
      '*': ['./src/*.ts'],
      'dev/*': ['./src/dev/*.ts'],
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
      'vite',
      'rolldown',
      '@vite-pwa/workbox-window',
      '@vite-pwa/workbox-build',
    ],
  },
  hooks: {
    'build:done': async () => {
      await cleanupDistFiles(cwd, [
        'types.mjs',
        'context-types.mjs',
      ])
    },
  },
})
