import { describe, expect, it } from 'vitest'
import { createWebManifestHtmlLink } from '../src/create-web-manifest-html-link'

function createCtx(devEnvironment: boolean, options: Record<string, any>): any {
  return { devEnvironment, resolvedOptions: options }
}

describe('createWebManifestHtmlLink', () => {
  it('build: uses buildBase + manifestFilename', () => {
    const ctx = createCtx(false, {
      manifest: {},
      buildBase: '/app/',
      base: '/',
      manifestFilename: 'manifest.webmanifest',
    })
    expect(createWebManifestHtmlLink(ctx)).toBe('<link rel="manifest" href="/app/manifest.webmanifest">')
  })

  it('dev: uses base and falls back to manifest.webmanifest', () => {
    const ctx = createCtx(true, { manifest: {}, base: '/dev/', buildBase: '/app/' })
    expect(createWebManifestHtmlLink(ctx)).toBe('<link rel="manifest" href="/dev/manifest.webmanifest">')
  })

  it('adds crossorigin when useCredentials is enabled', () => {
    const ctx = createCtx(false, {
      manifest: {},
      buildBase: '/',
      manifestFilename: 'm.json',
      useCredentials: true,
    })
    expect(createWebManifestHtmlLink(ctx)).toBe(
      '<link rel="manifest" href="/m.json" crossorigin="use-credentials">',
    )
  })

  it.each([true, false])('returns an empty string without manifest (dev=%s)', (dev) => {
    expect(createWebManifestHtmlLink(createCtx(dev, { base: '/', buildBase: '/' }))).toBe('')
  })
})
