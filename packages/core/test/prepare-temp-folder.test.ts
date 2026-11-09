import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { prepareTempFolder } from '../src/dev/prepare-temp-folder'

// We mock node:fs completely to avoid touching the hard drive
vi.mock('node:fs', () => ({
  default: {
    statSync: vi.fn(),
    rmSync: vi.fn(),
    mkdirSync: vi.fn(),
  },
}))

describe('prepareTempFolder', () => {
  beforeEach(() => {
    // We anchor the working directory so the traversal is predictable
    vi.spyOn(process, 'cwd').mockReturnValue('/mock/project/src')
    // By default, we simulate that no folders are found
    vi.mocked(fs.statSync).mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // We clean up the Deno simulation just in case
    delete (process.versions as any).deno
  })

  it('uses existing internalOptions.tempFolder', async () => {
    const ctx = {
      dev: { options: { tempFolder: '/custom/internal/dir' } },
      resolvedOptions: { devOptions: {} },
    } as any

    await prepareTempFolder(ctx)

    expect(fs.rmSync).toHaveBeenCalledWith('/custom/internal/dir', { force: true, recursive: true })
    expect(fs.mkdirSync).toHaveBeenCalledWith('/custom/internal/dir', { recursive: true })
    expect(ctx.dev.options.tempFolder).toBe('/custom/internal/dir')
  })

  it('uses custom resolveTempFolder from devOptions', async () => {
    const customResolver = vi.fn().mockResolvedValue('/resolved/custom/dir')
    const ctx = {
      dev: { options: {} },
      resolvedOptions: { devOptions: { resolveTempFolder: customResolver } },
    } as any

    await prepareTempFolder(ctx)

    expect(customResolver).toHaveBeenCalled()
    expect(ctx.dev.options.tempFolder).toBe('/resolved/custom/dir')
  })

  it('resolves the temp folder in node_modules of the nearest package of the root', async () => {
    const pkgDir = path.resolve('/mock/project')
    vi.mocked(fs.statSync).mockImplementation((file) => {
      return file.toString() === path.join(pkgDir, 'package.json') ? { isFile: () => true } as fs.Stats : undefined as any
    })

    const ctx = {
      dev: { options: {} },
      resolvedOptions: { devOptions: {} },
    } as any

    await prepareTempFolder(ctx, '/mock/project/app')

    expect(ctx.dev.options.tempFolder).toBe(path.join(pkgDir, 'node_modules', '.pwa-dev-dist'))
  })

  it('resolves the temp folder in node_modules of the root without a package', async () => {
    const ctx = {
      dev: { options: {} },
      resolvedOptions: { devOptions: {} },
    } as any

    await prepareTempFolder(ctx, '/mock/other')

    expect(ctx.dev.options.tempFolder).toBe(path.resolve('/mock/other', 'node_modules', '.pwa-dev-dist'))
  })

  it('ignores errors during statSync (covers catch block and break logic)', async () => {
    // We force an error to cover the catch() of tryStatSync.
    // Since it always fails, we also force the "break" of the while when reaching the root.
    vi.mocked(fs.statSync).mockImplementation(() => {
      throw new Error('Permission denied')
    })

    const ctx = {
      dev: { options: {} },
      resolvedOptions: { devOptions: {} },
    } as any

    await prepareTempFolder(ctx)

    expect(ctx.dev.options.tempFolder).toBeDefined()
    expect(ctx.dev.options.tempFolder).toContain('.pwa-dev-dist')
  })

  it('skips node_modules search in Deno environment', async () => {
    // We simulate that we are running in Deno
    ;(process.versions as any).deno = '1.0.0'

    const ctx = {
      dev: { options: {} },
      resolvedOptions: { devOptions: {} },
    } as any

    await prepareTempFolder(ctx)

    // Since it's Deno, it should never attempt to search for the node_modules folder
    expect(fs.statSync).not.toHaveBeenCalled()
    expect(ctx.dev.options.tempFolder).toBeDefined()
    expect(ctx.dev.options.tempFolder).toContain('.pwa-dev-dist')
  })
})
