import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildPwaAsset } from '../src/build-pwa-asset'

function createMockContext(mode: string, devEnvironment: boolean): any {
  return {
    consumerOptions: {},
    resolvedOptions: {
      strategy: 'generate-sw',
      base: '/',
      buildBase: '/',
      scope: '/',
      updateViaCache: 'imports',
      minify: mode === 'production',
      generateSW: { mode },
    },
    devEnvironment,
    dev: { options: { swType: 'classic' } },
  }
}

describe('build-pwa-asset: NODE_ENV injection', () => {
  const dummyCode = `
    export const env = process.env.NODE_ENV;
    if (process.env.NODE_ENV !== 'production') {
      console.log('WORKBOX DEBUG LOG');
    }
  `

  it('should inject production NODE_ENV and remove debug logs when mode is production', async () => {
    const ctx = createMockContext('production', false)
    const result = await buildPwaAsset(dummyCode, ctx as any)

    // Should contain the value production
    expect(result).toMatch(/[`'"]production[`'"]/)
    // The bundler (Rollup) should have removed the console.log because it is unreachable code
    expect(result).not.toContain('WORKBOX DEBUG LOG')
  })

  it('should inject development NODE_ENV and keep debug logs when devEnvironment is true', async () => {
    const ctx = createMockContext('development', true)
    const result = await buildPwaAsset(dummyCode, ctx as any)

    // Should contain the value development
    expect(result).toMatch(/[`'"]development[`'"]/)
    // The console.log should be kept because the condition is true
    expect(result).toContain('WORKBOX DEBUG LOG')
  })

  it('should inject development NODE_ENV when mode is development even if not in devEnvironment (vite build --mode development)', async () => {
    // devEnvironment is false (we are building), but mode is development
    const ctx = createMockContext('development', false)
    const result = await buildPwaAsset(dummyCode, ctx as any)

    expect(result).toMatch(/[`'"]development[`'"]/)
    expect(result).toContain('WORKBOX DEBUG LOG')
  })
})

describe('build-pwa-asset: dependency resolution', () => {
  const cwd = process.cwd()
  let emptyRoot: string

  beforeEach(async () => {
    emptyRoot = await mkdtemp(join(tmpdir(), 'unplugin-pwa-'))
    process.chdir(emptyRoot)
  })

  afterEach(async () => {
    process.chdir(cwd)
    await rm(emptyRoot, { recursive: true, force: true })
  })

  it('should bundle @vite-pwa/workbox-window when it is not installed in the project root', async () => {
    const code = `
      import { isServiceWorkerModuleSupported } from '@vite-pwa/workbox-window/esm-sw-detector'
      export async function register() {
        const { Workbox } = await import('@vite-pwa/workbox-window')
        return isServiceWorkerModuleSupported() && new Workbox('/sw.js')
      }
    `
    const result = await buildPwaAsset(code, createMockContext('production', false))

    expect(result).not.toMatch(/(?:from|import\()\s*["']@vite-pwa\/workbox-window/)
    expect(result).toContain('messageSkipWaiting')
  })

  it('should keep framework imports external when they are installed in the project root', async () => {
    const vueDir = join(emptyRoot, 'node_modules', 'vue')
    await mkdir(vueDir, { recursive: true })
    await writeFile(join(vueDir, 'package.json'), JSON.stringify({ name: 'vue', type: 'module', main: 'index.js' }))
    await writeFile(join(vueDir, 'index.js'), `export const shallowRef = v => ({ value: v, __bundled_vue__: true })`)

    const code = `
      import { shallowRef } from 'vue'
      export const needRefresh = shallowRef(false)
    `
    const result = await buildPwaAsset(code, createMockContext('production', false))

    expect(result).toMatch(/from\s*["']vue["']/)
    expect(result).not.toContain('__bundled_vue__')
  })
})
