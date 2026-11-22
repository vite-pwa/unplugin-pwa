import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEV_SWITCHER_NAME, VIRTUAL_MODULES, VIRTUAL_MODULES_RESOLVED_PREFIX } from '@unplugin-pwa/core/constants'
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

describe('dev plugin: service worker switch', () => {
  it('should invalidate every virtual register module even when not in swAssetsPaths', async () => {
    const handlers = new Map<string, () => Promise<void>>()
    const invalidated: string[] = []
    const server: any = {
      environments: {
        client: {
          hot: {
            on: (event: string, handler: () => Promise<void>) => handlers.set(event, handler),
            send: () => {},
          },
          moduleGraph: {
            getModuleById: (id: string) => ({ id }),
            invalidateModule: (mod: { id: string }) => invalidated.push(mod.id),
          },
        },
      },
    }
    const plugin: any = DevPlugin({
      envApi: true,
      base: '/',
      strategy: 'generate-sw',
      useImportRegister: true,
      viteConfig: { build: {} },
      resolvedOptions: {
        generateSW: { swType: 'classic-and-module' },
        devOptions: { enabled: true },
      },
      hooks: { callHook: async () => {} },
      dev: {
        options: {
          swType: 'classic',
          swNames: { name: 'sw.js', classic: 'sw-classic.js', module: 'sw-module.js' },
          swAssetsPaths: new Map([['virtual:pwa-register', 'code']]),
        },
      },
    } as any)
    plugin.configureServer(server)

    await handlers.get(DEV_SWITCHER_NAME)!()

    expect(invalidated).toEqual(VIRTUAL_MODULES.map(id => VIRTUAL_MODULES_RESOLVED_PREFIX + id))
  })
})
