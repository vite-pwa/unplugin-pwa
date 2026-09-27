import type { VitePWAPluginContext } from '../vite-context'
import { promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { FILE_SW_REGISTER } from '@unplugin-pwa/core/constants'
import { generateRegisterSW } from '@unplugin-pwa/core/generate-register-sw'
import { normalizePath } from '@vite-pwa/workbox-build/utils/resolve-sw-names'

export async function prepareRegisterSw(
  ctx: VitePWAPluginContext<any, any, any>,
) {
  if (ctx.resolvedOptions.injectRegister === 'script' || ctx.resolvedOptions.injectRegister === 'script-defer') {
    if (!ctx.dev.options.registerSWGenerated) {
      const code = await generateRegisterSW(ctx)
      if (code) {
        const internalDevOptions = ctx.dev.options!
        const registerSW = resolve(internalDevOptions.tempFolder, FILE_SW_REGISTER)
        await fs.writeFile(registerSW, code, { encoding: 'utf8' })
        internalDevOptions.registerSWGenerated = true
        internalDevOptions.swAssetsPaths.set(normalizePath(`${ctx.base}${FILE_SW_REGISTER}`), registerSW)
      }
    }
  }
}
