import { DEV_SW_VIRTUAL_VIRTUAL, RESOLVED_DEV_SW_VIRTUAL_VIRTUAL, VIRTUAL_MODULES_RESOLVED_PREFIX } from '@unplugin-pwa/core/constants'
import { describe, expect, it } from 'vitest'
import { VirtualModulesPlugin } from '../src/node/plugins/virtual-modules'

function createPlugin(envApi: boolean, buildSsr = false) {
  const plugin: any = VirtualModulesPlugin({
    envApi,
    devEnvironment: false,
    viteConfig: { build: { ssr: buildSsr } },
  } as any)
  return {
    plugin,
    resolveId: (id: string, ssr?: boolean) => plugin.resolveId.handler.call({}, id, undefined, ssr === undefined ? undefined : { ssr }),
  }
}

describe('virtual modules plugin', () => {
  it('should apply only to the client environment', () => {
    const { plugin } = createPlugin(true)
    expect(plugin.applyToEnvironment({ config: { consumer: 'client' } })).toBe(true)
    expect(plugin.applyToEnvironment({ config: { consumer: 'server' } })).toBe(false)
  })

  it('should resolve virtual modules for the client without the environment api', () => {
    const { resolveId } = createPlugin(false)
    expect(resolveId('virtual:pwa-register')).toBe(`${VIRTUAL_MODULES_RESOLVED_PREFIX}virtual:pwa-register`)
    expect(resolveId('virtual:pwa-register/svelte', false)).toBe(`${VIRTUAL_MODULES_RESOLVED_PREFIX}virtual:pwa-register/svelte`)
    expect(resolveId(DEV_SW_VIRTUAL_VIRTUAL)).toBe(RESOLVED_DEV_SW_VIRTUAL_VIRTUAL)
  })

  it('should not resolve virtual modules for ssr without the environment api', () => {
    const { resolveId } = createPlugin(false)
    expect(resolveId('virtual:pwa-register', true)).toBeUndefined()
    expect(resolveId('virtual:pwa-register/svelte', true)).toBeUndefined()
    expect(resolveId(DEV_SW_VIRTUAL_VIRTUAL, true)).toBeUndefined()
  })

  it('should not resolve virtual modules in an ssr build without the environment api', () => {
    const { resolveId } = createPlugin(false, true)
    expect(resolveId('virtual:pwa-register')).toBeUndefined()
  })

  it('should leave environment filtering to applyToEnvironment with the environment api', () => {
    const { resolveId } = createPlugin(true, true)
    expect(resolveId('virtual:pwa-register', true)).toBe(`${VIRTUAL_MODULES_RESOLVED_PREFIX}virtual:pwa-register`)
  })
})
