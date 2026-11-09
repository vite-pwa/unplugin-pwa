import { resolveConfig } from 'vite'
import { describe, expect, it, vi } from 'vitest'
import { MainPlugin } from '../src/node/plugins/main'
import { createVitePWAContext } from '../src/node/vite-context'

describe('main plugin', () => {
  it.each([
    ['client', {}, true],
    ['ssr', { build: { ssr: 'entry-server.js' } }, false],
  ])('should configure the PWA options for the %s build', async (_, config, forClient) => {
    const ctx = createVitePWAContext(true, { disable: true })
    ctx.configurePWAOptions = vi.fn(() => undefined)

    const resolved = await resolveConfig({ ...config, configFile: false, logLevel: 'silent', plugins: [MainPlugin(ctx)] }, 'build')

    expect(ctx.configurePWAOptions).toHaveBeenCalledWith(forClient, resolved)
    expect(ctx.viteConfig).toBe(forClient ? resolved : undefined)
  })
})
