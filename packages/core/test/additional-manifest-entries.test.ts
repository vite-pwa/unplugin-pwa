import { Buffer } from 'node:buffer'
import { hash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { additionalManifestEntriesFactory } from '../src/additional-manifest-entries'
import { generateWebManifest } from '../src/generate-web-manifest'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))
vi.mock('../src/generate-web-manifest', () => ({
  generateWebManifest: vi.fn(() => '{"name":"app"}'),
}))

const md5 = (value: string | Buffer) => hash('md5', value, 'hex')
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
    const consumerGenerator = async function* () {
      yield 'extra.html'
    }
    const ctx = createCtx(
      { includeManifest: true, includeAssets: ['a.svg'] },
      { additionalManifestEntriesGenerator: consumerGenerator },
    )
    expect(await collect(ctx)).toEqual(['extra.html'])
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

  const pngs = [{ src: 'a.png' }, { src: 'b.png' }]
  it.each([
    ['includeManifestScreenshots', { includeManifestScreenshots: true, manifest: { screenshots: pngs } }, {}],
    ['includeAssets', { includeAssets: ['a.png', 'b.png'], manifest: {} }, {}],
  ])('%s: hashes the bytes of binary files, not their utf-8 decoding', async (_label, resolvedOptions, consumerOptions) => {
    // 0x80 and 0x81 are both invalid utf-8 and would decode to the same U+FFFD
    const files: Record<string, Buffer> = {
      '/public/a.png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x80]),
      '/public/b.png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x81]),
    }
    vi.mocked(readFile).mockImplementation((async (path: string, encoding?: BufferEncoding) =>
      encoding ? files[path].toString(encoding) : files[path]) as any)
    const ctx = createCtx(resolvedOptions, consumerOptions)
    expect(await collect(ctx)).toEqual([
      { url: 'a.png', revision: md5(files['/public/a.png']) },
      { url: 'b.png', revision: md5(files['/public/b.png']) },
    ])
  })

  it('keeps a stable order: manifest, icons, shortcuts, additional icon collections, screenshots, assets, consumer', async () => {
    const consumerGenerator = async function* () {
      yield 'consumer.js'
    }
    const ctx = createCtx(
      {
        includeManifest: true,
        includeManifestIcons: true,
        includeManifestShortcutIcons: true,
        includeManifestFileHandlerIcons: true,
        includeManifestLocalizedIcons: true,
        includeManifestShortcutLocalizedIcons: true,
        includeManifestScreenshots: true,
        includeAssets: ['asset.svg'],
        manifest: {
          icons: [{ src: 'icon.png' }],
          shortcuts: [{ icons: [{ src: 'shortcut.png' }], icons_localized: { fr: [{ src: 'shortcut-fr.png' }] } }],
          file_handlers: [{ icons: [{ src: 'file.png' }] }],
          icons_localized: { fr: [{ src: 'icon-fr.png' }] },
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
      'file.png',
      'icon-fr.png',
      'shortcut-fr.png',
      'shot.png',
      'asset.svg',
      'consumer.js',
    ])
  })
})
