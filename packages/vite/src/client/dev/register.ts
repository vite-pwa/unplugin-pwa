import type { RegisterSWOptions } from '@vite-pwa/unplugin-pwa-types/types'

export type { RegisterSWOptions }

export function registerSW(_options: RegisterSWOptions = {}) {
  return () => Promise.resolve()
}
