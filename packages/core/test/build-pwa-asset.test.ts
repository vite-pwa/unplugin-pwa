import { describe, expect, it } from 'vitest'
import { buildPwaAsset } from '../src/build-pwa-asset'

describe('build-pwa-asset: NODE_ENV injection', () => {
  const dummyCode = `
    export const env = process.env.NODE_ENV;
    if (process.env.NODE_ENV !== 'production') {
      console.log('WORKBOX DEBUG LOG');
    }
  `

  const createMockContext = (mode: string, devEnvironment: boolean): any => ({
    consumerOptions: {},
    resolvedOptions: {
      strategy: 'generate-sw',
      base: '/',
      buildBase: '/',
      scope: '/',
      updateViaCache: 'imports',
      minify: mode === 'production',
      generateSW: { mode },
    },
    devEnvironment,
    dev: { options: { swType: 'classic' } },
  })

  it('should inject production NODE_ENV and remove debug logs when mode is production', async () => {
    const ctx = createMockContext('production', false)
    const result = await buildPwaAsset(dummyCode, ctx as any)

    // Should contain the value production
    expect(result).toMatch(/[`'"]production[`'"]/)
    // The bundler (Rollup) should have removed the console.log because it is unreachable code
    expect(result).not.toContain('WORKBOX DEBUG LOG')
  })

  it('should inject development NODE_ENV and keep debug logs when devEnvironment is true', async () => {
    const ctx = createMockContext('development', true)
    const result = await buildPwaAsset(dummyCode, ctx as any)

    // Should contain the value development
    expect(result).toMatch(/[`'"]development[`'"]/)
    // The console.log should be kept because the condition is true
    expect(result).toContain('WORKBOX DEBUG LOG')
  })

  it('should inject development NODE_ENV when mode is development even if not in devEnvironment (vite build --mode development)', async () => {
    // devEnvironment is false (we are building), but mode is development
    const ctx = createMockContext('development', false)
    const result = await buildPwaAsset(dummyCode, ctx as any)

    expect(result).toMatch(/[`'"]development[`'"]/)
    expect(result).toContain('WORKBOX DEBUG LOG')
  })
})
