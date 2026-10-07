import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGenerateRegisterSW } from '../src/create-generate-register-sw-script'
import { generateRegisterSW } from '../src/generate-register-sw'

vi.mock('../src/generate-register-sw', () => ({
  generateRegisterSW: vi.fn(async () => 'REGISTER_CODE'),
}))

function createCtx(resolvedOptions: Record<string, any> = {}): any {
  return {
    strategy: 'generate-sw',
    resolvedOptions: {
      base: '/dev/',
      buildBase: '/app/',
      injectRegister: 'script',
      generateSW: {},
      ...resolvedOptions,
    },
  }
}

describe('createGenerateRegisterSW', () => {
  beforeEach(() => {
    vi.mocked(generateRegisterSW).mockResolvedValue('REGISTER_CODE')
  })

  it('returns undefined in dev when injectAtDev is false, without generating code', async () => {
    const ctx = createCtx({ injectRegister: 'inline' })
    expect(await createGenerateRegisterSW(ctx, true, false)).toBeUndefined()
    expect(generateRegisterSW).not.toHaveBeenCalled()
  })

  it('inline: embeds the generated register code', async () => {
    const ctx = createCtx({ injectRegister: 'inline' })
    expect(await createGenerateRegisterSW(ctx, false)).toBe(
      '<script id="unplugin-pwa:inline-sw">REGISTER_CODE</script>',
    )
    expect(generateRegisterSW).toHaveBeenCalledWith(ctx)
  })

  it('script: references registerSW.js under buildBase in build', async () => {
    expect(await createGenerateRegisterSW(createCtx(), false)).toBe(
      '<script id="unplugin-pwa:register-sw" src="/app/registerSW.js"></script>',
    )
  })

  it('script: references registerSW.js under base in dev', async () => {
    expect(await createGenerateRegisterSW(createCtx(), true)).toBe(
      '<script id="unplugin-pwa:register-sw" src="/dev/registerSW.js"></script>',
    )
  })

  it('script-defer: adds defer', async () => {
    const ctx = createCtx({ injectRegister: 'script-defer' })
    expect(await createGenerateRegisterSW(ctx, false)).toBe(
      '<script id="unplugin-pwa:register-sw" src="/app/registerSW.js" defer></script>',
    )
  })

  it('dual service worker: adds type="module" (after defer when present)', async () => {
    const dual = { generateSW: { swType: 'classic-and-module' } }
    expect(await createGenerateRegisterSW(createCtx({ ...dual, injectRegister: 'inline' }), false)).toBe(
      '<script id="unplugin-pwa:inline-sw" type="module">REGISTER_CODE</script>',
    )
    expect(await createGenerateRegisterSW(createCtx({ ...dual, injectRegister: 'script-defer' }), false)).toBe(
      '<script id="unplugin-pwa:register-sw" src="/app/registerSW.js" defer type="module"></script>',
    )
  })

  it.each([false, null, undefined, 'auto'])('returns undefined for injectRegister=%s', async (mode) => {
    expect(await createGenerateRegisterSW(createCtx({ injectRegister: mode }), false)).toBeUndefined()
  })
})
