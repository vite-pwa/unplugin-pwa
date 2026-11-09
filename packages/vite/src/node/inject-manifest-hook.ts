import type { VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { ViteBundler, VitePWAPluginContext } from './vite-context'
import path from 'node:path'
import { normalizePath } from '@vite-pwa/workbox-build/utils/resolve-sw-names'

export function injectManifestSWAtPublicDir<
  B extends ViteBundler,
  UserStrategy extends VitePWAStrategy,
  T extends SWType,
>(
  ctx: VitePWAPluginContext<B, UserStrategy, T>,
) {
  return (): boolean => {
    const root = ctx.viteConfig.root
    const swSrcDir = normalizePath(path.dirname(path.resolve(root, ctx.resolvedOptions.injectManifest!.swSrc as string)))
    const publicDir = normalizePath(path.resolve(root, ctx.viteConfig.publicDir || 'public'))

    return swSrcDir === publicDir
  }
}
