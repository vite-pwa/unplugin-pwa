import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_CONFIG_FILES,
  loadConfiguration,
  prepareManifest,
  resolveDefaultConfig,
  resolvePwaConfiguration,
} from '../src/config'

vi.mock('../src/pwa-assets/options', () => ({
  resolvePWAAssetsOptions: vi.fn(() => 'resolved-pwa-assets'),
}))

let tmp: string
let emptyDir: string

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pwa-config-'))
  emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pwa-empty-'))
  const write = (name: string, code: string) => fs.writeFileSync(path.join(tmp, name), code)
  write('object.mjs', 'export default { name: "from-object", nested: { a: 1 } }\n')
  write('sync-fn.mjs', 'export default () => ({ name: "from-sync-fn" })\n')
  write('async-fn.mjs', 'export default async () => ({ name: "from-async-fn" })\n')
  write('named.mjs', 'export const config = { name: "from-named-config" }\n')
  write('merge.mjs', 'export default () => ({ name: "file", nested: { a: 1, b: 2 }, onlyInFile: true })\n')
  write('pwa.config.mjs', 'export default {}\n')
  write('pwa.config.js', 'export default {}\n')
})

afterAll(() => {
  fs.rmSync(tmp, { recursive: true, force: true })
  fs.rmSync(emptyDir, { recursive: true, force: true })
})

describe('loadConfiguration', () => {
  it('returns the options untouched when there is no path', async () => {
    const options = { strategies: 'generateSW' } as any
    expect(await loadConfiguration(options)).toBe(options)
  })

  it('loads the default export object and stores the normalized path', async () => {
    const abs = path.join(tmp, 'object.mjs')
    const result: any = await loadConfiguration({ path: abs } as any)
    expect(result.name).toBe('from-object')
    expect(result.path).toBe(abs.replace(/\\/g, '/'))
  })

  it('resolves a relative path against the cwd option', async () => {
    const result: any = await loadConfiguration({ path: 'sync-fn.mjs', cwd: tmp } as any)
    expect(result.name).toBe('from-sync-fn')
    expect(result.path).toBe(path.join(tmp, 'sync-fn.mjs').replace(/\\/g, '/'))
  })

  it('supports async function exports', async () => {
    const result: any = await loadConfiguration({ path: path.join(tmp, 'async-fn.mjs') } as any)
    expect(result.name).toBe('from-async-fn')
  })

  it('falls back to named exports (options / config) when there is no default', async () => {
    const result: any = await loadConfiguration({ path: path.join(tmp, 'named.mjs') } as any)
    expect(result.name).toBe('from-named-config')
  })

  it('mergeOptions: inline options deep-merge over the file config', async () => {
    const result: any = await loadConfiguration({
      path: path.join(tmp, 'merge.mjs'),
      mergeOptions: true,
      name: 'inline',
      nested: { b: 3, c: 4 },
    } as any)
    expect(result.name).toBe('inline')
    expect(result.nested).toEqual({ a: 1, b: 3, c: 4 })
    expect(result.onlyInFile).toBe(true)
  })

  it('without mergeOptions the inline options are ignored', async () => {
    const result: any = await loadConfiguration({
      path: path.join(tmp, 'merge.mjs'),
      name: 'inline',
    } as any)
    expect(result.name).toBe('file')
  })
})

describe('resolveDefaultConfig', () => {
  it('returns undefined when there is no default config file', () => {
    expect(resolveDefaultConfig(emptyDir)).toBeUndefined()
  })

  it('finds the first candidate following DEFAULT_CONFIG_FILES order', () => {
    // both pwa.config.js and pwa.config.mjs exist: .js comes first
    expect(DEFAULT_CONFIG_FILES[0]).toBe('pwa.config.js')
    expect(resolveDefaultConfig(tmp)).toBe(path.resolve(tmp, 'pwa.config.js'))
  })
})

