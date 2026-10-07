import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGenerateRegisterSW } from '../src/create-generate-register-sw-script'
import { preparePWAContext } from '../src/prepare-pwa-context'

vi.mock('../src/create-generate-register-sw-script', () => ({
  createGenerateRegisterSW: vi.fn(async () => '<script>register</script>'),
}))
vi.mock('../src/create-web-manifest-html-link', () => ({
  createWebManifestHtmlLink: vi.fn(() => '<link rel="manifest">'),
}))
vi.mock('@vite-pwa/workbox-build/build/vite/generate-sw', () => ({
  generateSW: vi.fn(async (options: any) => ({ called: 'generateSW', options })),
}))

function createCtx(overrides: Record<string, any> = {}, resolvedOptions: Record<string, any> = {}): any {
  return preparePWAContext({
    bundler: 'vite',
    strategy: 'generate-sw',
    devEnvironment: false,
    useImportRegister: false,
    consumerOptions: {},
    resolvedOptions: {
      disable: false,
      base: '/',
      buildBase: '/app/',
      scope: '/app/',
      injectRegister: 'auto',
      manifest: {},
      manifestFilename: 'manifest.webmanifest',
      generateSW: { swDest: 'sw.js' },
      ...resolvedOptions,
    },
    ...overrides,
  } as any)
}

beforeEach(() => {
  vi.mocked(createGenerateRegisterSW).mockResolvedValue('<script>register</script>')
})

describe('preparePWAContext: dev defaults', () => {
  it('initialises ctx.dev.options with classic by default', () => {
    const ctx = createCtx()
    expect(ctx.dev.options.swType).toBe('classic')
    expect(ctx.dev.options.swNames.hasNames).toBe(false)
    expect(ctx.dev.options.swAssetKeys).toBeInstanceOf(Set)
    expect(ctx.dev.options.swAssetsPaths).toBeInstanceOf(Map)
  })

  it('takes swType from consumer devOptions', () => {
    const ctx = createCtx({ consumerOptions: { devOptions: { type: 'module' } } })
    expect(ctx.dev.options.swType).toBe('module')
  })
})

describe('webManifestData', () => {
  it('is undefined without manifest', () => {
    expect(createCtx({}, { manifest: false }).webManifestData()).toBeUndefined()
  })

  it('build: href uses buildBase and exposes the link tag', () => {
    const data = createCtx({}, { useCredentials: true }).webManifestData()
    expect(data.href).toBe('/app/manifest.webmanifest')
    expect(data.useCredentials).toBe(true)
    expect(data.toLinkTag()).toBe('<link rel="manifest">')
  })

  it('dev: href uses base', () => {
    const data = createCtx({ devEnvironment: true }).webManifestData()
    expect(data.href).toBe('/manifest.webmanifest')
  })
})

describe('registerSWData', () => {
  it('is undefined when the plugin is disabled', async () => {
    expect(await createCtx({}, { disable: true }).registerSWData()).toBeUndefined()
  })

  it('is undefined in dev when devOptions.enabled is not set', async () => {
    expect(await createCtx({ devEnvironment: true }).registerSWData()).toBeUndefined()
  })

  it('is undefined with manual registration or virtual import', async () => {
    expect(await createCtx({}, { injectRegister: false }).registerSWData()).toBeUndefined()
    expect(await createCtx({ useImportRegister: true }).registerSWData()).toBeUndefined()
  })

  it('build: resolves "auto" to "script" and returns the register info', async () => {
    const ctx = createCtx()
    const data = await ctx.registerSWData()

    expect(ctx.resolvedOptions.injectRegister).toBe('script')
    expect(createGenerateRegisterSW).toHaveBeenCalledWith(ctx, false, true)
    expect(data).toMatchObject({
      shouldRegisterSW: true,
      module: false,
      mode: 'script',
      scope: '/app/',
      type: 'classic',
      inlinePath: '/app/registerSW.js',
      registerPath: '/app/registerSW.js',
    })
    expect(data.toScriptTag()).toBe('<script>register</script>')
  })

  it('dev enabled: uses devOptions.type, base and the dev sw name', async () => {
    const ctx = createCtx({ devEnvironment: true }, { devOptions: { enabled: true, type: 'module' } })
    const data = await ctx.registerSWData()

    expect(createGenerateRegisterSW).toHaveBeenCalledWith(ctx, true, true)
    expect(data).toMatchObject({
      shouldRegisterSW: true,
      type: 'module',
      inlinePath: '/dev-sw.js?dev-sw',
      registerPath: '/registerSW.js',
    })
  })

  it('reports module=true for dual service workers', async () => {
    const ctx = createCtx({}, { generateSW: { swType: 'classic-and-module' } })
    expect((await ctx.registerSWData()).module).toBe(true)
  })
})

describe('build helpers', () => {
  it('build.generateSW dispatches to the vite implementation with the resolved options', async () => {
    const ctx = createCtx()
    expect(await ctx.build.generateSW()).toEqual({
      called: 'generateSW',
      options: ctx.resolvedOptions.generateSW,
    })
  })

  it('dev.generateSW merges the given options over the resolved ones', async () => {
    const ctx = createCtx()
    const result: any = await ctx.dev.generateSW({ swDest: 'dev-sw.js' })
    expect(result.options).toEqual({ swDest: 'dev-sw.js' })
    expect(ctx.resolvedOptions.generateSW.swDest).toBe('sw.js')
  })
})

describe('runBuild', () => {
  it.each([
    ['self-destroy-sw', 'selfDestroyingSW'],
    ['build-sw', 'buildSW'],
    ['generate-sw', 'generateSW'],
    ['inject-manifest', 'injectManifest'],
  ] as const)('strategy %s runs ctx.build.%s only', async (strategy, method) => {
    const ctx = createCtx({ strategy })
    ctx.build = {
      selfDestroyingSW: vi.fn(async () => true),
      buildSW: vi.fn(async () => ({ id: 'buildSW' })),
      generateSW: vi.fn(async () => ({ id: 'generateSW' })),
      injectManifest: vi.fn(async () => ({ id: 'injectManifest' })),
    }

    await ctx.runBuild()

    for (const name of Object.keys(ctx.build))
      expect(ctx.build[name]).toHaveBeenCalledTimes(name === method ? 1 : 0)
  })
})
