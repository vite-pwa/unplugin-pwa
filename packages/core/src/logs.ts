import { errStyle } from '@vite-pwa/workbox-build/utils/colors'
import { INSPECTOR_BASE_PATH } from './constants'

export const inspectorWithInjectManifestWarning = [
  `\n${errStyle(['yellow', 'bold'], '[Vite PWA]')} ${errStyle('yellow', 'Vite PWA Inspector won\'t work as expected')}:\n`,
  `You are using ${errStyle('cyan', 'inject-manifest')} strategy, your service worker is ${errStyle('cyan', 'static')}.`,
  `If you want to see ${errStyle('cyan', 'Vite PWA Inspector')}, you can:`,
  `  - use hard refresh when opening ${errStyle('cyan', 'Vite PWA Inspector')} page to bypass the service worker interception or`,
  `  - you can add ${errStyle('green', `'${INSPECTOR_BASE_PATH}'`)} to your ${errStyle('cyan', 'NavigationRoute denylist option')}:`,
  `    ${errStyle('green', 'registerRoute(new NavigationRoute(createHandlerBoundToURL(\'index.html\'), { denylist: [/^\\/__unplugin_pwa_inspector/] }))')}\n`,
].join('\n')
