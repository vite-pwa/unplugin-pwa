# Breaking changes

`@unplugin-pwa/vite` replaces `vite-plugin-pwa`. This guide lists what you need to change when migrating.

## 1. Do I need to change my service worker setup? (read this first)

Upgrading does **not** change your service worker by default: the defaults behave like `vite-plugin-pwa` (classic service worker, Workbox runtime inline, no code splitting). What you need to do depends on what you want to end up with:

| Your goal | Action required |
| --- | --- |
| Keep **classic**, same as today | None |
| Keep **classic** and enable code splitting | None |
| Move to **module (ESM) only**, with or without code splitting | Self-destroying service worker for the old one + rename the new one (see below) |
| Move to **dual** (classic and module), with or without code splitting | Self-destroying service worker for the old one + rename the new one (see below) |

### Why the old service worker must be replaced

Clients that already have your old service worker installed cannot be updated cleanly to a different architecture (ESM, or a service worker that registers under a different name). They need a self-destroying service worker to drop the old installation first.

### Migration steps (module-only or dual)

**1. Add a self-destroying service worker to `public/`**, using **the same file name as your current service worker** (`sw.js` by default). Clients that load it unregister the old installation, clear its caches and reload.

> ⚠️ Keep this file in `public/` permanently. You can't know when a client with the old service worker will visit again, and removing it would leave those clients stuck.

> ⚠️ Users lose their cached assets once, and register the new service worker afterward.

**2. Give the new service worker a different file name**, because Vite copies `public` assets after the build and would overwrite a generated file with the same name:

```diff
VitePWA({
+  filename: 'sw-app.js',
})
```

**3. Change the configuration:**

```diff
VitePWA({
+  swType: 'module', // or 'classic-and-module'
   // optional: split the Workbox runtime into separate chunks
+  // inlineWorkboxRuntime: false,
   // optional: split your own modules (for example, push notifications)
+  // customChunks: id => id.includes('push') ? 'push' : undefined,
})
```

Code splitting applies to both `generateSW` and `buildSW`. `injectRegister: 'inline'` cannot be used with `classic-and-module` (see section 12).

> 💡 A codemod to generate the self-destroying service worker is planned (see section 13).
 

## 2. Client types (`tsconfig.json`)

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
| `vite-plugin-pwa/react` | `@unplugin-pwa/core/react` (or `@unplugin-pwa/core/react-legacy`, see section 2) |
| `vite-plugin-pwa/solid` | `@unplugin-pwa/core/solid` |
| `vite-plugin-pwa/svelte` | `@unplugin-pwa/core/svelte` |
| `vite-plugin-pwa/info` | `@unplugin-pwa/core/info` |
| `vite-plugin-pwa/pwa-assets` | `@unplugin-pwa/core/pwa-assets` |

> 💡 **Note:** your code does not change. The virtual module names are the same (`virtual:pwa-register`, `virtual:pwa-register/vue`, `virtual:pwa-info`...), and so are the `declare module 'virtual:...'` augmentations you may have in your project. The only exception is the React legacy implementation, see section 2.

If you also reference the types with a triple-slash directive, update it the same way:

```diff
- /// <reference types="vite-plugin-pwa/client" />
+ /// <reference types="@unplugin-pwa/core/client" />
```

## 3. React: `useRegisterSW` now registers in an effect

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

> ⚠️ The legacy implementation is **deprecated** and will be removed in a future major version. It registers during render, which is not safe with React Strict Mode or concurrent rendering.

## 4. Requirements

- **Node.js 22.14.0 or above.**
- **Vite 5 or above.** Vite 3 and 4 may or may not work.
- **`buildSW` strategy:** requires Vite 8 or Rolldown 1.
- **`generateSW` strategy:** requires `magicast` ^0.5.0.

## 5. Service worker templates removed

The built-in service worker templates are gone. If you relied on them, write your own service worker and use `buildSW` or `injectManifest`.

## 6. `workbox` option deprecated

Use `generateSW` instead. `workbox` will be removed in the next major version.

```diff
VitePWA({
-  workbox: { /* ... */ },
+  generateSW: { /* ... */ },
})
```

## 6. `srcDir` removed

`srcDir` pointed to `public` in the original types, which made no sense: Vite copies `public` assets after the build and would override the generated service worker. The service worker must live in your sources, and `swSrc` must be the path **relative to the cwd**:

```diff
VitePWA({
-  srcDir: 'src',
   strategies: 'buildSW',
-  buildSW: { swSrc: 'sw.ts' },
+  buildSW: { swSrc: 'src/sw.ts' },
})
```

## 7. `injectManifest` with a TypeScript or `public` service worker

If `swSrc` ends in `.ts`/`.mts`, or the service worker is in `public`, `injectManifest` cannot work: it does not build the service worker. Migrate to `buildSW`.

- With the dev service worker **disabled**, the dev server starts and logs a warning.
- Otherwise, or in a production build, it fails with an error.

## 8. `buildSW` does not expose the service worker to Vite

`vite-plugin-pwa` relied on Vite to transpile the service worker in development. `@unplugin-pwa/vite` always builds it, so any Vite plugins the service worker needs must go **only** in the `buildSW` options.

## 9. Options moved to the root

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

## 10. Integration entries removed

The extra entries the integrations used to add are gone. `buildSW` exposes entries so you can add custom ones.

## 11. `injectRegister: 'inline'` and dual service worker

`injectRegister: 'inline'` cannot be combined with a dual (classic and module) service worker. Use another value or a virtual module.

## 12. Self-destroying strategy removed

The `self-destroy-sw` strategy is no longer supported by the plugin. A codemod will be provided to generate the self-destroying service worker in your `public` folder. See the next section for when you need to generate a new service worker.

## 13. Migrating to a dual service worker (opt-in)

This is **not required** to upgrade: the defaults behave like `vite-plugin-pwa` (classic service worker, Workbox runtime inline, no code splitting).

Enable the dual build only if you want to serve a classic and a module service worker at the same time. Clients that already have the old service worker installed must drop it first, so the migration has two steps.

### Step 1: replace the old service worker

Add a self-destroying service worker to `public/`, using **the same file name as your current service worker** (`sw.js` by default). Clients that load it will unregister the old installation, clear its caches and reload.

> ⚠️ Keep this file in `public/` permanently. You can't know when a client with the old service worker will visit again, and removing it would leave those clients stuck.

> ⚠️ Users lose their cached assets once, and register the new service worker afterward.

> ⚠️ Vite copies `public` assets after the build, so the dual build must not emit a file with that same name, or the copy will overwrite it. Check the generated file names.

### Step 2: change the configuration

```diff
VitePWA({
+  swType: 'classic-and-module',
   // optional: split the Workbox runtime into separate chunks
+  // inlineWorkboxRuntime: false,
   // optional: split your own modules (for example, push notifications)
+  // customChunks: id => id.includes('push') ? 'push' : undefined,
})
```

`injectRegister: 'inline'` cannot be used with `classic-and-module` (see section 11). Code splitting applies to both `generateSW` and `buildSW`.


