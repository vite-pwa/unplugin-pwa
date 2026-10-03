<p align='center'>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-vite-hero-dark.svg" />
        <img src="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-vite-hero.svg" alt="Zero-config PWA Framework-agnostic Plugin for Vite and ecosystem logo">
    </picture>
</p>

<h1 align='center'>
Zero-config PWA Vite Plugin and for the Vite Ecosystem
</h1>

<p align='center'>
<a href='https://npmx.dev/package/@unplugin-pwa/vite' target="__blank">
<img src='https://img.shields.io/npm/v/@unplugin-pwa/vite?color=33A6B8&label=' alt="NPM version">
</a>
<a href="https://npmx.dev/package/@unplugin-pwa/vite" target="__blank">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@unplugin-pwa/vite?color=476582&label=">
</a>
<a href="https://vite-pwa-org.netlify.app/" target="__blank">
    <img src="https://img.shields.io/static/v1?label=&message=docs%20%26%20guides&color=2e859c" alt="Docs & Guides">
</a>
<br>
<a href="https://github.com/vite-pwa/unplugin-pwa" target="__blank">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/vite-pwa/unplugin-pwa?style=social">
</a>
</p>

<br>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg" alt="Anthony Fu SVG sponsors image"/>
  </a>
</p>

## 🚀 Features

- 📖 [**Documentation & guides**](https://vite-pwa-org.netlify.app/)
- 👌 **Zero-Config**: sensible built-in default configs for common use cases
- 🔩 **Extensible**: expose the full ability to customize the behavior of the plugin
- 🦾 **Type Strong**: written in [TypeScript](https://www.typescriptlang.org/)
- 🔌 **Offline Support**: generate service worker with offline support (via Workbox)
- ⚡ **Fully tree shakable**: auto-inject Web App Manifest
- 💬 **Prompt for new content**: built-in support for Vanilla JavaScript, Vue 3, React, Svelte, SolidJS and Preact
- ⚙️ **Stale-while-revalidate**: automatic reload when new content is available
- ✨ **Static assets handling**: configure static assets for offline support
- 🐞 **Development Support**: debug your custom service worker logic as you develop your application
- 🛠️ **Versatile**: integration with Vite, Rspack, Rsbuild and meta frameworks: [îles](https://github.com/ElMassimo/iles), [SvelteKit](https://github.com/sveltejs/kit), [VitePress](https://github.com/vuejs/vitepress), [Astro](https://github.com/withastro/astro), [Nuxt 3/4/5](https://github.com/nuxt/nuxt), [React Router](https://github.com/remix-run/react-router/) and [TanStack](https://github.com/TanStack)
- 💥 **PWA Assets Generator**: generate all the PWA assets from a single command and a single source image
- 🚀 **PWA Assets Integration**: serving, generating and injecting PWA Assets on the fly in your application

## Requirements

`@unplugin-pwa/vite` requires **Node 22.14.0 or above**.

You need to install the following dependencies:
- Rolldown 1.0.0 or above: if your Vite version is 8 or above, you don't need to install Rolldown as a dependency, because Vite 8+ uses Rolldown
- `magicast` 0.5.0 or above: when using `generateSW` strategy only

## 📦 Install

```bash
npm i @unplugin-pwa/vite -D

# yarn
yarn add @unplugin-pwa/vite -D

# pnpm
pnpm add @unplugin-pwa/vite -D
```

## 🦄 Usage

Add `VitePWA` plugin to `vite.config.js / vite.config.ts` and configure it:

```ts
// vite.config.js / vite.config.ts
import { VitePWA } from '@unplugin-pwa/vite'

export default {
  plugins: [
    VitePWA()
  ]
}
```

Read the [📖 documentation](https://vite-pwa-org.netlify.app/guide/) for a complete guide on how to configure and use
this plugin.

Check out the client type declarations [client.d.ts](./client.d.ts) for built-in frameworks support.

## 👀 Full config

Check out the type declaration [src/types.ts](./src/types.ts) and the following links for more details.

- [Web app manifests](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)
