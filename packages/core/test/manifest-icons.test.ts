import type { IconResource, ManifestOptions } from '../src/types'
import { Buffer } from 'node:buffer'
import { hash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { additionalManifestEntriesFactory } from '../src/additional-manifest-entries'
import { generateWebManifest } from '../src/generate-web-manifest'
import { normalizeManifest, prepareAdditionalManifestEntriesGenerator } from '../src/helpers'

vi.mock('node:fs/promises', () => ({ readFile: vi.fn() }))

type PWAContext = Parameters<typeof normalizeManifest>[0]
type IconOption
  = 'includeManifestIcons'
    | 'includeManifestShortcutIcons'
    | 'includeManifestFileHandlerIcons'
    | 'includeManifestLocalizedIcons'
    | 'includeManifestShortcutLocalizedIcons'

const md5 = (value: string | Buffer) => hash('md5', value, 'hex')
const mapFile = (url: string) => `/public/${url}`

function createCtx(resolvedOptions: PWAContext['resolvedOptions'] = {}, consumerOptions: PWAContext['consumerOptions'] = {}): PWAContext {
  return {
    resolvedOptions: { manifestFilename: 'manifest.webmanifest', manifest: {}, ...resolvedOptions },
    consumerOptions,
  } as PWAContext
}

async function collect(ctx: PWAContext) {
  const entries = []
  for await (const entry of additionalManifestEntriesFactory(ctx, mapFile)())
    entries.push(entry)
  return entries
}

const iconCollections: [string, (icons: IconResource[]) => Partial<ManifestOptions>, IconOption][] = [
  ['manifest icons', icons => ({ icons }), 'includeManifestIcons'],
  ['localized manifest icons', icons => ({ icons_localized: { fr: icons } }), 'includeManifestLocalizedIcons'],
  ['shortcut icons', icons => ({ shortcuts: [{ name: 'Open', url: '/open', icons }] }), 'includeManifestShortcutIcons'],
  ['localized shortcut icons', icons => ({ shortcuts: [{ name: 'Open', url: '/open', icons_localized: { fr: icons } }] }), 'includeManifestShortcutLocalizedIcons'],
  ['file-handler icons', icons => ({ file_handlers: [{ action: '/open', accept: {}, icons }] }), 'includeManifestFileHandlerIcons'],
]

describe('manifest icons: normalization', () => {
  it.each(iconCollections)('normalizes %s before serialization without changing other icon fields', (_name, createManifest) => {
    const ctx = createCtx({ manifest: createManifest([
      { src: '/multi.png', purpose: ['any', 'maskable'], sizes: '192x192', type: 'image/png', label: 'App' },
      { src: '/single.png', purpose: ['monochrome'] },
      { src: '/string.png', purpose: 'any maskable' },
      { src: '/absent.png' },
      { src: '/empty.png', purpose: [] },
    ]) })

    normalizeManifest(ctx)

    const serialized = JSON.parse(generateWebManifest(ctx))
    const expected = createManifest([
      { src: '/multi.png', purpose: 'any maskable', sizes: '192x192', type: 'image/png', label: 'App' },
      { src: '/single.png', purpose: 'monochrome' },
      { src: '/string.png', purpose: 'any maskable' },
      { src: '/absent.png' },
      { src: '/empty.png', purpose: '' },
    ])
    for (const [key, value] of Object.entries(expected))
      expect(serialized[key]).toStrictEqual(value)
  })

  it('visits every language, shortcut, and file handler, including entries without icons', () => {
    const ctx = createCtx({ manifest: {
      icons_localized: {
        fr: [{ src: '/fr.png', purpose: ['maskable'] }],
        de: [{ src: '/de.png', purpose: ['monochrome'] }],
      },
      shortcuts: [
        { name: 'No icons', url: '/no-icons' },
        { name: 'Empty icons', url: '/empty', icons: [], icons_localized: {} },
        { name: 'Open', url: '/open', icons_localized: { fr: [{ src: '/open-fr.png', purpose: ['maskable'] }] } },
        { name: 'New', url: '/new', icons_localized: { de: [{ src: '/new-de.png', purpose: ['monochrome'] }] } },
      ],
      file_handlers: [
        { action: '/no-icons', accept: {} },
        { action: '/empty', accept: {}, icons: [] },
        { action: '/open', accept: {}, icons: [{ src: '/open.png', purpose: ['maskable'] }] },
        { action: '/new', accept: {}, icons: [{ src: '/new.png', purpose: ['monochrome'] }] },
      ],
    } })

    normalizeManifest(ctx)

    expect(ctx.resolvedOptions.manifest).toMatchObject({
      icons_localized: {
        fr: [{ purpose: 'maskable' }],
        de: [{ purpose: 'monochrome' }],
      },
      shortcuts: [
        { name: 'No icons', url: '/no-icons' },
        { name: 'Empty icons', url: '/empty', icons: [], icons_localized: {} },
        { icons_localized: { fr: [{ purpose: 'maskable' }] } },
        { icons_localized: { de: [{ purpose: 'monochrome' }] } },
      ],
      file_handlers: [
        { action: '/no-icons', accept: {} },
        { action: '/empty', accept: {}, icons: [] },
        { icons: [{ purpose: 'maskable' }] },
        { icons: [{ purpose: 'monochrome' }] },
      ],
    })
  })

  it('does not add missing icon collections', () => {
    const ctx = createCtx()

    normalizeManifest(ctx)

    expect(ctx.resolvedOptions.manifest).not.toHaveProperty('icons')
    expect(ctx.resolvedOptions.manifest).not.toHaveProperty('icons_localized')
    expect(ctx.resolvedOptions.manifest).not.toHaveProperty('shortcuts')
    expect(ctx.resolvedOptions.manifest).not.toHaveProperty('file_handlers')
  })

  it('preserves a disabled manifest', () => {
    const ctx = createCtx({ manifest: false })

    normalizeManifest(ctx)

    expect(ctx.resolvedOptions.manifest).toBe(false)
  })
})

describe('manifest icons: precaching', () => {
  beforeEach(() => {
    vi.mocked(readFile).mockImplementation((async (path: string) => `content:${path}`) as any)
  })

  it('only includes manifest icons declared by the consumer, skipping generated icons and missing sources', async () => {
    const ctx = createCtx(
      { includeManifestIcons: true, manifest: { icons: [{ src: 'a.png' }, { src: 'generated.png' }, {} as IconResource] } },
      { manifest: { icons: [{ src: 'a.png' }, {} as IconResource] } },
    )
    expect(await collect(ctx)).toEqual([
      { url: 'a.png', revision: md5('content:/public/a.png') },
    ])
    expect(readFile).toHaveBeenCalledExactlyOnceWith('/public/a.png')
  })

  it.each([undefined, false, {}] as const)('does not include manifest icons without consumer-declared icons (%j)', async (manifest) => {
    const ctx = createCtx(
      { includeManifestIcons: true, manifest: { icons: [{ src: 'generated.png' }] } },
      { manifest },
    )

    expect(await collect(ctx)).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it('includes every shortcut icon with a source', async () => {
    const ctx = createCtx({
      includeManifestShortcutIcons: true,
      manifest: {
        shortcuts: [
          { name: 'First', url: '/first', icons: [{ src: 's1.png' }, {} as IconResource] },
          { name: 'No icons', url: '/no-icons' },
          { name: 'Second', url: '/second', icons: [{ src: 's2.png' }] },
        ],
      },
    })
    expect(await collect(ctx)).toEqual([
      { url: 's1.png', revision: md5('content:/public/s1.png') },
      { url: 's2.png', revision: md5('content:/public/s2.png') },
    ])
  })

  const additionalIconCollections: [IconOption, Partial<ManifestOptions>, string[]][] = [
    [
      'includeManifestFileHandlerIcons',
      {
        file_handlers: [
          { action: '/first', accept: {}, icons: [{ src: 'file1.png' }, {} as IconResource] },
          { action: '/no-icons', accept: {} },
          { action: '/empty', accept: {}, icons: [] },
          { action: '/second', accept: {}, icons: [{ src: 'file2.png' }] },
        ],
      },
      ['file1.png', 'file2.png'],
    ],
    [
      'includeManifestLocalizedIcons',
      { icons_localized: { fr: [{ src: 'fr.png' }, {} as IconResource], en: [], de: [{ src: 'de.png' }] } },
      ['fr.png', 'de.png'],
    ],
    [
      'includeManifestShortcutLocalizedIcons',
      {
        shortcuts: [
          { name: 'First', url: '/first', icons_localized: { fr: [{ src: 's1-fr.png' }, {} as IconResource], en: [], de: [{ src: 's1-de.png' }] } },
          { name: 'No icons', url: '/no-icons' },
          { name: 'Empty', url: '/empty', icons_localized: {} },
          { name: 'Second', url: '/second', icons_localized: { fr: [{ src: 's2-fr.png' }] } },
        ],
      },
      ['s1-fr.png', 's1-de.png', 's2-fr.png'],
    ],
  ]

  it.each(additionalIconCollections)('%s: works when every existing include option is disabled', async (option, manifest, urls) => {
    const ctx = createCtx({
      includeManifest: false,
      includeManifestIcons: false,
      includeManifestShortcutIcons: false,
      includeManifestScreenshots: false,
      includeAssets: undefined,
      [option]: true,
      manifest,
    })

    expect(await collect(ctx)).toEqual(urls.map(url => ({
      url,
      revision: md5(`content:/public/${url}`),
    })))
  })

  it.each(additionalIconCollections)('%s: does not include icons when disabled, even if existing icon options are enabled', async (option, manifest) => {
    const ctx = createCtx({
      includeManifestIcons: true,
      includeManifestShortcutIcons: true,
      includeManifestScreenshots: true,
      [option]: false,
      manifest,
    })

    expect(await collect(ctx)).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it.each(additionalIconCollections)('%s: handles absent manifests and collections', async (option) => {
    expect(await collect(createCtx({ [option]: true, manifest: false }))).toEqual([])
    expect(await collect(createCtx({ [option]: true, manifest: {} }))).toEqual([])
    expect(readFile).not.toHaveBeenCalled()
  })

  it.each(iconCollections)('%s: hashes binary file bytes, not their UTF-8 decoding', async (_name, createManifest, option) => {
    // These invalid UTF-8 bytes would both decode to U+FFFD.
    const files: Record<string, Buffer> = {
      '/public/a.png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x80]),
      '/public/b.png': Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x81]),
    }
    vi.mocked(readFile).mockImplementation((async (path: string, encoding?: BufferEncoding) =>
      encoding ? files[path].toString(encoding) : files[path]) as any)
    const manifest = createManifest([{ src: 'a.png' }, { src: 'b.png' }])
    const ctx = createCtx({ [option]: true, manifest }, { manifest })

    expect(await collect(ctx)).toEqual([
      { url: 'a.png', revision: md5(files['/public/a.png']) },
      { url: 'b.png', revision: md5(files['/public/b.png']) },
    ])
  })

  it.each(iconCollections)('%s: uses the production mapper for a non-root build base and relative sources', async (_name, createManifest, option) => {
    const publicDir = path.resolve('public')
    const basedPath = path.join(publicDir, 'icons', 'based.png')
    const relativePath = path.join(publicDir, 'icons', 'relative.png')
    const files = {
      [basedPath]: Buffer.from('based icon'),
      [relativePath]: Buffer.from('relative icon'),
    }
    vi.mocked(readFile).mockImplementation(async file => files[String(file)])
    const manifest = createManifest([{ src: '/app/icons/based.png' }, { src: 'icons/relative.png' }])
    const ctx = createCtx({ buildBase: '/app/', [option]: true, manifest }, { manifest })
    ctx.publicDir = publicDir

    const entries = []
    for await (const entry of prepareAdditionalManifestEntriesGenerator(ctx)())
      entries.push(entry)

    expect(entries).toEqual([
      { url: '/app/icons/based.png', revision: md5(files[basedPath]) },
      { url: 'icons/relative.png', revision: md5(files[relativePath]) },
    ])
    expect(readFile).toHaveBeenCalledTimes(2)
    expect(readFile).toHaveBeenNthCalledWith(1, basedPath)
    expect(readFile).toHaveBeenNthCalledWith(2, relativePath)
  })

  const mixedManifest: Partial<ManifestOptions> = {
    icons: [{ src: 'icon.png' }],
    shortcuts: [{ name: 'Open', url: '/open', icons: [{ src: 'shortcut.png' }], icons_localized: { fr: [{ src: 'shortcut-fr.png' }] } }],
    file_handlers: [{ action: '/open', accept: {}, icons: [{ src: 'file.png' }] }],
    icons_localized: { fr: [{ src: 'icon-fr.png' }] },
    screenshots: [{ src: 'shot.png', sizes: '640x480' }],
  }
  const consumerOptions: PWAContext['consumerOptions'] = {
    manifest: mixedManifest,
    async* additionalManifestEntriesGenerator(): AsyncGenerator<string, undefined, void> {
      yield 'consumer.js'
    },
  }

  it.each([
    { label: 'string', includeAssets: 'asset.svg' },
    { label: 'array', includeAssets: ['asset.svg'] },
  ])('keeps icon revisions and ordering alongside other entries with $label assets', async ({ includeAssets }) => {
    const ctx = createCtx({
      includeManifest: true,
      includeManifestIcons: true,
      includeManifestShortcutIcons: true,
      includeManifestFileHandlerIcons: true,
      includeManifestLocalizedIcons: true,
      includeManifestShortcutLocalizedIcons: true,
      includeManifestScreenshots: true,
      includeAssets,
      manifest: mixedManifest,
    }, consumerOptions)

    expect(await collect(ctx)).toEqual([
      { url: 'manifest.webmanifest', revision: md5(generateWebManifest(ctx)) },
      ...['icon.png', 'shortcut.png', 'file.png', 'icon-fr.png', 'shortcut-fr.png', 'shot.png', 'asset.svg'].map(url => ({
        url,
        revision: md5(`content:/public/${url}`),
      })),
      'consumer.js',
    ])
    expect(readFile).toHaveBeenCalledTimes(7)
  })

  it('preserves consumer entries without reading icons when every include option is disabled', async () => {
    const ctx = createCtx({
      includeManifest: false,
      includeManifestIcons: false,
      includeManifestShortcutIcons: false,
      includeManifestFileHandlerIcons: false,
      includeManifestLocalizedIcons: false,
      includeManifestShortcutLocalizedIcons: false,
      includeManifestScreenshots: false,
      includeAssets: undefined,
      manifest: mixedManifest,
    }, consumerOptions)

    expect(await collect(ctx)).toEqual(['consumer.js'])
    expect(readFile).not.toHaveBeenCalled()
  })
})

describe('manifest icons: serialization', () => {
  it.each([false, true])('serializes all icon collections together with minify=%s and precaching disabled', (minify) => {
    const ctx = createCtx({
      minify,
      includeManifestIcons: false,
      includeManifestShortcutIcons: false,
      includeManifestFileHandlerIcons: false,
      includeManifestLocalizedIcons: false,
      includeManifestShortcutLocalizedIcons: false,
      manifest: {
        icons: [
          { src: '/app.png', purpose: ['any', 'maskable'], sizes: '192x192', type: 'image/png', label: 'App' },
          { src: '/app-default.png' },
        ],
        icons_localized: { fr: [{ src: '/app-fr.png', purpose: ['maskable'] }, { src: '/app-fr-default.png' }] },
        shortcuts: [{
          name: 'Open',
          url: '/open',
          icons: [{ src: '/open.png', purpose: 'any maskable' }, { src: '/open-default.png' }],
          icons_localized: { fr: [{ src: '/open-fr.png', purpose: ['monochrome'] }, { src: '/open-fr-default.png' }] },
        }],
        file_handlers: [{
          action: '/file',
          accept: { 'text/plain': ['.txt'] },
          name: 'Text',
          launch_type: 'single-client',
          icons: [{ src: '/file.png', purpose: ['monochrome'] }, { src: '/file-default.png' }],
        }],
      },
    })

    normalizeManifest(ctx)
    const serialized = JSON.parse(generateWebManifest(ctx))

    expect({
      icons: serialized.icons,
      icons_localized: serialized.icons_localized,
      shortcuts: serialized.shortcuts,
      file_handlers: serialized.file_handlers,
    }).toStrictEqual({
      icons: [
        { src: '/app.png', purpose: 'any maskable', sizes: '192x192', type: 'image/png', label: 'App' },
        { src: '/app-default.png' },
      ],
      icons_localized: { fr: [{ src: '/app-fr.png', purpose: 'maskable' }, { src: '/app-fr-default.png' }] },
      shortcuts: [{
        name: 'Open',
        url: '/open',
        icons: [{ src: '/open.png', purpose: 'any maskable' }, { src: '/open-default.png' }],
        icons_localized: { fr: [{ src: '/open-fr.png', purpose: 'monochrome' }, { src: '/open-fr-default.png' }] },
      }],
      file_handlers: [{
        action: '/file',
        accept: { 'text/plain': ['.txt'] },
        name: 'Text',
        launch_type: 'single-client',
        icons: [{ src: '/file.png', purpose: 'monochrome' }, { src: '/file-default.png' }],
      }],
    })
  })
})
