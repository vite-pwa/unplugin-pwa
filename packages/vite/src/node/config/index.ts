import type { VitePWAOptions, VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { ExternalPWAOptions } from './types.ts'

export function definePwaConfig<
  Strategy extends VitePWAStrategy,
  Type extends SWType,
  Options extends VitePWAOptions<Strategy, Type>,
>(
  config: Partial<ExternalPWAOptions<Strategy, Type, Options>>,
): Partial<ExternalPWAOptions<Strategy, Type, Options>> {
  return config
}
