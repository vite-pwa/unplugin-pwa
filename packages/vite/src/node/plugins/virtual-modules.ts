import type { VitePWAStrategy } from '@vite-pwa/unplugin-pwa-core/types'
import type {
  SWType,
} from '@vite-pwa/workbox-build/types'
import type { Plugin } from 'vite'
import type { ViteBundler, VitePWAPluginContext } from '../vite-context'
import { exactRegex, prefixRegex } from '@rolldown/pluginutils'
import {
  DEV_SW_VIRTUAL_VIRTUAL,
  RESOLVED_DEV_SW_VIRTUAL_VIRTUAL,
  VIRTUAL_MODULES,
  VIRTUAL_MODULES_MAP,
  VIRTUAL_MODULES_RESOLVE_PREFIX,
} from '@vite-pwa/unplugin-pwa-core/constants'
import { generateVirtualModule } from '@vite-pwa/unplugin-pwa-core/generate-virtual-module'

export function VirtualModulesPlugin<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(ctx: VitePWAPluginContext<ViteBundler, UserStrategy, T>): Plugin {
  return {
    name: 'unplugin-pwa:virtual-modules',
    enforce: 'pre',
    sharedDuringBuild: true,
    resolveId: {
      filter: { id: [prefixRegex('virtual:pwa-register'), exactRegex(DEV_SW_VIRTUAL_VIRTUAL)] },
      handler(id) {
        /* if (!ctx.envApi && ctx.bundler === 'vite-legacy' && ctx.viteConfig.build.ssr) {
          return
        } */

        // resolve this at build time: won't be resolved by dev plugin
        if (!ctx.devEnvironment && id === DEV_SW_VIRTUAL_VIRTUAL) {
          return RESOLVED_DEV_SW_VIRTUAL_VIRTUAL
        }

        // condition is kept for backward compatibility for below Vite v6.3
        return VIRTUAL_MODULES.includes(id) ? VIRTUAL_MODULES_RESOLVE_PREFIX + id : undefined
      },
    },
    load: {
      filter: { id: [prefixRegex(VIRTUAL_MODULES_RESOLVE_PREFIX), exactRegex(RESOLVED_DEV_SW_VIRTUAL_VIRTUAL)] },
      async handler(id) {
        /* if (!ctx.envApi && ctx.bundler === 'vite-legacy' && ctx.viteConfig.build.ssr) {
          return
        } */

        // resolve this at build time: won't be resolved by dev plugin
        if (!ctx.devEnvironment && id === RESOLVED_DEV_SW_VIRTUAL_VIRTUAL) {
          return `export function registerDevSW() {}\nexport function setDevPWASwitcherReady() {}`
        }

        // condition is kept for backward compatibility for below Vite v6.3
        if (id.startsWith(VIRTUAL_MODULES_RESOLVE_PREFIX)) {
          id = id.slice(VIRTUAL_MODULES_RESOLVE_PREFIX.length)
        }
        else {
          return
        }

        if (VIRTUAL_MODULES.includes(id)) {
          ctx.useImportRegister = true
          return await generateVirtualModule(ctx, VIRTUAL_MODULES_MAP[id])
        }
      },
    },
  }
}
