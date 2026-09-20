import type { RegisterSWOptions } from '@vite-pwa/unplugin-pwa-types/types'
import { useState } from 'preact/hooks'

export type { RegisterSWOptions }

export function useRegisterSW(_options: RegisterSWOptions = {}) {
  const needRefresh = useState(false)
  const offlineReady = useState(false)

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: () => Promise.resolve(),
  }
}
