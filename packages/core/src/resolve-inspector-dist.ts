import { createRequire, findPackageJSON } from 'node:module'
import { dirname, resolve } from 'node:path'

/**
 * Locate the built-in inspector folder.
 */
export function resolveInspectorDist(): string | undefined {
  let inspectorJSON: string | undefined

  try {
    inspectorJSON = findPackageJSON('@unplugin-pwa/inspector', import.meta.url)
  }
  catch {
    try {
      inspectorJSON = createRequire(import.meta.url).resolve('@unplugin-pwa/inspector/package.json')
    }
    catch {}
  }

  return inspectorJSON
    ? resolve(dirname(inspectorJSON), 'dist')
    : undefined
}
