import type { PWAPluginContext } from '@unplugin-pwa/core/context-types'
import { promises as fs } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { VIRTUAL_MODULES } from '@unplugin-pwa/core/constants'

export async function generateVirtualModule(
  ctx: PWAPluginContext<any, any, any>,
  source = 'register',
): Promise<string> {
  if (ctx.resolvedOptions.disable || (ctx.devEnvironment && !ctx.resolvedOptions.devOptions?.enabled)) {
    const _dirname = typeof __dirname !== 'undefined'
      ? __dirname
      : dirname(fileURLToPath(import.meta.url))

    return await fs.readFile(resolve(_dirname, `../client/dev/${source}.js`), 'utf-8')
  }

  const internalDevOptions = ctx.dev.options!
  const swAssetsPaths = internalDevOptions.swAssetsPaths
  if (!internalDevOptions.registerVirtualSWGenerated) {
    for (const id of VIRTUAL_MODULES)
      swAssetsPaths.delete(id)
    internalDevOptions.registerVirtualSWGenerated = true
  }

  const key = `virtual:pwa-register${source === 'register' ? '' : `/${source}`}`
  let code = swAssetsPaths.get(key)
  if (code === undefined) {
    code = await ctx.customPwaAssetResolver('virtual-register-sw', source)
    swAssetsPaths.set(key, code)
  }

  return code
}
