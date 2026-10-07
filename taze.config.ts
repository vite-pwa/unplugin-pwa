import { defineConfig } from 'taze'

export default defineConfig({
  recursive: true,
  write: true,
  includeLocked: true,
  maturityPeriod: 7,
  peer: false,
  mode: 'minor',
  exclude: [
    'taze',
    'node',
    'why-is-node-running',
    'vite@5',
    'vite-plugin-inspect@0',
    'vite@6',
    'vite@7',
    'vite-plugin-inspect@11',
  ],
  depFields: {
    packageManager: false,
  },
})
