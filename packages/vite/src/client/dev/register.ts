import type { RegisterSWOptions } from '@unplugin-pwa/core/types'

export type { RegisterSWOptions }

export function registerSW(_options: RegisterSWOptions = {}) {
  return () => Promise.resolve()
}
