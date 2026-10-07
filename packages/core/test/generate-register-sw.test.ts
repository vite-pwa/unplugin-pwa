import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateRegisterSW } from '../src/generate-register-sw'

vi.mock('node:fs', () => ({ existsSync: vi.fn(() => false) }))

function createCtx(injectRegister: any, extra: Record<string, any> = {}): any {
  return {
    publicDir: '/project/public',
    useImportRegister: false,
    resolvedOptions: { injectRegister },
    customPwaAssetResolver: vi.fn(async () => 'REGISTER_SW_CODE'),
    ...extra,
  }
}

describe('generateRegisterSW', () => {
  beforeEach(() => {
    vi.mocked(existsSync).mockReturnValue(false)
  })

  it.each(['script', 'script-defer'])('%s: resolves the register-sw asset', async (mode) => {
    const ctx = createCtx(mode)
    expect(await generateRegisterSW(ctx)).toBe('REGISTER_SW_CODE')
    expect(ctx.customPwaAssetResolver).toHaveBeenCalledWith('register-sw')
  })

  it('auto without virtual import: becomes "script" and generates the asset', async () => {
    const ctx = createCtx('auto')
    expect(await generateRegisterSW(ctx)).toBe('REGISTER_SW_CODE')
    expect(ctx.resolvedOptions.injectRegister).toBe('script')
  })

  it('auto with virtual import: becomes null and generates nothing', async () => {
    const ctx = createCtx('auto', { useImportRegister: true })
    expect(await generateRegisterSW(ctx)).toBeUndefined()
    expect(ctx.resolvedOptions.injectRegister).toBeNull()
    expect(ctx.customPwaAssetResolver).not.toHaveBeenCalled()
  })

  it.each(['inline', false, null])('injectRegister=%s generates nothing', async (mode) => {
    const ctx = createCtx(mode)
    expect(await generateRegisterSW(ctx)).toBeUndefined()
    expect(ctx.customPwaAssetResolver).not.toHaveBeenCalled()
  })

  it('does not generate when the user already has registerSW.js in the public dir', async () => {
    vi.mocked(existsSync).mockReturnValue(true)
    const ctx = createCtx('script')
    expect(await generateRegisterSW(ctx)).toBeUndefined()
    expect(existsSync).toHaveBeenCalledWith(resolve('/project/public', 'registerSW.js'))
    expect(ctx.customPwaAssetResolver).not.toHaveBeenCalled()
  })
})
