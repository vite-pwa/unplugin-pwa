import type { VitePWAStrategy } from '@vite-pwa/unplugin-pwa-core/types'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { Plugin } from 'vite'
import type {
  ViteBundler,
  VitePWAPluginContext,
} from '../vite-context'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  INSPECTOR_BASE_PATH_API,
  INSPECTOR_BASE_PATH_URL,
} from '@vite-pwa/unplugin-pwa-core/constants'
import {
  preparePWAConfigurationData,
  prepareServiceWorkerData,
} from '@vite-pwa/unplugin-pwa-core/inspector-utils'
import { inspectorWithInjectManifestWarning } from '@vite-pwa/unplugin-pwa-core/logs'
import {
  resolveInspectorDist,
} from '@vite-pwa/unplugin-pwa-vite/src/node/resolve-inspector-dist'

export function InspectorPlugin<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(ctx: VitePWAPluginContext<ViteBundler, UserStrategy, T>): Plugin {
  return {
    name: 'unplugin-pwa:inspector',
    apply: 'serve',
    applyToEnvironment(environment) {
      return environment.config.consumer === 'client'
    },
    async configureServer(server) {
      if (!ctx.envApi && ctx.viteConfig.build.ssr) {
        return
      }

      if (!ctx.resolvedOptions.devOptions?.inspector) {
        return
      }

      // since the SW is "static" there is no way to bypass the navigation fallback,
      // and so we need to disable it
      if (ctx.strategy === 'inject-manifest') {
        console.warn(inspectorWithInjectManifestWarning)
      }

      const inspectorDist = resolveInspectorDist(dirname(fileURLToPath(import.meta.url)))

      if (ctx.resolvedOptions.devOptions?.inspector === 'standalone' || ctx.bundler === 'vite-legacy') {
        /* if ('printUrls' in server) {
          const printUrls = server.printUrls
          server.printUrls = () => {
            const host = `${ctx.viteConfig.server.https ? 'http' : 'http'}://${ctx.viteConfig.server.https}`
          }
        } */
        const sirv = await import('sirv').then(m => (m.default ?? m))
        server.middlewares.use(
          INSPECTOR_BASE_PATH_URL,
          sirv(inspectorDist, {
            single: true,
            dev: true,
          }),
        )
      }

      // expose always api endpoints
      server.middlewares.use(INSPECTOR_BASE_PATH_API, async (req, res, next) => {
        if (!req.url) {
          return next()
        }
        const resolvedOptions = ctx.resolvedOptions
        const devOptions = resolvedOptions.devOptions

        if (req.url === '/') {
          res.setHeader('Content-Type', 'application/json')
          res.write(JSON.stringify(preparePWAConfigurationData(ctx)))
          res.end()
          return
        }

        if (req.url.startsWith('/mode')) {
          res.setHeader('Content-Type', 'application/json')
          res.write(JSON.stringify(
            devOptions?.inspector === 'vite-devtools'
              ? 'vite-devtools'
              : 'standalone',
            undefined,
            2,
          ))
          res.end()
          return
        }

        if (req.url.startsWith('/sw')) {
          res.setHeader('Content-Type', 'application/json')
          res.write(JSON.stringify(prepareServiceWorkerData(ctx)))
          res.end()
          return
        }

        next()
      })
    },
  }
}
