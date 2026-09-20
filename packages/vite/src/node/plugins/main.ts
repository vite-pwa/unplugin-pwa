import type { VitePWAStrategy } from '@vite-pwa/unplugin-pwa-core/types'
import type {
  SWType,
} from '@vite-pwa/workbox-build/types'
import type { Plugin } from 'vite'
import type { ViteBundler, VitePWAPluginContext } from '../vite-context'

import { preparePWAContextDefaults } from '../helpers'

/**
 * Main plugin for Vite integration.
 * If you're using a custom integration add this plugin as the first one to your Vite plugins array.
 * @param ctx The PWA plugin context.
 */
export function MainPlugin<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(ctx: VitePWAPluginContext<ViteBundler, UserStrategy, T>): Plugin {
  let forClient = false
  return {
    name: 'unplugin-pwa:main',
    enforce: 'pre',
    sharedDuringBuild: true,
    /* configEnvironment(_name, config) {
      // todo: review returned options here
      if (config.consumer === 'server') {
        if (ctx.bundler === 'vite-legacy') {
          return {
            build: {
              rollupOptions: {
                external: [...Array.from(Object.keys(VIRTUAL_MODULES_MAP)), DEV_SW_VIRTUAL, DEV_SW_VIRTUAL_VIRTUAL],
              },
            },
          }
        }

        return {
          build: {
            rolldownOptions: {
              external: [
                ...Array.from(Object.keys(VIRTUAL_MODULES_MAP)),
                DEV_SW_VIRTUAL,
                DEV_SW_VIRTUAL_VIRTUAL,
              ],
            },
          },
        }
      }
    },
    config(_, { isSsrBuild }) {
      // todo: review returned options here
      if (ctx.bundler === 'vite-legacy' && isSsrBuild) {
        return
      }

      if (ctx.bundler === 'vite-legacy') {
        return {
          build: {
            rollupOptions: {
              external: [...Array.from(Object.keys(VIRTUAL_MODULES_MAP)), DEV_SW_VIRTUAL, DEV_SW_VIRTUAL_VIRTUAL],
            },
          },
        }
      }

      return {
        build: {
          rolldownOptions: {
            external: [...Array.from(Object.keys(VIRTUAL_MODULES_MAP)), DEV_SW_VIRTUAL, DEV_SW_VIRTUAL_VIRTUAL],
          },
        },
      }
    }, */
    configEnvironment(_name, config) {
      if (ctx.envApi) {
        forClient = config.consumer === 'client'
      }
    },
    apply: (_, { command, isPreview }) => {
      ctx.isPreview = isPreview === true
      ctx.devEnvironment = !(command === 'build') && !ctx.isPreview
      return true
    },
    async configResolved(config) {
      if (ctx.envApi) {
        // don't override if already configured
        if (forClient && !ctx.viteConfig) {
          ctx.viteConfig = config
        }
      }
      else {
        // don't override if already configured
        if (!config.build.ssr && !ctx.viteConfig) {
          ctx.viteConfig = config
        }
      }

      if (ctx.externalConfigurationLoader) {
        return
      }

      try {
        await preparePWAContextDefaults(forClient, config, ctx)
      }
      catch (e) {
        await ctx.hooks.callHook('context:ready', e)
        throw e
      }

      await ctx.hooks.callHook('context:ready')
    },
  }
}
