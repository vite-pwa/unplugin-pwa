import type { PWAPluginContext } from '../context-types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function tryStatSync(file: string): fs.Stats | undefined {
  try {
    // The "throwIfNoEntry" is a performance optimization for cases where the file does not exist
    return fs.statSync(file, { throwIfNoEntry: false })
  }
  catch {
    // Ignore errors
  }
}

function findNearestPackageDir(basedir: string): string | null {
  while (basedir) {
    if (tryStatSync(path.join(basedir, 'package.json'))?.isFile()) {
      return basedir
    }

    const nextBasedir = path.dirname(basedir)
    if (nextBasedir === basedir)
      break
    basedir = nextBasedir
  }

  return null
}

function resolveTempFolder(root: string): string {
  if (typeof process.versions.deno === 'string') {
    return path.resolve(root, '.pwa-dev-dist')
  }

  return path.resolve(findNearestPackageDir(root) ?? root, 'node_modules', '.pwa-dev-dist')
}

/**
 * Prepares the temp folder for the development service worker.
 *
 * @param ctx The PWA plugin context.
 * @param root The project root used to find the nearest package.
 */
export async function prepareTempFolder(
  ctx: PWAPluginContext<any, any, any>,
  root: string = process.cwd(),
) {
  const internalOptions = ctx.dev.options!
  const tempFolderResolver = ctx.resolvedOptions.devOptions?.resolveTempFolder
  const tempFolder = internalOptions.tempFolder
    ? internalOptions.tempFolder
    : tempFolderResolver
      ? await tempFolderResolver()
      : resolveTempFolder(path.resolve(root))

  fs.rmSync(tempFolder, { force: true, recursive: true })

  fs.mkdirSync(tempFolder, { recursive: true })

  ctx.dev.options!.tempFolder = tempFolder
}
