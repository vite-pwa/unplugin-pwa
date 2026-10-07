import { describe, expect, it, vi } from 'vitest'
import { createGenerateRegisterSW } from '../src/create-generate-register-sw-script'
import { checkForHtmlHead } from '../src/html'
import { injectGenerateRegisterSW } from '../src/inject-generate-register-sw'

vi.mock('../src/create-generate-register-sw-script', () => ({
  createGenerateRegisterSW: vi.fn(),
}))
vi.mock('../src/html', () => ({
  checkForHtmlHead: vi.fn((html: string) => html),
}))

const ctx = {} as any
const html = '<html><head></head><body></body></html>'

describe('injectGenerateRegisterSW', () => {
  it('injects the script before </head> when one is generated', async () => {
    vi.mocked(createGenerateRegisterSW).mockResolvedValue('<script>register()</script>')
    const result = await injectGenerateRegisterSW(html, ctx, false)
    expect(result).toBe('<html><head><script>register()</script></head><body></body></html>')
  })

  it('returns the html untouched when there is no script', async () => {
    vi.mocked(createGenerateRegisterSW).mockResolvedValue(undefined as any)
    const result = await injectGenerateRegisterSW(html, ctx, false)
    expect(result).toBe(html)
    expect(checkForHtmlHead).not.toHaveBeenCalled()
  })

  it('forwards dev and injectAtDev (default true) to the script generator', async () => {
    vi.mocked(createGenerateRegisterSW).mockResolvedValue(undefined as any)
    await injectGenerateRegisterSW(html, ctx, true)
    expect(createGenerateRegisterSW).toHaveBeenLastCalledWith(ctx, true, true)
    await injectGenerateRegisterSW(html, ctx, true, false)
    expect(createGenerateRegisterSW).toHaveBeenLastCalledWith(ctx, true, false)
  })
})
