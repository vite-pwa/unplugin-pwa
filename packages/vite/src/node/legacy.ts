import type { VitePWAOptions, VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { PluginOption } from 'vite'
import { BuildPwaAssetsPlugin } from './plugins/build-pwa-assets'
import { BuildRegisterSWPlugin } from './plugins/build-register-sw'
import { BuildSWPlugin } from './plugins/build-sw'
import { DevPlugin } from './plugins/dev'
import { DevMiddlewarePlugin } from './plugins/dev-middleware'
import { DevAssetsMiddlewarePlugin } from './plugins/dev-pwa-assets-middleware'
import { InfoPlugin } from './plugins/info'
import { InspectorPlugin } from './plugins/inspector'
import { MainPlugin } from './plugins/main'
import { AssetsPlugin } from './plugins/pwa-assets'
import { VirtualModulesPlugin } from './plugins/virtual-modules'
import { pwaAssetsResolver } from './pwa-assets-resolver'
import { createViteLegacyPWAContext } from './vite-context'

/**
 * Vite PWA legacy plugin (Vite < 6).
 * @param options The PWA options
 */
export function ViteLegacyPWA<
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(
  options: Partial<VitePWAOptions<UserStrategy, T>> = {},
): PluginOption {
  const ctx = createViteLegacyPWAContext(options)

  ctx.customPwaAssetResolver = pwaAssetsResolver(ctx)

  return [
    MainPlugin(ctx),
    VirtualModulesPlugin(ctx),
    InfoPlugin(ctx),
    DevPlugin(ctx),
    DevMiddlewarePlugin(ctx),
    DevAssetsMiddlewarePlugin(ctx),
    AssetsPlugin(ctx),
    BuildRegisterSWPlugin(ctx),
    BuildPwaAssetsPlugin(ctx),
    BuildSWPlugin(ctx),
    InspectorPlugin(ctx),
  ]
}
