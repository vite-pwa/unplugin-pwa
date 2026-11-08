import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { prepareSwNamesAndGlobDirectory } from '../src/dev/prepare-sw-names-and-glob-directory'

describe('prepareSwNamesAndGlobDirectory', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'unplugin-pwa-'))
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it.each([
    ['relative', () => path.relative(process.cwd(), path.join(root, 'dist'))],
    ['absolute', () => path.join(root, 'dist')],
  ])('should write the dev service worker to the temp folder with a %s outDir', async (_, outDir) => {
    const tempFolder = path.join(root, 'dev-dist')
    const ctx: any = {
      strategy: 'inject-manifest',
      outDir: outDir(),
      resolvedOptions: {
        injectManifest: { swSrc: path.join(root, 'public', 'sw.js'), swDest: path.join(root, 'dist', 'sw.js') },
        devOptions: { resolveTempFolder: () => tempFolder },
      },
      dev: { options: { swNames: { hasNames: false } } },
    }

    await prepareSwNamesAndGlobDirectory(ctx)

    expect(path.resolve(ctx.dev.options.swNames.devSWDest)).toBe(path.join(tempFolder, 'sw.js'))
  })
})
