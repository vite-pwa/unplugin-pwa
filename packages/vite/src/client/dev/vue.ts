import type { RegisterSWOptions } from '@vite-pwa/unplugin-pwa-types/types'
import { shallowRef } from 'vue'

export type { RegisterSWOptions }

export function useRegisterSW(_options: RegisterSWOptions = {}) {
  const needRefresh = shallowRef(false)
  const offlineReady = shallowRef(false)

  return {
    offlineReady,
    needRefresh,
    updateServiceWorker: () => Promise.resolve(),
  }
}
