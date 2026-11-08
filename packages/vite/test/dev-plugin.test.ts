import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { DevPlugin } from '../src/node/plugins/dev'

describe('dev plugin: load', () => {
  let dir: string
  let load: (id: string) => Promise<string | undefined>

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'unplugin-pwa-dev-'))
    const classicSW = join(dir, 'sw-classic.js')
    await writeFile(classicSW, 'classic sw')
    const plugin: any = DevPlugin({
      envApi: true,
      base: '/',
      viteConfig: { build: {} },
      resolvedOptions: {},
      dev: {
        options: {
          swGenerated: true,
          swNames: { name: 'sw.js', classic: 'sw-classic.js', module: 'sw-module.js' },
          swAssetsPaths: new Map([['/sw-classic.js', classicSW]]),
        },
      },
    } as any)
    load = id => plugin.load.handler.call({}, id)
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('should load a generated service worker', async () => {
    expect(await load('/sw-classic.js')).toBe('classic sw')
  })

  it('should skip a service worker name that was not generated', async () => {
    expect(await load('/sw.js')).toBeUndefined()
  })
})
