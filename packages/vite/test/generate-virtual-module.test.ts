import { describe, expect, it } from 'vitest'
import { generateVirtualModule } from '../src/node/generate-virtual-module'

interface Deferred {
  source: string
  resolve: (code: string) => void
  reject: (error: Error) => void
}

function createContext(deferred = false) {
  const calls: string[] = []
  const pending: Deferred[] = []
  const ctx: any = {
    resolvedOptions: {},
    devEnvironment: false,
    dev: {
      options: {
        registerVirtualSWGenerated: false,
        swAssetsPaths: new Map<string, string>(),
        virtualModules: new Map<string, Promise<string>>(),
      },
    },
    customPwaAssetResolver: (_type: string, source: string) => {
      calls.push(source)
      if (!deferred)
        return Promise.resolve(`code for ${source}`)
      return new Promise<string>((resolve, reject) => {
        pending.push({ source, resolve, reject })
      })
    },
  }
  return { ctx, calls, pending }
}

describe('generate virtual module', () => {
  it('should generate each virtual register module', async () => {
    const { ctx, calls } = createContext()
    expect(await generateVirtualModule(ctx, 'svelte')).toBe('code for svelte')
    expect(await generateVirtualModule(ctx, 'register')).toBe('code for register')
    expect(calls).toEqual(['svelte', 'register'])
    expect(ctx.dev.options.swAssetsPaths.get('virtual:pwa-register/svelte')).toBe('code for svelte')
    expect(ctx.dev.options.swAssetsPaths.get('virtual:pwa-register')).toBe('code for register')
  })

  it('should generate a virtual module once when imported repeatedly', async () => {
    const { ctx, calls } = createContext()
    for (let i = 0; i < 5; i++)
      expect(await generateVirtualModule(ctx, 'register')).toBe('code for register')
    expect(calls).toEqual(['register'])
  })

  it('should share one generation between concurrent loads of the same module', async () => {
    const { ctx, calls, pending } = createContext(true)
    const loads = [
      generateVirtualModule(ctx, 'register'),
      generateVirtualModule(ctx, 'register'),
      generateVirtualModule(ctx, 'register'),
    ]
    expect(calls).toEqual(['register'])
    pending[0].resolve('code for register')
    expect(await Promise.all(loads)).toEqual(['code for register', 'code for register', 'code for register'])
    expect(calls).toEqual(['register'])
  })

  it('should keep concurrent loads of different modules independent', async () => {
    const { ctx, calls, pending } = createContext(true)
    const register = generateVirtualModule(ctx, 'register')
    const svelte = generateVirtualModule(ctx, 'svelte')
    expect(calls).toEqual(['register', 'svelte'])
    pending[1].resolve('code for svelte')
    expect(await svelte).toBe('code for svelte')
    pending[0].resolve('code for register')
    expect(await register).toBe('code for register')
    expect(ctx.dev.options.swAssetsPaths.get('virtual:pwa-register')).toBe('code for register')
    expect(ctx.dev.options.swAssetsPaths.get('virtual:pwa-register/svelte')).toBe('code for svelte')
  })

  it('should regenerate every virtual module after invalidation', async () => {
    const { ctx, calls } = createContext()
    await generateVirtualModule(ctx, 'register')
    await generateVirtualModule(ctx, 'svelte')
    ctx.dev.options.registerVirtualSWGenerated = false
    await generateVirtualModule(ctx, 'register')
    await generateVirtualModule(ctx, 'svelte')
    expect(calls).toEqual(['register', 'svelte', 'register', 'svelte'])
  })

  it('should not let a load started before invalidation overwrite the new module', async () => {
    const { ctx, calls, pending } = createContext(true)
    const stale = generateVirtualModule(ctx, 'register')
    ctx.dev.options.registerVirtualSWGenerated = false
    const fresh = generateVirtualModule(ctx, 'register')
    expect(calls).toEqual(['register', 'register'])
    pending[1].resolve('module code')
    expect(await fresh).toBe('module code')
    pending[0].resolve('classic code')
    expect(await stale).toBe('classic code')
    expect(ctx.dev.options.swAssetsPaths.get('virtual:pwa-register')).toBe('module code')
    expect(await generateVirtualModule(ctx, 'register')).toBe('module code')
    expect(calls).toEqual(['register', 'register'])
  })

  it('should retry generation after a failed load', async () => {
    const { ctx, calls, pending } = createContext(true)
    const failed = generateVirtualModule(ctx, 'register')
    pending[0].reject(new Error('boom'))
    await expect(failed).rejects.toThrow('boom')
    expect(ctx.dev.options.swAssetsPaths.has('virtual:pwa-register')).toBe(false)
    const retry = generateVirtualModule(ctx, 'register')
    pending[1].resolve('code for register')
    expect(await retry).toBe('code for register')
    expect(calls).toEqual(['register', 'register'])
  })
})
