import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { prepareSwNames } from '../src/prepare-sw-names'

function createCtx(strategy: string, resolvedOptions: Record<string, any>, filename?: string): any {
  return {
    strategy,
    outDir: 'dist',
    consumerOptions: { filename },
    resolvedOptions,
    swNames: undefined,
  }
}

describe('prepareSwNames', () => {
  it('generate-sw: defaults to sw.js inside outDir', () => {
    const ctx = createCtx('generate-sw', { generateSW: {} })
    prepareSwNames(ctx)
    const expected = path.resolve(process.cwd(), 'dist/sw.js').replace(/\\/g, '/')
    expect(ctx.resolvedOptions.generateSW.swDest).toBe(expected)
    expect(ctx.swNames.hasNames).toBe(true)
    expect(ctx.swNames).toHaveProperty('name')
    expect(ctx.swNames.name).toBe(expected)
    expect(ctx.swNames).toHaveProperty('classic')
    expect(ctx.swNames.classic).toBe('dist/sw-classic.js')
    expect(ctx.swNames).toHaveProperty('module')
    expect(ctx.swNames.module).toBe('dist/sw-module.js')
  })

  it('generate-sw: honours a custom filename', () => {
    const ctx = createCtx('generate-sw', { generateSW: {} }, 'custom-sw.js')
    prepareSwNames(ctx)
    const expected = path.resolve(process.cwd(), 'dist/custom-sw.js').replace(/\\/g, '/')
    expect(ctx.resolvedOptions.generateSW.swDest).toBe(expected)
    expect(ctx.swNames.hasNames).toBe(true)
    expect(ctx.swNames).toHaveProperty('name')
    expect(ctx.swNames.name).toBe(expected)
    expect(ctx.swNames).toHaveProperty('classic')
    expect(ctx.swNames.classic).toBe('dist/custom-sw-classic.js')
    expect(ctx.swNames).toHaveProperty('module')
    expect(ctx.swNames.module).toBe('dist/custom-sw-module.js')
  })

  it('build-sw: derives swDest from swSrc', () => {
    const ctx = createCtx('build-sw', { buildSW: { swSrc: 'src/sw.ts' } })
    prepareSwNames(ctx)
    const expected = path.resolve(process.cwd(), 'dist/sw.js').replace(/\\/g, '/')
    expect(ctx.resolvedOptions.buildSW.swDest).toBe(expected)
    expect(ctx.swNames.hasNames).toBe(true)
    expect(ctx.swNames).toHaveProperty('name')
    expect(ctx.swNames.name).toBe(expected)
    expect(ctx.swNames).toHaveProperty('classic')
    expect(ctx.swNames.classic).toBe('dist/sw-classic.js')
    expect(ctx.swNames).toHaveProperty('module')
    expect(ctx.swNames.module).toBe('dist/sw-module.js')
  })
})
