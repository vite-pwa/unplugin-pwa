/**
 * This module is a legacy version of the PWA register hook for React and will
 * be removed in the next major version.
 * @deprecated use `virtual:pwa-register/react` instead
 */
declare module 'virtual:pwa-register/react-legacy' {
  import type { PWATrustedScriptURL, RegisterSWOptions } from '@unplugin-pwa/core/types'
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-ignore ignore when react is not installed
  import type { Dispatch, SetStateAction } from 'react'

  export type { PWATrustedScriptURL, RegisterSWOptions }

  export function useRegisterSW(options?: RegisterSWOptions): {
    needRefresh: [boolean, Dispatch<SetStateAction<boolean>>]
    offlineReady: [boolean, Dispatch<SetStateAction<boolean>>]
    /**
     * Reloads the current window to allow the service worker take the control.
     */
    updateServiceWorker: () => Promise<void>
  }
}
