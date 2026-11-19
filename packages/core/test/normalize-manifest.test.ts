import type { IconResource, ManifestOptions } from '../src/types'
import { describe, expect, it } from 'vitest'
import { normalizeManifest } from '../src/helpers'

function createCtx(manifest: Partial<ManifestOptions> | false = {}) {
  return { resolvedOptions: { manifest } } as Parameters<typeof normalizeManifest>[0]
}

const iconCollections: [string, (icons: IconResource[]) => Partial<ManifestOptions>][] = [
  ['manifest icons', icons => ({ icons })],
  ['localized manifest icons', icons => ({ icons_localized: { fr: icons } })],
  ['shortcut icons', icons => ({ shortcuts: [{ name: 'Open', url: '/open', icons }] })],
  ['localized shortcut icons', icons => ({ shortcuts: [{ name: 'Open', url: '/open', icons_localized: { fr: icons } }] })],
  ['file-handler icons', icons => ({ file_handlers: [{ action: '/open', accept: {}, icons }] })],
]

describe('normalizeManifest', () => {
  it.each(iconCollections)('normalizes %s before serialization without changing other icon fields', (_name, createManifest) => {
    const ctx = createCtx(createManifest([
      { src: '/multi.png', purpose: ['any', 'maskable'], sizes: '192x192', type: 'image/png', label: 'App' },
      { src: '/single.png', purpose: ['monochrome'] },
      { src: '/string.png', purpose: 'any maskable' },
      { src: '/absent.png' },
      { src: '/empty.png', purpose: [] },
    ]))

    normalizeManifest(ctx)

    expect(JSON.parse(JSON.stringify(ctx.resolvedOptions.manifest))).toMatchObject(createManifest([
      { src: '/multi.png', purpose: 'any maskable', sizes: '192x192', type: 'image/png', label: 'App' },
      { src: '/single.png', purpose: 'monochrome' },
      { src: '/string.png', purpose: 'any maskable' },
      { src: '/absent.png' },
      { src: '/empty.png', purpose: '' },
    ]))
  })

  it('visits every language, shortcut, and file handler, including entries without icons', () => {
    const ctx = createCtx({
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
    })

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
    const ctx = createCtx(false)

    normalizeManifest(ctx)

    expect(ctx.resolvedOptions.manifest).toBe(false)
  })
})
