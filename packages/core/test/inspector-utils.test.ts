import { describe, expect, it } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import { preparePWAConfigurationData, prepareServiceWorkerData } from '../src/inspector-utils'

function createCtx(overrides: Record<string, any> = {}): any {
  return {
    base: '/',
    rootDir: '/project',
    strategy: 'generate-sw',
    sources: new Set<string>(),
    resolvedOptions: {
      disable: false,
      swType: 'classic',
      manifest: { name: 'app' },
      devOptions: { enabled: false },
      injectManifest: { swSrc: 'src/sw.ts' },
    },
    dev: {
      options: {
        swType: 'classic',
        swNames: { name: 'dev-sw.js' },
        swAssetKeys: new Set<string>(),
      },
    },
    ...overrides,
  }
}

describe('preparePWAConfigurationData', () => {
  it('maps the context into the inspector configuration', () => {
    const ctx = createCtx()
    ctx.resolvedOptions.devOptions.enabled = true
    ctx.resolvedOptions.disable = true

    expect(preparePWAConfigurationData(ctx)).toEqual({
      version: packageJson.version,
      base: '/',
      swEnabled: false,
      strategy: 'generate-sw',
      swType: 'classic',
      swDevEnabled: true,
      currentSWType: 'classic',
      swNames: { name: 'dev-sw.js' },
      manifest: { name: 'app' },
    })
  })
})

describe('prepareServiceWorkerData', () => {
  it('returns no chunks nor swType when dev is disabled, and relative dependencies', () => {
    const ctx = createCtx({ sources: new Set(['/project/src/a.ts', '/project/src/b.ts']) })
    expect(prepareServiceWorkerData(ctx)).toEqual({
      swType: undefined,
      chunks: undefined,
      dependencies: ['src/a.ts', 'src/b.ts'],
    })
  })

  it('filters source maps from chunks in dev', () => {
    const ctx = createCtx()
    ctx.resolvedOptions.devOptions.enabled = true
    ctx.dev.options.swAssetKeys = new Set(['index.html', 'main.js', 'main.js.map'])
    const data = prepareServiceWorkerData(ctx)
    expect(data.swType).toBe('classic')
    expect(data.chunks).toEqual(['index.html', 'main.js'])
  })

  it('inject-manifest: removes swSrc from dependencies and relativizes chunks except the sw itself', () => {
    const ctx = createCtx({
      strategy: 'inject-manifest',
      sources: new Set(['/project/src/sw.ts', '/project/src/a.ts']),
    })
    ctx.resolvedOptions.devOptions.enabled = true
    ctx.dev.options.swAssetKeys = new Set(['/dev-sw.js', '/project/src/a.ts'])

    const data = prepareServiceWorkerData(ctx)
    expect(data.dependencies).toEqual(['src/a.ts'])
    expect(data.chunks).toEqual(['/dev-sw.js', 'src/a.ts'])
  })
})
