import { describe, expect, it } from 'vitest'
import { isDualServiceWorker } from '../src/dual-sw-utilities'

const ctx = (strategy: string, resolvedOptions: Record<string, any>): any => ({ strategy, resolvedOptions })

describe('isDualServiceWorker', () => {
  it('generate-sw with classic-and-module', () => {
    expect(isDualServiceWorker(ctx('generate-sw', { generateSW: { swType: 'classic-and-module' } }))).toBe(true)
  })

  it('build-sw with classic-and-module', () => {
    expect(isDualServiceWorker(ctx('build-sw', { buildSW: { swType: 'classic-and-module' } }))).toBe(true)
  })

  it('is false for a single swType', () => {
    expect(isDualServiceWorker(ctx('generate-sw', { generateSW: { swType: 'classic' } }))).toBe(false)
    expect(isDualServiceWorker(ctx('build-sw', { buildSW: { swType: 'module' } }))).toBe(false)
  })

  it('is false when the strategy options are missing', () => {
    expect(isDualServiceWorker(ctx('generate-sw', {}))).toBe(false)
  })

  it('is false for other strategies even if generateSW says dual', () => {
    expect(isDualServiceWorker(ctx('inject-manifest', { generateSW: { swType: 'classic-and-module' } }))).toBe(false)
    expect(isDualServiceWorker(ctx('self-destroy-sw', {}))).toBe(false)
  })
})
