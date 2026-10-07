import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { additionalManifestEntriesFactory } from '../src/additional-manifest-entries'
import { generateWebManifest } from '../src/generate-web-manifest'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('../src/generate-web-manifest', () => ({
  generateWebManifest: vi.fn(() => '{"name":"app"}'),
}))

const md5 = (value: string) => createHash('md5').update(value).digest('hex')
const mapFile = (url: string) => `/public/${url}`

function createCtx(resolvedOptions: Record<string, any> = {}, consumerOptions: Record<string, any> = {}): any {
  return {
    resolvedOptions: { manifestFilename: 'manifest.webmanifest', ...resolvedOptions },
    consumerOptions,
  }
}

async function collect(ctx: any) {
  const entries: any[] = []
  for await (const entry of additionalManifestEntriesFactory(ctx, mapFile)())
    entries.push(entry)
  return entries
}

describe('additionalManifestEntriesFactory', () => {
  beforeEach(() => {
    vi.mocked(readFile).mockImplementation((async (path: string) => `content:${path}`) as any)
  })

  it('yields nothing when no include option is enabled', async () => {
    expect(await collect(createCtx({ manifest: { icons: [{ src: 'a.png' }] } }))).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it('yields the consumer generator entries even when no include option is enabled', async () => {
    const consumerGenerator = async function* () {
      yield 'extra.html'
      yield { url: 'other.js', revision: '1' }
    }
    const ctx = createCtx({}, { additionalManifestEntriesGenerator: consumerGenerator })
    expect(await collect(ctx)).toEqual(['extra.html', { url: 'other.js', revision: '1' }])
  })

  it('includeManifest: yields the manifest with the md5 of the generated web manifest', async () => {
    const ctx = createCtx({ includeManifest: true, manifest: { name: 'app' } })
    expect(await collect(ctx)).toEqual([
      { url: 'manifest.webmanifest', revision: md5('{"name":"app"}') },
    ])
    expect(generateWebManifest).toHaveBeenCalledWith(ctx)
  })

  it('without manifest only the consumer generator is used', async () => {
    const consumerGenerator = async function* () { yield 'extra.html' }
    const ctx = createCtx(
      { includeManifest: true, includeAssets: ['a.svg'] },
      { additionalManifestEntriesGenerator: consumerGenerator },
    )
    expect(await collect(ctx)).toEqual(['extra.html'])
  })

  it('includeManifestIcons: only icons declared by the consumer (not the generated ones)', async () => {
    const ctx = createCtx(
      { includeManifestIcons: true, manifest: { icons: [{ src: 'a.png' }, { src: 'generated.png' }] } },
      { manifest: { icons: [{ src: 'a.png' }] } },
    )
    expect(await collect(ctx)).toEqual([
      { url: 'a.png', revision: md5('content:/public/a.png') },
    ])
  })

  it('includeManifestShortcutIcons: yields every shortcut icon with src', async () => {
    const ctx = createCtx({
      includeManifestShortcutIcons: true,
      manifest: { shortcuts: [{ icons: [{ src: 's1.png' }, {}] }, { name: 'no-icons' }, { icons: [{ src: 's2.png' }] }] },
    })
    expect(await collect(ctx)).toEqual([
      { url: 's1.png', revision: md5('content:/public/s1.png') },
      { url: 's2.png', revision: md5('content:/public/s2.png') },
    ])
  })

  it('includeManifestScreenshots: yields every screenshot', async () => {
    const ctx = createCtx({
      includeManifestScreenshots: true,
      manifest: { screenshots: [{ src: 'shot.png' }] },
    })
    expect(await collect(ctx)).toEqual([
      { url: 'shot.png', revision: md5('content:/public/shot.png') },
    ])
  })

  it.each([
    ['string', 'favicon.ico', ['favicon.ico']],
    ['array', ['a.svg', 'b.svg'], ['a.svg', 'b.svg']],
  ])('includeAssets as %s', async (_label, includeAssets, urls) => {
    const ctx = createCtx({ includeAssets, manifest: {} })
    const entries = await collect(ctx)
    expect(entries.map(e => e.url)).toEqual(urls)
    expect(entries[0].revision).toBe(md5(`content:/public/${urls[0]}`))
  })

  it('keeps a stable order: manifest, icons, shortcuts, screenshots, assets, consumer', async () => {
    const consumerGenerator = async function* () { yield 'consumer.js' }
    const ctx = createCtx(
      {
        includeManifest: true,
        includeManifestIcons: true,
        includeManifestShortcutIcons: true,
        includeManifestScreenshots: true,
        includeAssets: ['asset.svg'],
        manifest: {
          icons: [{ src: 'icon.png' }],
          shortcuts: [{ icons: [{ src: 'shortcut.png' }] }],
          screenshots: [{ src: 'shot.png' }],
        },
      },
      {
        manifest: { icons: [{ src: 'icon.png' }] },
        additionalManifestEntriesGenerator: consumerGenerator,
      },
    )
    const urls = (await collect(ctx)).map(e => typeof e === 'string' ? e : e.url)
    expect(urls).toEqual([
      'manifest.webmanifest',
      'icon.png',
      'shortcut.png',
      'shot.png',
      'asset.svg',
      'consumer.js',
    ])
  })
})
