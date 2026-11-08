import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { preparePWAStrategy } from '../src/helpers'

const normalizePath = (p: string) => p.replace(/\\/g, '/')

describe('preparePWAStrategy: globDirectory resolution', () => {
  const createMockCtx = (strategy: 'generate-sw' | 'inject-manifest', options: any = {}) => ({
    strategy,
    resolvedOptions: {
      base: '/',
      [strategy === 'generate-sw' ? 'generateSW' : 'injectManifest']: options,
    },
  } as any)

  it('should resolve default globDirectory to absolute path when invoked from repository root', async () => {
    const repoRoot = path.resolve('/mock-repo')
    const viteRoot = path.resolve(repoRoot, 'docs')
    const outDir = '.vitepress/dist'

    const ctx = createMockCtx('generate-sw')

    await preparePWAStrategy(ctx, viteRoot, outDir, 'assets')

    const expectedPath = normalizePath(path.resolve(viteRoot, outDir))
    const resolvedGlobDir = ctx.resolvedOptions.generateSW.globDirectory

    expect(resolvedGlobDir).toBe(expectedPath)
    expect(path.isAbsolute(resolvedGlobDir)).toBe(true)
  })

  it('should resolve default globDirectory to absolute path when invoked from docs dir', async () => {
    const docsRoot = path.resolve('/mock-repo/docs')
    const outDir = '.vitepress/dist'

    const ctx = createMockCtx('generate-sw')

    await preparePWAStrategy(ctx, docsRoot, outDir, 'assets')

    const expectedPath = normalizePath(path.resolve(docsRoot, outDir))
    const resolvedGlobDir = ctx.resolvedOptions.generateSW.globDirectory

    expect(resolvedGlobDir).toBe(expectedPath)
    expect(path.isAbsolute(resolvedGlobDir)).toBe(true)
  })

  it('should preserve and resolve absolute path for an explicit globDirectory control case', async () => {
    const viteRoot = path.resolve('/mock-repo/docs')
    const customGlob = 'custom-dist'

    const ctx = createMockCtx('generate-sw', { globDirectory: customGlob })

    await preparePWAStrategy(ctx, viteRoot, '.vitepress/dist', 'assets')

    // Ahora esperamos que se resuelva contra process.cwd() (donde sea que corra Vitest),
    // tal cual hace path.resolve con un solo argumento.
    const expectedPath = normalizePath(path.resolve(customGlob))
    const resolvedGlobDir = ctx.resolvedOptions.generateSW.globDirectory

    expect(resolvedGlobDir).toBe(expectedPath)
  })
})

describe('preparePWAStrategy: swSrc resolution', () => {
  it('should resolve a relative swSrc against the root', async () => {
    const root = path.resolve('/mock-repo/app')
    const ctx = {
      strategy: 'inject-manifest',
      resolvedOptions: { base: '/', injectManifest: { swSrc: 'public/sw.js' } },
    } as any

    await preparePWAStrategy(ctx, root, 'dist', 'assets')

    expect(ctx.resolvedOptions.injectManifest.swSrc).toBe(normalizePath(path.resolve(root, 'public/sw.js')))
  })
})
