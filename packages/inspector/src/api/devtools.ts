import type { DevToolsRpcClient } from '@vitejs/devtools-kit/client'
import type { PWAConfiguration, SWInfo } from '../state'
import { getDevToolsRpcClient } from '@vitejs/devtools-kit/client'

let rpcClient: DevToolsRpcClient

async function loadPWAConfiguration() {
  // @ts-expect-error we don't have the types here
  return await rpcClient.call('unplugin-pwa:pwa-configuration')
}

async function loadSWInfo() {
  console.log('devtoools: loadSWInfo')
  // @ts-expect-error we don't have the types here
  return await rpcClient.call('unplugin-pwa:service-worker-info')
}

export async function init(): Promise<{
  load: () => Promise<PWAConfiguration>
  sw: () => Promise<SWInfo>
}> {
  rpcClient = await getDevToolsRpcClient()
  return {
    load: loadPWAConfiguration,
    sw: loadSWInfo,
  }
}
