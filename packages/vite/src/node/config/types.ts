import type { VitePWAOptions, VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'

export type ExternalPWAOptions<
  Strategy extends VitePWAStrategy,
  Type extends SWType,
  Options extends VitePWAOptions<Strategy, Type>,
> = Omit<Options, 'cwd' | 'path' | 'mergeOptions'>
