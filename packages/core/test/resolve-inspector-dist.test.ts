import * as nodeModule from 'node:module'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveInspectorDist } from '../src/resolve-inspector-dist'

// 1. Mock the native Node.js module before the code is evaluated
vi.mock('node:module', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:module')>()
  return {
    ...actual,
    findPackageJSON: vi.fn(),
    createRequire: vi.fn(),
  }
})

describe('resolveInspectorDist', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves correctly using findPackageJSON', () => {
    const mockPackagePath = '/mocked/path/@vite-pwa/inspector/package.json'

    // Force the first attempt to succeed
    vi.mocked(nodeModule.findPackageJSON).mockReturnValue(mockPackagePath)

    const result = resolveInspectorDist()

    expect(result).toBe(resolve(dirname(mockPackagePath), 'dist'))
    expect(nodeModule.findPackageJSON).toHaveBeenCalledWith(
      '@vite-pwa/inspector',
      expect.anything(),
    )
    expect(nodeModule.createRequire).not.toHaveBeenCalled()
  })

  it('falls back to createRequire if findPackageJSON throws an error', () => {
    const mockPackagePath = '/mocked/fallback/@vite-pwa/inspector/package.json'
    const mockResolve = vi.fn().mockReturnValue(mockPackagePath)

    // Force the first attempt to fail
    vi.mocked(nodeModule.findPackageJSON).mockImplementation(() => {
      throw new Error('Not found')
    })

    // Setup the fallback
    vi.mocked(nodeModule.createRequire).mockReturnValue({
      resolve: mockResolve,
    } as any)

    const result = resolveInspectorDist()

    expect(result).toBe(resolve(dirname(mockPackagePath), 'dist'))
    expect(nodeModule.createRequire).toHaveBeenCalled()
    expect(mockResolve).toHaveBeenCalledWith('@vite-pwa/inspector/package.json')
  })

  it('returns undefined if both methods fail', () => {
    // Both attempts throw an error
    vi.mocked(nodeModule.findPackageJSON).mockImplementation(() => {
      throw new Error('Not found in findPackageJSON')
    })
    vi.mocked(nodeModule.createRequire).mockReturnValue({
      resolve: () => {
        throw new Error('Not found in createRequire')
      },
    } as any)

    const result = resolveInspectorDist()

    expect(result).toBeUndefined()
  })
})
