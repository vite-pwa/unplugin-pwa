import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { VitePWA } from '@unplugin-pwa/vite'
import { build, createServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('injectManifest', () => {
  const cwd = process.cwd()
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'unplugin-pwa-vite-'))
    await mkdir(join(root, 'public'))
    await writeFile(join(root, 'index.html'), '<!doctype html><html><head><title>pwa</title></head><body></body></html>')
    await writeFile(join(root, 'public', 'sw.js'), 'self.__WB_MANIFEST\n')
    process.chdir(root)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await rm(root, { recursive: true, force: true })
  })

  it('should build the injectManifest strategy', async () => {
    await build({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [VitePWA({ strategies: 'injectManifest', injectManifest: { swSrc: 'public/sw.js' } })],
    })

    const sw = join(root, 'dist', 'sw.js')
    expect(existsSync(sw)).toBe(true)
    expect(await readFile(sw, 'utf-8')).toContain('index.html')
  })

  it('should start the dev server with the injectManifest strategy', async () => {
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      server: { ws: false },
      plugins: [VitePWA({
        strategies: 'injectManifest',
        injectManifest: { swSrc: 'public/sw.js' },
        devOptions: { enabled: true },
      })],
    })
    await server.close()
  })
})
