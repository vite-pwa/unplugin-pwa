<p align='center'>
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-core-hero-dark.svg" />
        <img src="https://raw.githubusercontent.com/vite-pwa/.github/main/unplugin-pwa-core-hero.svg" alt="Bundler-agnostic core logic and utilities for PWA logo">
    </picture>
</p>

<h1 align="center">Bundler-agnostic core logic and utilities for PWA</h1>

<p align='center'>
<a href='https://npmx.dev/package/@unplugin-pwa/core' target="_blank" rel="noopener noreferrer">
<img src='https://img.shields.io/npm/v/@unplugin-pwa/core?color=33A6B8&label=' alt="NPM version">
</a>
<a href="https://npmx.dev/package/@unplugin-pwa/core" target="_blank" rel="noopener noreferrer">
    <img alt="NPM Downloads" src="https://img.shields.io/npm/dm/@unplugin-pwa/core?color=476582&label=">
</a>
<a href="https://vite-pwa-org.netlify.app/" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/static/v1?label=&message=docs%20%26%20guides&color=2e859c" alt="Docs & Guides">
</a>
<br>
<a href="https://github.com/vite-pwa/unplugin-pwa" target="_blank" rel="noopener noreferrer">
<img alt="GitHub stars" src="https://img.shields.io/github/stars/vite-pwa/unplugin-pwa?style=social">
</a>
</p>

<br>

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg" alt="Anthony Fu SVG sponsors image" />
  </a>
</p>

## 🧱 What is `@unplugin-pwa/core`?

The bundler-agnostic foundation of `unplugin-pwa`. It contains the shared PWA logic (configuration resolution, Web App Manifest, service worker registration, virtual modules, PWA assets and inspector utilities) with no dependency on any specific bundler.

> 💡 **Note:** this package is aimed at integration authors. If you just want to add PWA support to your app, use an integration such as [`@unplugin-pwa/vite`](https://npmx.dev/package/@unplugin-pwa/vite) instead.

## 🧩 What's inside?

Each area is exposed as its own subpath export, so you only import what you need and everything stays tree-shakable.

| Area | Subpaths |
| --- | --- |
| Configuration and context | `config`, `context`, `context-types`, `constants`, `prepare-pwa-context`, `prepare-sw-names` |
| Web App Manifest | `generate-web-manifest`, `create-web-manifest-html-link`, `inject-web-manifest-html-link` |
| Service worker registration | `generate-register-sw`, `create-generate-register-sw-script`, `inject-generate-register-sw`, `generate-virtual-module` |
| Service worker utilities | `additional-manifest-entries`, `dual-sw-utilities`, `build-pwa-asset` |
| Development | `dev/prepare-sw-names-and-glob-directory`, `dev/prepare-temp-folder` |
| PWA Assets | `pwa-assets/*` (`build`, `config`, `dev`, `generator`, `html`, `manifest`, `options`, `types`, `utils`) |
| Inspector | `inspector-utils`, `resolve-inspector-dist` |
| Misc | `html`, `helpers`, `logs` |

## 🏷️ Client types

The virtual module and framework type declarations also live here, shared by all integrations:

| Subpath | Use it for |
| --- | --- |
| `@unplugin-pwa/core/client` | Virtual modules (base) |
| `@unplugin-pwa/core/vanillajs` | Vanilla JavaScript |
| `@unplugin-pwa/core/vue` | Vue 3 |
| `@unplugin-pwa/core/react` | React |
| `@unplugin-pwa/core/react-legacy` | React (legacy) |
| `@unplugin-pwa/core/preact` | Preact |
| `@unplugin-pwa/core/solid` | SolidJS |
| `@unplugin-pwa/core/svelte` | Svelte |
| `@unplugin-pwa/core/info` | `virtual:pwa-info` |
| `@unplugin-pwa/core/pwa-assets` | PWA Assets virtual modules |

```json
{
  "compilerOptions": {
    "types": ["@unplugin-pwa/core/vue"]
  }
}
```

## 📋 Requirements

`@unplugin-pwa/core` requires **Node 22.14.0 or above**.

The following peer dependencies are all optional; install them only if your integration needs them:

- `vite`: from 3.1 to 8.
- `rolldown`: 1.0.0 or above.
- `@vite-pwa/assets-generator`: 1.x or 2.x, only when using PWA Assets.

## 📦 Install

```bash
npm i @unplugin-pwa/core

# yarn
yarn add @unplugin-pwa/core

# pnpm
pnpm add @unplugin-pwa/core
```

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)
