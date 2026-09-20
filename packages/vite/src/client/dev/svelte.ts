import type { RegisterSWOptions } from '@vite-pwa/unplugin-pwa-types/types'
import { writable } from 'svelte/store'

export type { RegisterSWOptions }

export function useRegisterSW(_options: RegisterSWOptions = {}) {
  const needRefresh = writable(false)
  const offlineReady = writable(false)

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: () => Promise.resolve(),
  }
}
