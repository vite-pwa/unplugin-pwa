import * as fs from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

/**
 * Locate the built inspector SPA. Prefers the path relative to this module,
 * with a fallback through the consuming project's `node_modules` for
 * bundlers that rewrite `import.meta.url`.
 */
export function resolveInspectorDist(_dirname: string): string {
  const local = resolve(_dirname, '../../../inspector/favicon.ico')
  if (fs.existsSync(local)) {
    return dirname(local)
  }
  try {
    const require = createRequire(import.meta.url)
    return resolve(dirname(require.resolve('@vite-pwa/unplugin-pwa-vite/package.json')), 'dist/inspector')
  }
  catch {
    return dirname(local)
  }
}
