<p align='center'>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-vite-hero-dark.svg" />
        <img src="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-vite-hero.svg" alt="Zero-config PWA for Vite and its ecosystem logo">
    </picture>
</p>

<h1 align='center'>
Zero-config PWA for Vite and its ecosystem
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

## 🔌 What is `@unplugin-pwa/vite`?

The Vite integration of `unplugin-pwa`. It ships two things:

1. **Ready-to-use Vite plugins**: the main plugin for Vite 8+, and a legacy plugin for earlier versions.
2. **Building blocks for Vite-based tooling**: a set of utilities, equivalent to `@unplugin-pwa/core` but specific to Vite, that you can use to create your own integration.

The plugin itself is built on top of these utilities, and so are the integrations for meta-frameworks (VitePress, Astro, SvelteKit, Nuxt, React Router and TanStack Start). They don't wrap the Vite plugin: they compose the exported pieces directly, so each one can adapt PWA support to its own build pipeline.

## 🧩 Which one do I use?

| You are… | Use |
| --- | --- |
| Building a plain Vite app | The Vite plugin |
| Using Vite < 8 | The legacy plugin |
| Using a supported meta-framework | Its dedicated integration (it depends on this package) |
| Creating your own integration | The exported utilities |

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
