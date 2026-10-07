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
})
