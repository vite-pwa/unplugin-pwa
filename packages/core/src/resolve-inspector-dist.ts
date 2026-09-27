import { createRequire, findPackageJSON } from 'node:module'
import { dirname, resolve } from 'node:path'

/**
 * Locate the built-in inspector SPA.
 */
export function resolveInspectorDist(): string | undefined {
  let inspectorJSON: string | undefined

  try {
    inspectorJSON = findPackageJSON(
      '@vite-pwa/inspector',
      typeof __dirname !== 'undefined' ? __dirname : import.meta.url,
    )
  }
  catch {
    try {
      inspectorJSON = createRequire(import.meta.url).resolve('@vite-pwa/inspector/package.json')
    }
    catch {}
  }

  return inspectorJSON
    ? resolve(dirname(inspectorJSON), 'dist')
    : undefined
}
