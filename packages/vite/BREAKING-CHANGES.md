# Breaking changes

`@unplugin-pwa/vite` replaces `vite-plugin-pwa`. This guide lists what you need to change when migrating.

> ⚠️ Everyone must also update the plugin import, see [section 2](#2-plugin-import-and-vite-version).

## 1. Do I need to change my service worker setup? (read this first)

Upgrading does **not** change your service worker by default, the defaults behave like `vite-plugin-pwa`:
- `generateSW` strategy (`generateSW` also at `vite-plugin-pwa` ): classic service worker with external Workbox runtime (code splitting). 
- `buildSW` strategy (`injectManifest` at `vite-plugin-pwa` ): classic service worker with inlined Workbox runtime (no code splitting).

What you need to do depends on what you want to end up with:

| Strategy | Your goal | Action required | 
| --- | --- | --- | 
| `generateSW` | Keep **classic**, same as today | None | 
| `generateSW` |  Keep **classic** and disable code splitting | None | 
| `generateSW` |  Move to **module (ESM) only**, with or without code splitting | Self-destroying service worker for the old one + rename the new one (see below) |
| `generateSW` |  Move to **dual** (classic and module), with or without code splitting | Self-destroying service worker for the old one + rename the new one (see below) |
| `injectManifest` | Keep **classic**, same as today | None | None |
| `injectManifest` |  Keep **classic** and enable code splitting | None | None |
| `injectManifest` | Move to **module (ESM) only**, with or without code splitting | Self-destroying service worker for the old one + rename the new one (see below) |
| `injectManifest` | Move to **dual** (classic and module), with or without code splitting | Self-destroying service worker for the old one + rename the new one (see below) |

### Why the old service worker must be replaced

Clients that already have your old service worker installed cannot be updated cleanly to a different architecture (ESM, or a service worker that registers under a different name). They need a self-destroying service worker to drop the old installation first.

### Migration steps (module-only or dual)

**1. Add a self-destroying service worker to `public/`**, using **the same file name as your current service worker** (`sw.js` by default). Clients that load it unregister the old installation, clear its caches and reload.

> ⚠️ Keep this file in `public/` permanently. You can't know when a client with the old service worker will visit again, and removing it would leave those clients stuck.

> ⚠️ Users lose their cached assets once, and register the new service worker afterward.

> 💡 An interactive **Self Destroying SW CLI** to automatically generate the self-destroying service worker(s) and update your config is planned (see [Self-destroying strategy removed](#13-self-destroying-strategy-removed)).

```js
// public/sw.js: same name as your current service worker
self.addEventListener('install', (e) => {
  self.skipWaiting()
})
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.registration.unregister()
    const cacheNames = await self.caches.keys()
    await Promise.all(cacheNames.map(name => self.caches.delete(name)))
    const clients = await self.clients.matchAll({ type: 'window' })
    await Promise.all(clients.map(client => client.navigate(client.url).catch(() => {})))
  })())
})
```

> ⚠️ This deletes **all** caches of the origin. If several apps share the same origin (for example, under different paths), filter by cache name instead (filter `self.caches` before deleting).

<details>
<summary>Variant: delete only your app's caches</summary>

Filter the cache names before deleting. Workbox names its caches `workbox-precache-v2-<scope>` and `workbox-runtime-<scope>` by default, so adapt the filter if you set a custom `cacheId` or your own cache names:

```js
// public/sw.js: same name as your current service worker
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.registration.unregister()
    const cacheNames = await self.caches.keys()
    await Promise.all(cacheNames.filter(name => name.startsWith('workbox-')).map(name => self.caches.delete(name)))
    const clients = await self.clients.matchAll({ type: 'window' })
    await Promise.all(clients.map(client => client.navigate(client.url).catch(() => {})))
  })())
})
```

</details>

**2. Give the new service worker a different file name**, because Vite copies `public` assets after the build and would overwrite a generated file with the same name:

```diff
VitePWA({
+  filename: 'new-sw.js',
})
```

**3. Change the configuration:**

For `buildSW` strategy:
```diff
VitePWA({
+  swType: 'module', // or 'classic-and-module'
   buildSW: {
     // optional: split the Workbox runtime into separated chunks (code splitting)
+    // inlineWorkboxRuntime: false,
     // optional: split your own modules (for example, push notifications)
+    // customChunks: id => id.includes('push.ts') ? 'push' : undefined,
   },
})
```

For `generateSW` strategy:

```diff
VitePWA({
+  swType: 'module', // or 'classic-and-module'
   generateSW: {
     // optional: inline Workbox runtime into the service worker (no code splitting)
+    // inlineWorkboxRuntime: false,
   },
})
```

Code splitting applies to both `generateSW` and `buildSW`. `injectRegister: 'inline'` cannot be used with `classic-and-module` (see [`injectRegister: 'inline'` and dual service worker](#12-injectregister-inline-and-dual-service-worker)).

## 2. Plugin import and Vite version

The plugin is now exported by `@unplugin-pwa/vite`. Which export you use depends on your Vite version:

| Your Vite version | Import |
| --- | --- |
| Vite 6 or above | `import { VitePWA } from '@unplugin-pwa/vite'` |
| Vite < 6 | `import { ViteLegacyPWA } from '@unplugin-pwa/vite/legacy'` |

```diff
- import { VitePWA } from 'vite-plugin-pwa'
+ import { VitePWA } from '@unplugin-pwa/vite'
```

For Vite < 6:

```diff
- import { VitePWA } from 'vite-plugin-pwa'
+ import { ViteLegacyPWA } from '@unplugin-pwa/vite/legacy'

export default {
  plugins: [
-   VitePWA({ /* ... */ }),
+   ViteLegacyPWA({ /* ... */ }),
  ],
}
```

## 3. Client types (`tsconfig.json`)

The virtual module type declarations are no longer shipped by the Vite plugin: they live in `@unplugin-pwa/core`, shared by all integrations.

Replace the `vite-plugin-pwa/<framework>` entries in your `tsconfig.json` with `@unplugin-pwa/core/<framework>`:

```diff
{
  "compilerOptions": {
    "types": [
-     "vite-plugin-pwa/vue"
+     "@unplugin-pwa/core/vue"
    ]
  }
}
```

| Before | After |
| --- | --- |
| `vite-plugin-pwa/client` | `@unplugin-pwa/core/client` |
| `vite-plugin-pwa/vanillajs` | `@unplugin-pwa/core/vanillajs` |
| `vite-plugin-pwa/vue` | `@unplugin-pwa/core/vue` |
| `vite-plugin-pwa/preact` | `@unplugin-pwa/core/preact` |
| `vite-plugin-pwa/react` | `@unplugin-pwa/core/react` (or `@unplugin-pwa/core/react-legacy`, see the [React section](#4-react-useregistersw-now-registers-in-an-effect)) |
| `vite-plugin-pwa/solid` | `@unplugin-pwa/core/solid` |
| `vite-plugin-pwa/svelte` | `@unplugin-pwa/core/svelte` |
| `vite-plugin-pwa/info` | `@unplugin-pwa/core/info` |
| `vite-plugin-pwa/pwa-assets` | `@unplugin-pwa/core/pwa-assets` |

> 💡 **Note:** your code does not change. The virtual module names are the same (`virtual:pwa-register`, `virtual:pwa-register/vue`, `virtual:pwa-info`...), and so are the `declare module 'virtual:...'` augmentations you may have in your project. The only exception is the React legacy implementation, see the [React section](#4-react-useregistersw-now-registers-in-an-effect).

If you also reference the types with a triple-slash directive, update it the same way:

```diff
- /// <reference types="vite-plugin-pwa/client" />
+ /// <reference types="@unplugin-pwa/core/client" />
```

## 4. React: `useRegisterSW` now registers in an effect

The `virtual:pwa-register/react` module keeps the same name and the same `declare module` types, but the generated implementation changed. The previous implementation is still available as `virtual:pwa-register/react-legacy`.

| | Before (`vite-plugin-pwa`) | Now (default) |
| --- | --- | --- |
| When it registers | During render (side effect in the component body) | Once, inside `useEffect`, after mount |
| Re-renders | `registerSW` is called again on every render | Registers once per component instance |
| `updateServiceWorker` | New function on each render | Stable reference |
| Server-side rendering | Registration code runs while rendering | Nothing runs on the server |

What to check when upgrading:

- **Callbacks are captured on the first render.** `onNeedRefresh`, `onOfflineReady`, `onRegisteredSW`, etc. are read once. If your callbacks close over state or props that change later, they will see the initial values. Use a ref or a state setter instead.
- **Registration happens after mount**, so anything that relied on it happening synchronously during the first render needs to wait for the effect.
- **`updateServiceWorker` is safe to use in dependency arrays**, since it no longer changes between renders.

If you need the previous behavior while you migrate, use the legacy implementation. It requires **two changes**, and both must match:

1. Import from the `-legacy` virtual module in your code:

```diff
- import { useRegisterSW } from 'virtual:pwa-register/react'
+ import { useRegisterSW } from 'virtual:pwa-register/react-legacy'
```

2. Reference the legacy types in your `tsconfig.json`, so TypeScript resolves the new module name:

```diff
{
  "compilerOptions": {
    "types": [
-     "@unplugin-pwa/core/react"
+     "@unplugin-pwa/core/react-legacy"
    ]
  }
}
```

> 💡 **Note:** `@unplugin-pwa/core/client` does **not** include the legacy declarations. If you use `client`, add `@unplugin-pwa/core/react-legacy` next to it.

> ⚠️ The legacy implementation is **deprecated** and will be removed in the next major version. It registers during render, which is a side effect React discourages.

## 5. Requirements

- **Node.js 22.14.0 or above.**
- **Vite 6 or above** for `VitePWA`. For Vite < 6 use `ViteLegacyPWA` (`@unplugin-pwa/vite/legacy`).
- **`buildSW/generateSW` strategy:** requires Vite 8 or Rolldown 1.
- **`generateSW` strategy:** requires also `magicast` ^0.5.0.

## 6. Service worker templates removed

The built-in service worker templates are gone. If you relied on them, write your own service worker and use `buildSW` or `injectManifest`.

## 7. `workbox` option deprecated

Use `generateSW` instead. `workbox` option will be removed in the next major version.

```diff
VitePWA({
-  workbox: { /* ... */ },
+  generateSW: { /* ... */ },
})
```

## 8. `srcDir` removed

`srcDir` pointed to `public` in the original types, which made no sense: Vite copies `public` assets after the build and would override the generated service worker. The service worker must live in your sources, and `swSrc` must be the path **relative to the cwd**:

```diff
VitePWA({
-  srcDir: 'src',
   strategies: 'buildSW',
-  buildSW: { swSrc: 'sw.ts' },
+  buildSW: { swSrc: 'src/sw.ts' },
})
```

## 9. `injectManifest` is only for static service workers in `public`

`vite-plugin-pwa` used `public` as the default source directory for the service worker. `injectManifest` no longer builds the service worker, it only injects the precache manifest (`self.__WB_MANIFEST`). That means it only works with a **plain JavaScript service worker located in `public`**, together with any assets it imports (they must be in `public` too, because Vite copies them as they are).

If your service worker is written in TypeScript (`.ts`/`.mts`) or lives outside `public`, move it to your sources and migrate to `buildSW`, with `swSrc` relative to the cwd (see section 8):

```diff
VitePWA({
-  strategies: 'injectManifest',
-  injectManifest: { swSrc: 'src/sw.ts' },
+  strategies: 'buildSW',
+  buildSW: { swSrc: 'src/sw.ts' },
})
```

A service worker in `public` cannot use `buildSW`: Vite copies `public` assets after the build and would overwrite the generated file.

What happens if you don't migrate:

- With the dev service worker **disabled** (`devOptions.enabled` not `true`), the dev server starts and logs a warning, because the production build will fail.
- Otherwise, or in a production build, it fails with an error.

## 10. Options moved to the root

To avoid duplication, these options moved from the strategy options to the root of the plugin options:

- `minify`
- `maximumFileSizeToCacheInBytes`
- `throwMaximumFileSizeToCacheInBytes`
- `additionalManifestEntries`
- `additionalManifestEntriesGenerator`

```diff
VitePWA({
-  generateSW: { maximumFileSizeToCacheInBytes: 5_000_000 },
+  maximumFileSizeToCacheInBytes: 5_000_000,
})
```

## 11. Integration entries removed

The extra entries the integrations used to add are gone. `buildSW` exposes entries so you can add custom ones.

## 12. `injectRegister: 'inline'` and dual service worker

`injectRegister: 'inline'` cannot be combined with a dual (classic and module) service worker. Use another value or a virtual module.

## 13. Self-destroying strategy removed

The `self-destroy-sw` strategy is no longer supported directly in the build process. An interactive **Self Destroying SW CLI** is planned to safely generate the necessary auto-destroying Service Workers in your `public` folder and update your configuration automatically. See [section 1](#1-do-i-need-to-change-my-service-worker-setup-read-this-first) for manual instructions in the meantime.

## 14. Dependencies

### Replace the Workbox packages

If your project depends on any of the following packages, replace them:

| Before | After |
| --- | --- |
| `vite-plugin-pwa` | `@unplugin-pwa/vite` |
| `workbox-build` | `@vite-pwa/workbox-build` |
| `workbox-window` | `@vite-pwa/workbox-window` |
| `workbox-precaching`, `workbox-routing`, `workbox-core`, `workbox-strategies`, `workbox-expiration`... (any service worker module) | `@vite-pwa/workbox-swkit` |

`@vite-pwa/workbox-swkit` contains all the service worker modules as subpath exports (`/core`, `/precaching`, `/routing`...).

```diff
{
  "devDependencies": {
-   "vite-plugin-pwa": "...",
-   "workbox-build": "...",
-   "workbox-window": "...",
-   "workbox-precaching": "...",
-   "workbox-routing": "...",
+   "@unplugin-pwa/vite": "...",
+   "@vite-pwa/workbox-build": "...",
+   "@vite-pwa/workbox-window": "...",
+   "@vite-pwa/workbox-swkit": "..."
  }
}
```

> 💡 `@vite-pwa/workbox-swkit` also exports a default barrel with all the modules. `@vite-pwa/workbox-build` takes care of tree-shaking, including the classic build, so importing from the barrel does not bloat your service worker.

### Using `workbox-swkit` in your service worker

Import the modules from `@vite-pwa/workbox-swkit/<module>` instead of `workbox-*`. This is an example of a service worker built with the `buildSW` strategy:

```ts
// src/sw.ts
import { clientsClaim } from '@vite-pwa/workbox-swkit/core'
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from '@vite-pwa/workbox-swkit/precaching'
import { NavigationRoute, registerRoute } from '@vite-pwa/workbox-swkit/routing'

declare let self: ServiceWorkerGlobalScope

// self.__WB_MANIFEST is the default injection point
precacheAndRoute(self.__WB_MANIFEST)

// clean old assets
cleanupOutdatedCaches()

let allowlist: undefined | RegExp[]
if (import.meta.env.DEV)
  allowlist = [/^\/$/]

// to allow work offline
registerRoute(new NavigationRoute(
  createHandlerBoundToURL('index.html'),
  { allowlist },
))

self.skipWaiting()
clientsClaim()
```

```diff
VitePWA({
  strategies: 'buildSW',
  buildSW: { swSrc: 'src/sw.ts' },
})
```

Because `buildSW` builds the service worker with Vite or Rolldown, your service worker can also import your own modules and virtual modules, like any other source file.

## 15. `buildSW` does not expose the service worker to Vite

While `vite-plugin-pwa` relied on Vite to transpile the service worker in development, `@unplugin-pwa/vite` always builds it using an isolated pipeline. Consequently, any Vite plugins required by the service worker must be configured **exclusively** within the `buildSW` options.

A notable side effect of this architectural change is that the service worker can no longer be inspected via `vite-plugin-inspect` (since it runs outside the main Vite dev server). To restore this developer experience, we are actively working on bringing dedicated service worker inspection capabilities natively to `@unplugin-pwa/inspector`.

Certain `buildSW` options are passed directly to the internal Vite or Rolldown instance during the service worker build. The `buildSW` options extend from [EnvironmentData](https://github.com/vite-pwa/workbox/blob/main/packages/build/src/build/types.ts), where you can configure specific environment variables for the Vite or Rolldown build pipeline:
- [Vite BuildServiceWorkerOptions](https://github.com/vite-pwa/workbox/blob/main/packages/build/src/build/vite/types.ts)
- [Vite LegacyBuildServiceWorkerOptions](https://github.com/vite-pwa/workbox/blob/main/packages/build/src/build/vite/legacy-types.ts)
- [Rolldown BuildServiceWorkerOptions](https://github.com/vite-pwa/workbox/blob/main/packages/build/src/build/rolldown/types.ts) for legacy Vite < 8

Some of the options have been moved to the root of the plugin options, see [section 10](#10-options-moved-to-the-root).

### `enableWorkboxModulesLogs` is now `enableSWKitLogs`

If your `vite-plugin-pwa` configuration is using `enableWorkboxModulesLogs`, replace it with the new `enableSWKitLogs` option in the `buildSW` configuration:

```diff
VitePWA({
-  strategies: 'injectManifest',
-  injectManifest: { enableWorkboxModulesLogs: true },
+  strategies: 'build-sw',
+  buildSW: { enableSWKitLogs: true },
})
```

> [!WARNING]
> `enableSWKitLogs` is meant for debugging only. It also enables the SWKit assertions and increases the size of the service worker bundle, so don't ship it to production. A simple way to keep it off by default is to read it from an environment variable:
>
> ```ts
> buildSW: { enableSWKitLogs: process.env.ENABLE_SWKIT_LOGS === 'true' }
> ```

### Enabling SWKit logs in your service worker

`@vite-pwa/workbox-swkit` gates its logger behind `process.env.NODE_ENV !== 'production'`, so in a production build the logger is removed from the output and setting `self.__WB_DISABLE_DEV_LOGS` has no effect. When `buildSW.enableSWKitLogs` is enabled, the build keeps the logger **only inside the `@vite-pwa/workbox-swkit`**: `import.meta.env.PROD`, `import.meta.env.DEV` and `import.meta.env.MODE` are not modified, so your service worker keeps running its production logic. This allows debugging a Vite or Rolldown build, for example using `vite preview` after building your application and your service worker.

The build also exposes `import.meta.env.ENABLE_SWKIT_LOGS`, which is always defined (`true` or `false`), so the code below is removed from the bundle when the option is disabled or omitted.

Add this entry at the top level of your service worker (after the static imports is fine):

```ts
if (import.meta.env.ENABLE_SWKIT_LOGS) {
  self.__WB_DISABLE_DEV_LOGS = false
}
```

The same output is used for the `classic` and `module` service workers, so the logs work in both.

#### TypeScript

Your service worker needs the `webworker` lib (`/// <reference lib="webworker" />` at the top, or `"lib": ["ESNext", "WebWorker"]` in its tsconfig). Then add this global declaration at the end of your service worker:

```ts
declare global {
  interface WorkerGlobalScope {
    __WB_DISABLE_DEV_LOGS: boolean
  }
}
```

Finally, declare `ENABLE_SWKIT_LOGS` in your `src/vite-env.d.ts` to avoid TypeScript errors (`vite/client` already declares `ImportMeta`, you only need to extend `ImportMetaEnv`):

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly ENABLE_SWKIT_LOGS: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```
