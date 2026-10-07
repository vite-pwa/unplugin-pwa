import { describe, expect, it, vi } from 'vitest'
import { createWebManifestHtmlLink } from '../src/create-web-manifest-html-link'
import { checkForHtmlHead } from '../src/html'
import { injectWebManifestHtmlLink } from '../src/inject-web-manifest-html-link'

vi.mock('../src/create-web-manifest-html-link', () => ({
  createWebManifestHtmlLink: vi.fn(() => '<link rel="manifest" href="/manifest.webmanifest">'),
}))
vi.mock('../src/html', () => ({
  checkForHtmlHead: vi.fn((html: string) => html),
}))

const ctx = {} as any

describe('injectWebManifestHtmlLink', () => {
  it('inserts the manifest link right before </head>', () => {
    const result = injectWebManifestHtmlLink('<html><head><title>x</title></head><body></body></html>', ctx)
    expect(result).toBe(
      '<html><head><title>x</title><link rel="manifest" href="/manifest.webmanifest"></head><body></body></html>',
    )
  })

  it('builds the link from the given context and validates the html', () => {
    const html = '<head></head>'
    injectWebManifestHtmlLink(html, ctx)
    expect(createWebManifestHtmlLink).toHaveBeenCalledWith(ctx)
    expect(checkForHtmlHead).toHaveBeenCalledWith(html)
  })
})
