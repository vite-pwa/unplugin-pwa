import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { VitePWA } from '@unplugin-pwa/vite'
import { build } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('build sw plugin', () => {
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'unplugin-pwa-vite-'))
    await writeFile(join(root, 'index.html'), '<!doctype html><html><head><title>pwa</title></head><body></body></html>')
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  it.each(['generateBundle', 'writeBundle'])('should report a %s error instead of building the service worker', async (hook) => {
    await expect(build({
      root,
      build: { outDir: join(root, 'dist') },
      configFile: false,
      logLevel: 'silent',
      plugins: [
        VitePWA(),
        {
          name: 'fail',
          [hook]() {
            throw new Error(`${hook} failed`)
          },
        },
      ],
    })).rejects.toThrow(`${hook} failed`)

    expect(existsSync(join(root, 'dist', 'sw.js'))).toBe(false)
  })

  it('should build the service worker', async () => {
    await build({ root, build: { outDir: join(root, 'dist') }, configFile: false, logLevel: 'silent', plugins: [VitePWA()] })

    expect(existsSync(join(root, 'dist', 'sw.js'))).toBe(true)
  })

  it('should build the service worker without writing the bundle', async () => {
    const outDir = join(root, 'dist')
    await build({ root, build: { outDir }, configFile: false, logLevel: 'silent', plugins: [VitePWA()] })
    await rm(join(outDir, 'sw.js'))

    await build({ root, build: { outDir, write: false }, configFile: false, logLevel: 'silent', plugins: [VitePWA()] })

    expect(existsSync(join(outDir, 'sw.js'))).toBe(true)
  })
})
