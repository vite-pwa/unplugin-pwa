<br/>

<p align='center'>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-hero-dark.svg" />
        <img src="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-hero.svg" alt="unplugin-pwa - PWA Ecosystem">
    </picture>
</p>

<h1 align="center">PWA Ecosystem</h1>

<p align='center'>
<a href="https://github.com/vite-pwa/unplugin-pwa" target="__blank">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/vite-pwa/unplugin-pwa?style=social">
</a>
</p>

<br>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>


## 🧩 Why a Modular Ecosystem?

The new architecture shifts the responsibility away from rigid configurations toward an extensible, programmatic pipeline where integrations and meta-frameworks *know exactly what to do*.

* **Granular and Modular**: Instead of forcing you into a single monolithic config, you can now compose your PWA layer using low-level plugin pieces or stick to the simple application-level wrapper.
* **Universal Bundler Support (`unplugin`)**: By embracing the `unplugin` architecture, the ecosystem breaks free from Vite-only constraints. It now provides native, first-class adapters for **Webpack**, **Rspack**, **Rsbuild**, and **Rolldown**, ensuring a unified and consistent PWA configuration API regardless of your underlying build tool.
* **Next-Gen Meta-Framework Logic**: Meta-framework integrations (Nuxt, SvelteKit, Astro, VitePress, etc.) are getting a massive logic simplification. The underlying core plugins will handle the orchestration natively without complex boilerplate hacks.
* **Vite Environment API Ready**: The new core is built looking forward. It comes with out-of-the-box support for Vite 8 and features on-demand activation for the new **Vite Environment API** (introduced at Vite 6). The underlying framework integrations will automatically tap into these environments when required—only when activated on demand—meaning zero dead weight for standard builds.
* **Smart Dual-Registration & Zero-Overhead DCE**: When Dual Build is active, the generated virtual modules utilize the `esm-sw-detector` to dynamically register the ESM or Classic variant depending on browser capabilities. However, if the consumer configures a single baseline build (pure Classic or pure ESM), the compiler applies aggressive **Tree-Shaking / Dead Code Elimination (DCE)** to entirely purge the `esm-sw-detector` logic from the resulting virtual chunk, guaranteeing zero overhead for standard applications.
* **Native TrustedScriptURL & CSP Compliance**: Legacy virtual modules lacked flexibility when strict Content Security Policies were enforced during Service Worker registration. The new architecture introduces first-class support for `TrustedScriptURL`, including a highly flexible, custom callback option to safely resolve and sanitize the script URL before registration kicks in.

## 🚀 Features

- 📖 [**Documentation & guides**](https://vite-pwa-org.netlify.app/)
- 👌 **Zero-Config**: sensible built-in default configs for common use cases
- 🔩 **Extensible**: expose the full ability to customize the behavior of the plugin
- 🦾 **Type Strong**: written in [TypeScript](https://www.typescriptlang.org/)
- 🔌 **Offline Support**: generate service worker with offline support (via Workbox)
- ⚡ **Fully tree shakable**: client virtual modules are strictly optimized for Dead Code Elimination.
- 📄 **Web Manifest**: auto-inject Web App Manifest and PWA assets seamlessly.
- 💬 **Prompt for new content**: built-in support for Vanilla JavaScript, Vue 3, React, Svelte, SolidJS and Preact
- ⚙️ **Stale-while-revalidate**: automatic reload when new content is available
- ✨ **Static assets handling**: configure static assets for offline support
- 🐞 **Development Support**: debug your custom service worker logic as you develop your application
- 📦 **Universal Bundlers**: native integration with Vite, Rolldown, Webpack (WIP), Rspack (WIP), and Rsbuild (WIP).
- 🛠️ **Meta-Frameworks**: seamless integration with [îles](https://github.com/ElMassimo/iles), [SvelteKit](https://github.com/sveltejs/kit), [VitePress](https://github.com/vuejs/vitepress), [Astro](https://github.com/withastro/astro), [Nuxt 3/4/5](https://github.com/nuxt/nuxt), [React Router](https://github.com/remix-run/react-router/), [TanStack](https://github.com/TanStack) and [Next](https://github.com/vercel/next.js/) (WIP).
- 💥 **PWA Assets Generator**: generate all the PWA assets from a single command and a single source image
- 🚀 **PWA Assets Integration**: serving, generating and injecting PWA Assets on the fly in your application

> [!WARNING]
> **Work In Progress (WIP)**
> While the Vite ecosystem and its associated meta-frameworks are fully operational, adapters for **Webpack, Rspack, Rsbuild**, and the **Next.js** integration are currently under active development. They are provided as previews and are not yet ready for production use.

## 🏗️ Architecture & Integrations

`unplugin-pwa` has evolved from a monolithic Vite plugin into a modular, framework-agnostic ecosystem.

If you are a framework maintainer, module author, or just curious about how the inner pieces fit together (Core, Builders, Client types, and Workbox), check out our comprehensive [Architecture & Lifecycle Guide](./ARCHITECTURE.md).

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)