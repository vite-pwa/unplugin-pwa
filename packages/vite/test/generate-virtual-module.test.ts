import { describe, expect, it } from 'vitest'
import { generateVirtualModule } from '../src/node/generate-virtual-module'

function createContext() {
  const calls: string[] = []
  const ctx: any = {
    resolvedOptions: {},
    devEnvironment: false,
    dev: {
      options: {
        registerVirtualSWGenerated: false,
        swAssetsPaths: new Map<string, string>(),
      },
    },
    customPwaAssetResolver: async (_type: string, source: string) => {
      calls.push(source)
      return `code for ${source}`
    },
  }
  return { ctx, calls }
}

describe('generate virtual module', () => {
  it('should generate each virtual register module', async () => {
    const { ctx, calls } = createContext()
    expect(await generateVirtualModule(ctx, 'svelte')).toBe('code for svelte')
    expect(await generateVirtualModule(ctx, 'register')).toBe('code for register')
    expect(calls).toEqual(['svelte', 'register'])
  })

  it('should reuse the generated code for the same virtual module', async () => {
    const { ctx, calls } = createContext()
    expect(await generateVirtualModule(ctx, 'register')).toBe('code for register')
    expect(await generateVirtualModule(ctx, 'register')).toBe('code for register')
    expect(calls).toEqual(['register'])
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
})
