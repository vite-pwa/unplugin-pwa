import { describe, expect, it } from 'vitest'
import { isDualServiceWorker } from '../src/dual-sw-utilities'

describe('dual service worker utilities', () => {
  it('returns true for generate-sw with swType classic-and-module', () => {
    const ctx = {
      strategy: 'generate-sw',
      resolvedOptions: {
        generateSW: { swType: 'classic-and-module' },
      },
    } as any

    expect(isDualServiceWorker(ctx)).toBe(true)
  })

  it('returns false for generate-sw with another swType (or undefined)', () => {
    const ctx = {
      strategy: 'generate-sw',
      resolvedOptions: {
        generateSW: { swType: 'module' },
      },
    } as any

    expect(isDualServiceWorker(ctx)).toBe(false)
  })

  it('returns true for build-sw with swType classic-and-module', () => {
    const ctx = {
      strategy: 'build-sw',
      resolvedOptions: {
        buildSW: { swType: 'classic-and-module' },
      },
    } as any

    expect(isDualServiceWorker(ctx)).toBe(true)
  })

  it('returns false for build-sw with another swType (or undefined)', () => {
    const ctx = {
      strategy: 'build-sw',
      resolvedOptions: {
        // Simulamos que ni siquiera está definido buildSW para cubrir el optional chaining (?.)
      },
    } as any

    expect(isDualServiceWorker(ctx)).toBe(false)
  })

  it('returns false for any other strategy', () => {
    const ctx = {
      strategy: 'inject-manifest',
      resolvedOptions: {},
    } as any

    expect(isDualServiceWorker(ctx)).toBe(false)
  })
})
