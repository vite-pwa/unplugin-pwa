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
  const virtualModules = internalDevOptions.virtualModules
  if (!internalDevOptions.registerVirtualSWGenerated) {
    virtualModules.clear()
    for (const id of VIRTUAL_MODULES)
      swAssetsPaths.delete(id)
    internalDevOptions.registerVirtualSWGenerated = true
  }

  const key = `virtual:pwa-register${source === 'register' ? '' : `/${source}`}`
  let generated = virtualModules.get(key)
  if (!generated) {
    const pending: Promise<string> = ctx.customPwaAssetResolver('virtual-register-sw', source).then(
      (code) => {
        if (virtualModules.get(key) === pending)
          swAssetsPaths.set(key, code)
        return code
      },
      (error) => {
        if (virtualModules.get(key) === pending)
          virtualModules.delete(key)
        throw error
      },
    )
    virtualModules.set(key, pending)
    generated = pending
  }

  return await generated
}
