import type { ManifestLocalizedFields, ManifestOptions } from '../src/types'
import { describe, expect, it } from 'vitest'
import { generateWebManifest } from '../src/generate-web-manifest'

const manifest = { name: 'app', icons: [{ src: 'a.png' }] }

describe('generateWebManifest', () => {
  it('pretty prints with 2 spaces and a trailing newline by default', () => {
    const ctx: any = { resolvedOptions: { manifest } }
    expect(generateWebManifest(ctx)).toBe(`${JSON.stringify(manifest, null, 2)}\n`)
  })

  it('is compact (single line) when minify is enabled', () => {
    const ctx: any = { resolvedOptions: { manifest, minify: true } }
    const result = generateWebManifest(ctx)
    expect(result).toBe(`${JSON.stringify(manifest)}\n`)
    expect(result.trimEnd()).not.toContain('\n')
  })

  it('always produces valid JSON', () => {
    const ctx: any = { resolvedOptions: { manifest } }
    expect(JSON.parse(generateWebManifest(ctx))).toEqual(manifest)
  })

  it.each([false, true])('preserves localized text and added metadata with minify=%s', (minify) => {
    const localized: ManifestLocalizedFields = {
      name_localized: {
        fr: 'Application',
        ar: { value: 'تطبيق', dir: 'rtl', lang: 'ar' },
      },
      short_name_localized: { fr: { value: 'Appli', dir: 'ltr', lang: 'fr' } },
      description_localized: {
        fr: 'Description',
        ja: { value: '説明', dir: 'auto', lang: 'ja' },
      },
    }
    const metadata: Partial<ManifestOptions> = {
      ...localized,
      color_scheme_dark: { theme_color: '#111111', background_color: '#000000' },
      note_taking: { new_note_url: '/new-note' },
      related_applications: [
        { platform: 'webapp', url: 'https://example.com/app' },
        { platform: 'play', id: 'com.example.app', min_version: '1.2', fingerprints: [{ type: 'sha256', value: 'abc123' }] },
        { platform: 'play', id: 'com.example.app', url: 'https://example.com/store' },
      ],
      shortcuts: [{ name: 'Open', url: '/open', ...localized }],
    }
    const ctx = { resolvedOptions: { manifest: metadata, minify } } as Parameters<typeof generateWebManifest>[0]

    expect(JSON.parse(generateWebManifest(ctx))).toStrictEqual(metadata)
  })
})
