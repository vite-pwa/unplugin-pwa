import type { VitePWAOptions, VitePWAStrategy } from '@unplugin-pwa/core'
import type { SWType } from '@vite-pwa/workbox-build/types'
import type { ExternalPWAOptions } from './types.ts'

/**
 * Helper function to define external PWA options.
 *
 * **Note**: This file should use the default export syntax.
 *
 * @example
 * ```ts
 * export default definePwaConfig({...})
 * ```
 *
 * You can use this function to define the PWA configuration in one of the following
 * default locations in your root directory:
 * - `pwa.config.js`
 * - `pwa.config.ts`
 * - `pwa.config.mjs`
 * - `pwa.config.mts`
 *
 * You can also define a custom external PWA configuration file using the `path`
 * option in the Vite PWA plugin inline config. Specify a custom working directory using the
 * `cwd` option if the file is located elsewhere (do not move the file outside
 * your root directory, as Vite won't watch files outside of it).
 *
 * By default, the external configuration is preserved as the primary source.
 * You can use the `mergeOptions` inline option (setting it to `true`) to overwrite
 * the external options with the ones defined inline in the Vite plugin.
 *
 * @param config The PWA configuration.
 * @returns The same configuration object passed in.
 */
export function definePwaConfig<
  Strategy extends VitePWAStrategy,
  Type extends SWType,
  Options extends VitePWAOptions<Strategy, Type>,
>(
  config: Partial<ExternalPWAOptions<Strategy, Type, Options>>,
): Partial<ExternalPWAOptions<Strategy, Type, Options>> {
  return config
}
