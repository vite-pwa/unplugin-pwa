import type { RegisterSWOptions } from '@unplugin-pwa/core/types'
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
