import { computed, shallowRef } from 'vue'

export const ready = shallowRef(false)
export const error = shallowRef()
export const swReady = shallowRef(false)
export const loadingSW = shallowRef(true)

export interface PWAConfiguration {
  version: string
  base: string
  swEnabled: boolean
  strategy: import('@vite-pwa/workbox-build/config/types').Strategy
  swType: import('@vite-pwa/workbox-build/types').SWType
  swDevEnabled: boolean
  currentSWType: WorkerType
  swNames: import('@unplugin-pwa/core/context-types').DevSWNames
  manifest: Partial<import('@unplugin-pwa/core').ManifestOptions>
}

export interface SWInfo {
  swType?: WorkerType
  chunks?: string[]
  dependencies?: string[]
}

export const pwaConfiguration = shallowRef<PWAConfiguration | undefined>()

export const currentSWInfo = shallowRef<SWInfo | undefined>()

export const swInfo = computed<{
  buildEnabled: boolean
  devEnabled: boolean
  currentType?: WorkerType
  chunks?: string[]
  dependencies?: string[]
}>(() => {
  const c = pwaConfiguration.value
  const i = currentSWInfo.value
  if (!c) {
    return {
      buildEnabled: false,
      devEnabled: false,
    }
  }

  if (!c.swDevEnabled) {
    return {
      buildEnabled: c.swEnabled,
      devEnabled: false,
    }
  }

  if (!i || !i.swType) {
    return {
      buildEnabled: c.swEnabled,
      devEnabled: c.swDevEnabled,
    }
  }

  let chunks: string[] = [...i.chunks ?? []]

  if (c.swType === 'classic-and-module') {
    if (i.swType === 'classic') {
      chunks = chunks.filter(d => d.includes('-classic'))
    }
    else {
      chunks = chunks.filter(d => d.includes('-module'))
    }
  }

  return {
    buildEnabled: c.swEnabled,
    devEnabled: c.swDevEnabled,
    currentType: i.swType,
    chunks,
    dependencies: i.dependencies ?? [],
  }
})

export const swType = computed(() => {
  const t = pwaConfiguration.value?.swType
  if (!t) {
    return '--'
  }
  switch (t) {
    case 'classic-and-module':
      return `classic and module`
    case 'classic':
    case 'module':
    default:
      return t
  }
})
export const version = computed(() => {
  const v = pwaConfiguration.value?.version
  return v ? `v${v}` : '--'
})

function* mapIcons(
  base: string,
  icons: import('@unplugin-pwa/core').IconResource[],
): Generator<
  import('@unplugin-pwa/core').IconResource,
  void,
  undefined
> {
  for (const icon of icons) {
    let src = icon.src
    if (icon.src.startsWith('/')) {
      src = icon.src.slice(1)
    }
    yield Object.assign({}, icon, { src: `${base}${src}`, sizes: `${icon.sizes}px` })
  }
}

export const manifest = computed(() => pwaConfiguration.value?.manifest || {})

export const icons = computed(() => {
  const conf = pwaConfiguration.value
  if (!conf || !conf.manifest || !conf.manifest.icons) {
    return undefined
  }
  return [...mapIcons(conf.base, conf.manifest.icons)]
})

function* mapShortcuts(
  base: string,
  shortcuts: import('@unplugin-pwa/core').ManifestShortcut[],
): Generator<
  import('@unplugin-pwa/core').ManifestShortcut,
  void,
  undefined
> {
  for (const shortcut of shortcuts) {
    const { icons, ...rest } = shortcut
    if (icons) {
      yield {
        ...rest,
        icons: [...mapIcons(base, icons)],
      }
    }
    else {
      yield shortcut
    }
  }
}

export const shortcuts = computed(() => {
  const conf = pwaConfiguration.value
  if (!conf || !conf.manifest || !conf.manifest.shortcuts) {
    return undefined
  }
  return [...mapShortcuts(conf.base, conf.manifest.shortcuts)]
})

function* mapScreenshots(
  base: string,
  screenshots: import('@unplugin-pwa/core').ManifestScreenshot[],
): Generator<
  import('@unplugin-pwa/core').ManifestScreenshot,
  void,
  undefined
> {
  for (const screenshot of screenshots) {
    let src = screenshot.src
    if (screenshot.src.startsWith('/')) {
      src = screenshot.src.slice(1)
    }
    yield Object.assign({}, screenshot, { src: `${base}${src}`, sizes: `${screenshot.sizes}px` })
  }
}

export const screenshots = computed(() => {
  const conf = pwaConfiguration.value
  if (!conf || !conf.manifest || !conf.manifest.screenshots) {
    return undefined
  }
  return [...mapScreenshots(conf.base, conf.manifest.screenshots)]
})
