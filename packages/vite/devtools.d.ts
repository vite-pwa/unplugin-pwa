import '@vitejs/devtools-kit'

declare module '@vitejs/devtools-kit' {
  interface DevToolsRpcServerFunctions {
    'unplugin-pwa:pwa-configuration': () => Promise<{
      version: string
      base: string
      swEnabled: boolean
      strategy: import('@vite-pwa/workbox-build/config/types').Strategy
      swType: import('@vite-pwa/workbox-build/types').SWType
      swDevEnabled: boolean
      currentSWType: WorkerType
      swNames: import('@vite-pwa/unplugin-pwa-core/context-types').DevSWNames
      manifest: Partial<import('@vite-pwa/unplugin-pwa-core/types').ManifestOptions>
    }>
    'unplugin-pwa:service-worker-info': () => Promise<{
      swType?: WorkerType
      chunks?: string[]
      dependencies?: string[]
    }>
  }
}
