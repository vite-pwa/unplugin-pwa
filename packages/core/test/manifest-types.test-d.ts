import type {
  IconResource,
  ManifestLocalizedFields,
  ManifestLocalizedText,
  ManifestOptions,
  ManifestRelatedApplication,
  ManifestShortcut,
} from '../src'
import { describe, expectTypeOf, it } from 'vitest'

describe('manifest type contracts', () => {
  it('accepts related applications identified by URL, ID, or both, but not neither', () => {
    expectTypeOf<{ platform: string, url: string }>().toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string, id: string }>().toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string, url: string, id: string }>().toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string }>().not.toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ url: string }>().not.toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string, url: number }>().not.toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string, id: number }>().not.toExtend<ManifestRelatedApplication>()
  })

  it('checks related application version and fingerprint metadata', () => {
    expectTypeOf<{
      platform: string
      id: string
      min_version: string
      fingerprints: { type: string, value: string }[]
    }>().toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string, id: string, min_version: number }>().not.toExtend<ManifestRelatedApplication>()
    expectTypeOf<{ platform: string, id: string, fingerprints: { type: string }[] }>().not.toExtend<ManifestRelatedApplication>()
  })

  it('accepts localized strings and text objects with optional direction and language', () => {
    expectTypeOf<string>().toExtend<ManifestLocalizedText>()
    expectTypeOf<{ value: string }>().toExtend<ManifestLocalizedText>()
    expectTypeOf<{ value: string, dir: 'auto' | 'ltr' | 'rtl', lang: string }>().toExtend<ManifestLocalizedText>()
    expectTypeOf<{ lang: string }>().not.toExtend<ManifestLocalizedText>()
    expectTypeOf<{ value: number }>().not.toExtend<ManifestLocalizedText>()
    expectTypeOf<{ value: string, dir: 'invalid' }>().not.toExtend<ManifestLocalizedText>()
  })

  it('exposes localized fields on both manifests and shortcuts', () => {
    const fields = {
      name_localized: { fr: 'Application' },
      short_name_localized: { fr: { value: 'Appli', dir: 'ltr', lang: 'fr' } },
      description_localized: { fr: 'Description' },
      icons_localized: { fr: [{ src: '/fr.png', label: 'Application', purpose: ['maskable'] }] },
    } satisfies ManifestLocalizedFields
    expectTypeOf(fields).toExtend<Partial<ManifestOptions>>()
    expectTypeOf({ name: 'Open', url: '/open', ...fields }).toExtend<ManifestShortcut>()
  })

  it('allows optional dark colors and note-taking URLs while rejecting non-string values', () => {
    type DarkColors = NonNullable<ManifestOptions['color_scheme_dark']>
    type NoteTaking = NonNullable<ManifestOptions['note_taking']>

    expectTypeOf({}).toExtend<DarkColors>()
    expectTypeOf<{ theme_color: string }>().toExtend<DarkColors>()
    expectTypeOf<{ background_color: string }>().toExtend<DarkColors>()
    expectTypeOf<{ theme_color: string, background_color: string }>().toExtend<DarkColors>()
    expectTypeOf<{ theme_color: number }>().not.toExtend<DarkColors>()
    expectTypeOf<{ background_color: number }>().not.toExtend<DarkColors>()
    expectTypeOf({}).toExtend<NoteTaking>()
    expectTypeOf<{ new_note_url: string }>().toExtend<NoteTaking>()
    expectTypeOf<{ new_note_url: number }>().not.toExtend<NoteTaking>()
  })

  it('checks file-handler launch modes and icon purposes without removing legacy strings', () => {
    type FileHandler = ManifestOptions['file_handlers'][number]

    expectTypeOf<FileHandler['launch_type']>().toEqualTypeOf<'single-client' | 'multiple-clients' | undefined>()
    expectTypeOf<{ action: string, accept: Record<string, string[]>, launch_type: 'invalid' }>().not.toExtend<FileHandler>()
    expectTypeOf<{ src: string, label: string, purpose: ['any', 'maskable', 'monochrome'] }>().toExtend<IconResource>()
    expectTypeOf<{ src: string, purpose: 'legacy-purpose' }>().toExtend<IconResource>()
    expectTypeOf<{ src: string, purpose: ['invalid'] }>().not.toExtend<IconResource>()
    expectTypeOf<{ src: string, label: number }>().not.toExtend<IconResource>()
  })
})