describe('prepareManifest', () => {
  afterEach(() => vi.restoreAllMocks())

  function mockPackageJson(pkg: Record<string, any> | undefined) {
    vi.spyOn(fs, 'existsSync').mockImplementation(p => p === 'package.json' && pkg !== undefined)
    return vi.spyOn(fs, 'readFileSync').mockImplementation(() => JSON.stringify(pkg) as any)
  }

  it('does nothing when manifest is false', () => {
    const read = mockPackageJson({ name: 'pkg' })
    const options: any = { manifest: false }
    prepareManifest(options)
    expect(options.manifest).toBe(false)
    expect(read).not.toHaveBeenCalled()
  })

  it('builds the default manifest from package.json and options', () => {
    mockPackageJson({ name: 'pkg', description: 'desc' })
    const options: any = { base: '/app/', scope: '/app/' }
    prepareManifest(options)
    expect(options.manifest).toEqual({
      name: 'pkg',
      short_name: 'pkg',
      description: 'desc',
      start_url: '/app/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#42b883',
      lang: 'en',
      scope: '/app/',
    })
  })

  it('user manifest values override the defaults', () => {
    mockPackageJson({ name: 'pkg' })
    const options: any = { base: '/', scope: '/', manifest: { name: 'Custom', theme_color: '#000' } }
    prepareManifest(options)
    expect(options.manifest).toMatchObject({ name: 'Custom', short_name: 'pkg', theme_color: '#000' })
  })

  it('works without package.json', () => {
    mockPackageJson(undefined)
    const options: any = { base: '/', scope: '/' }
    prepareManifest(options)
    expect(options.manifest.name).toBeUndefined()
    expect(options.manifest.display).toBe('standalone')
  })
})

