### The Architecture Diagram

```mermaid
graph TD
    subgraph Monorepo ["Vite PWA Ecosystem (unplugin-pwa)"]
        direction TB

        Core["📦 @vite-pwa/unplugin-pwa<br/>(Context, Configuration, Helpers)"]
        WB["📦 @vite-pwa/workbox-build<br/>(SW Generation, lazy-loaded)"]

        subgraph Builders ["Adapters / Builders"]
            direction LR
            Vite["📦 @vite-pwa/vite"]
            Webpack["📦 @vite-pwa/webpack"]
            Rspack["📦 @vite-pwa/rspack"]
        end

        subgraph Extras ["Optional"]
            direction LR
            Client["📦 @vite-pwa/unplugin-pwa-types<br/>(React, Vue, Svelte types...)"]
        end

    %% Internal Relations
        Vite -. "Injects Context" .-> Core
        Webpack -. "Injects Context" .-> Core
        Rspack -. "Injects Context" .-> Core

        Core == "Dynamic Import" === WB
    end

%% External Consumers
    Nuxt("Framework (e.g., Nuxt)") ==>|1. Resolves config| Core
    Nuxt ==>|2. Consumes plugin| Vite
    Vanilla("Vanilla Vite") ==>|Consumes| Vite
    Client -. "Imported by" .-> App("User App Code")

    classDef core fill:#fbca04,stroke:#333,stroke-width:2px,color:black;
    classDef builder fill:#2ea043,stroke:#333,stroke-width:2px,color:white;
    classDef framework fill:#388bfd,stroke:#333,stroke-width:2px,color:white;

    class Core core;
    class Vite,Webpack,Rspack builder;
    class Nuxt,Vanilla framework;
```

### Vanilla Vite Lifecycle Diagram (Execution Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Dev as User
    participant Config as vite.config.ts
    participant Builder as 📦 @vite-pwa/vite
    participant Core as 📦 @vite-pwa/unplugin-pwa
    participant Vite as Vite (Engine)
    participant WB as 📦 @vite-pwa/workbox-build

    Note over Dev, Core: Phase 1: Configuration & Facade Initialization
    Dev->>Config: Imports and configures VitePWA(options)
    Config->>Builder: Calls VitePWA(options)
    activate Builder
    Builder->>Core: preparePWAContext(options) (Internal call)
    activate Core
    Core-->>Builder: Returns empty/base `ctx`
    deactivate Core
    Builder-->>Config: Returns Array of modular Plugins
    deactivate Builder
    Config->>Vite: Registers plugins in Vite

    Note over Builder, Vite: Phase 2: Context Enrichment
    Vite->>Builder: Hook: configResolved
    activate Builder
    Builder->>Builder: Extracts Vite's base, build outDir, etc.
    Builder->>Core: Injects resolved Vite config into `ctx`
    deactivate Builder

    Note over Vite, WB: Phase 3: Build / Dev Execution
    Vite->>Builder: Hook: closeBundle / buildEnd
    activate Builder
    Builder->>Core: ctx.runBuild()
    activate Core
    Core->>WB: dynamic import (generateSW / buildSW)
    activate WB
    WB-->>Core: Generates Service Worker and Assets
    deactivate WB
    Core-->>Builder: Build complete
    deactivate Core
    Builder-->>Vite: Hook finished
    deactivate Builder
```

### Nuxt + Vite Lifecycle Diagram (Execution Flow)

> [!NOTE]
> **On Lifecycle Execution:**
> While the sequence diagram represents a chronological flow, it is important to understand that the architecture is highly **event-driven**. During Phase 1, the Nuxt Module (`@vite-pwa/nuxt`) only resolves the initial context and registers the lifecycle hooks. The execution is not blocking or strictly sequential thereafter. Phases 2, 3, and 4 are executed asynchronously in complete isolation whenever the underlying Nuxt and Nitro engines reach those specific milestones in their internal build processes.

```mermaid
sequenceDiagram
    autonumber
    participant Setup as 📦 @vite-pwa/nuxt
    participant Core as 📦 @vite-pwa/unplugin-pwa (Core)
    participant Builder as 📦 @vite-pwa/vite (Builder)
    participant Nuxt as Nuxt Engine
    participant Nitro as Nitro Engine
    participant Vite as Vite (@nuxt/vite-builder)
    participant WB as 📦 @vite-pwa/workbox-build

    Note over Setup, Builder: Phase 1: Context Creation & Hook Registration
    Setup->>Builder: createViteNuxtPwaContext(options)
    activate Builder
    Builder->>Core: createCustomVitePWAContext('vite')
    Core-->>Builder: Returns base agnostic `ctx`
    Builder-->>Setup: Returns base `ctx`
    deactivate Builder
    Note over Setup, Nitro: Setup finishes executing. Hooks are registered and waiting.

    Note over Setup, Nitro: Phase 2: Nitro Init (Enrichment & Paths)
    Nitro-)Setup: Asynchronous Hook: 'nitro:init'
    activate Setup
    Note over Setup, Builder: Enriches `ctx` with Nitro properties
    Note over Setup: prepareModule(ctx) (Resolves aliases & paths)
    deactivate Setup

    Note over Setup, Vite: Phase 3: Plugin Registration
    Nuxt-)Setup: Asynchronous Hook: 'build:before'
    activate Setup
    Setup->>Builder: ctx.nuxt.prepareNuxtOptions()
    activate Builder
    Note over Builder: Instantiates plugins (Main, Dev, Assets...)
    Builder->>Vite: Nuxt Kit: addVitePlugin(plugins)
    deactivate Builder
    deactivate Setup

    Note over Setup, WB: Phase 4: PWA Generation
    Nitro-)Setup: Asynchronous Hook: 'nitro:build:public-assets' (or rollup:before)
    activate Setup
    Setup->>Core: buildPwaAssets(ctx)
    activate Core
    Note over Core: Generates Web Manifest & Icons
    Note over Core: Executes ctx.runBuild()
    Core->>WB: dynamic import (generateSW / buildSW)
    activate WB
    WB-->>Core: Generates Service Worker
    deactivate WB
    Core-->>Setup: PWA Build complete
    deactivate Core
    deactivate Setup
```

## 📄 License

[MIT](./LICENSE) License &copy; 2026-PRESENT [Anthony Fu](https://github.com/antfu)