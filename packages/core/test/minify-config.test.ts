import { describe, expect, it } from 'vitest'
import { resolvePwaConfiguration } from '../src/config'

describe('config: minify resolution fallback', () => {
  const mockResolver = {
    isDev: false,
    isWrongInjectManifest: () => false,
  }

  it('should default minify to true when mode is production', async () => {
    for (const strategy of ['generateSW', 'buildSW']) {
      const config = await resolvePwaConfiguration({
        strategies: strategy,
        ...(strategy === 'generateSW' ? { generateSW: { mode: 'production' } } : {}),
        ...(strategy === 'buildSW' ? { buildSW: { mode: 'production' } } : {}),
      } as any, mockResolver)

      const resolvedStrategyConfig
        = strategy === 'generateSW'
          ? config.generateSW
          : config.buildSW

      expect(resolvedStrategyConfig?.minify).toBe(true)
    }
  })

  it('should respect explicit minify: false even in production', async () => {
    const config = await resolvePwaConfiguration({
      strategies: 'generateSW',
      minify: false,
      generateSW: { mode: 'production' },
    }, mockResolver)

    expect(config.generateSW?.minify).toBe(false)
  })

  it('should default minify to false when sourcemap is false and mode is not production', async () => {
    const config = await resolvePwaConfiguration({
      strategies: 'generateSW',
      generateSW: { mode: 'development', sourcemap: false },
    }, mockResolver)

    expect(config.generateSW?.minify).toBe(false)
  })
})
