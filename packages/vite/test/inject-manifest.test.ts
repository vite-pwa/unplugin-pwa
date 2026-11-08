import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { VitePWA } from '@unplugin-pwa/vite'
import { build, createServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe.each([
  ['the root is the cwd', true],
  ['the root is not the cwd', false],
])('injectManifest when %s', (_, chdir) => {
  const cwd = process.cwd()
  let root: string

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'unplugin-pwa-vite-'))
    await mkdir(join(root, 'public'))
    await writeFile(join(root, 'package.json'), '{}')
    await writeFile(join(root, 'index.html'), '<!doctype html><html><head><title>pwa</title></head><body></body></html>')
    await writeFile(join(root, 'public', 'sw.js'), 'self.__WB_MANIFEST\n')
    if (chdir) {
      process.chdir(root)
    }
  })

  afterEach(async () => {
    process.chdir(cwd)
    await rm(root, { recursive: true, force: true })
  })

  it('should build the service worker', async () => {
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

  it('should serve the service worker in dev', async () => {
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      server: { host: '127.0.0.1', port: 0, ws: false },
      plugins: [VitePWA({
        strategies: 'injectManifest',
        injectManifest: { swSrc: 'public/sw.js' },
        devOptions: { enabled: true },
      })],
    })
    try {
      await server.listen()
      const response = await fetch(new URL('/sw.js', server.resolvedUrls!.local[0]))
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toContain('javascript')
      const sw = await response.text()
      expect(sw).toContain('index.html')
      expect(sw).not.toContain('self.__WB_MANIFEST')
      expect(existsSync(join(root, 'node_modules', '.pwa-dev-dist'))).toBe(true)
    }
    finally {
      await server.close()
    }
  })
})