describe('resolvePwaConfiguration', () => {
  const resolverOptions = { isDev: false, isWrongInjectManifest: () => false }
  const resolve = (opts: Record<string, any>, resolver: Record<string, any> = {}) =>
    resolvePwaConfiguration({ cwd: emptyDir, ...opts } as any, { ...resolverOptions, ...resolver }) as Promise<any>

  describe('generateSW', () => {
    it('applies the defaults (strategies defaults to generateSW)', async () => {
      const result = await resolve({})
      expect(result).toMatchObject({
        strategy: 'generate-sw',
        swType: 'classic',
        includeManifest: true,
        includeManifestIcons: true,
        includeManifestShortcutIcons: true,
        includeManifestScreenshots: false,
        disable: false,
        injectRegister: 'auto',
        registerType: 'prompt',
        useCredentials: false,
        manifestFilename: 'manifest.webmanifest',
        updateViaCache: 'imports',
        pwaAssets: 'resolved-pwa-assets',
      })
      expect(result.generateSW).toMatchObject({
        inlineWorkboxRuntime: true,
        workboxRuntimeCompatible: true,
        swDest: 'sw.js',
        swType: 'classic',
      })
    })

    it('honours filename and user generateSW options', async () => {
      const result = await resolve({ filename: 'my-sw.js', generateSW: { inlineWorkboxRuntime: false, skipWaiting: true } })
      expect(result.generateSW).toMatchObject({ swDest: 'my-sw.js', inlineWorkboxRuntime: false, skipWaiting: true })
    })

    it('warns about the deprecated workbox option and still uses it', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await resolve({ workbox: { skipWaiting: true } })
      expect(warn).toHaveBeenCalledOnce()
      expect(warn.mock.calls[0][0]).toContain('DEPRECATION WARNING')
      expect(result.generateSW.skipWaiting).toBe(true)
      warn.mockRestore()
    })

    it('generateSW takes precedence over workbox without warning', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await resolve({ workbox: { skipWaiting: true }, generateSW: { clientsClaim: true } })
      expect(warn).not.toHaveBeenCalled()
      expect(result.generateSW.clientsClaim).toBe(true)
      expect(result.generateSW.skipWaiting).toBeUndefined()
      warn.mockRestore()
    })
  })

  describe('injectManifest', () => {
    it('throws without swSrc', async () => {
      await expect(resolve({ strategies: 'injectManifest' })).rejects.toThrow(/without/)
    })

    it('resolves a plain js service worker as inject-manifest', async () => {
      const isWrongInjectManifest = vi.fn(() => false)
      const result = await resolve(
        { strategies: 'injectManifest', filename: 'sw.js', injectManifest: { swSrc: 'public/sw.js' } },
        { isWrongInjectManifest },
      )
      expect(isWrongInjectManifest).toHaveBeenCalledWith(expect.stringContaining('public/sw.js'))
      expect(result.strategy).toBe('inject-manifest')
      expect(result.injectManifest).toMatchObject({ swSrc: 'public/sw.js', swDest: 'sw.js' })
    })

    it.each(['src/sw.ts', 'src/sw.mts'])('throws for %s (TypeScript should use buildSW)', async (swSrc) => {
      await expect(
        resolve({ strategies: 'injectManifest', injectManifest: { swSrc } }),
      ).rejects.toThrow(/buildSW/)
    })

    it('throws when the hook says the service worker is not a valid static asset', async () => {
      await expect(
        resolve(
          { strategies: 'injectManifest', injectManifest: { swSrc: 'public/sw.js' } },
          { isWrongInjectManifest: () => true },
        ),
      ).rejects.toThrow(/static asset/)
    })

    it('in dev (without devOptions.enabled) warns and falls back to build-sw', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await resolve(
        { strategies: 'injectManifest', filename: 'sw.js', injectManifest: { swSrc: 'src/sw.ts' } },
        { isDev: true },
      )
      expect(warn).toHaveBeenCalledOnce()
      expect(result.strategy).toBe('build-sw')
      expect(result.buildSW).toMatchObject({ swSrc: 'src/sw.ts', swDest: 'sw.js' })
      warn.mockRestore()
    })

    it('in dev with devOptions.enabled it throws instead of warning', async () => {
      await expect(
        resolve(
          { strategies: 'injectManifest', devOptions: { enabled: true }, injectManifest: { swSrc: 'src/sw.ts' } },
          { isDev: true },
        ),
      ).rejects.toThrow(/WRONG CONFIGURATION/)
    })
  })

  describe('buildSW', () => {
    it('resolves build-sw with inlineWorkboxRuntime, workboxRuntimeCompatible and baseUrl enabled by default', async () => {
      const result = await resolve({ strategies: 'buildSW', buildSW: { swSrc: 'src/sw.ts' } })
      expect(result.strategy).toBe('build-sw')
      expect(result.buildSW).toMatchObject({
        swSrc: 'src/sw.ts',
        swDest: 'sw.js',
        inlineWorkboxRuntime: true,
        workboxRuntimeCompatible: true,
      })
    })
  })

  describe('invalid configurations', () => {
    it.each(['selfDestroySW', 'self-destroy-sw'])('%s is no longer supported', async (strategies) => {
      await expect(resolve({ strategies })).rejects.toThrow(/no longer supported/)
    })

    it('throws for an unknown strategy', async () => {
      await expect(resolve({ strategies: 'nope' })).rejects.toThrow(/Unknown strategy/)
    })

    it('generateSW + classic-and-module + inline register throws in build', async () => {
      await expect(
        resolve({ swType: 'classic-and-module', injectRegister: 'inline' }),
      ).rejects.toThrow(/WRONG CONFIGURATION/)
    })

    it('same configuration only warns in dev when devOptions is not enabled', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await resolve(
        { swType: 'classic-and-module', injectRegister: 'inline' },
        { isDev: true },
      )
      expect(warn).toHaveBeenCalledOnce()
      expect(result.strategy).toBe('generate-sw')
      warn.mockRestore()
    })

    it('injectManifest + classic-and-module swType throws', async () => {
      await expect(
        resolve({ strategies: 'injectManifest', injectManifest: { swSrc: 'public/sw.js', swType: 'classic-and-module' } }),
      ).rejects.toThrow(/classic/)
    })
  })
})
