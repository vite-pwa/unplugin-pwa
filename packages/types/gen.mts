/* eslint-disable no-console */
import { mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { normalizePath } from '@vite-pwa/workbox-build/utils/resolve-sw-names'
import { Application, OptionDefaults } from 'typedoc'

async function init() {
  const here = new URL('.', import.meta.url)
  function abs(p: string) {
    return normalizePath(fileURLToPath(new URL(p, here)))
  }

  const packages = {
    core: {
      entryPoints: [
        '../core/src/additional-manifest-entries.ts',
        '../core/src/build-pwa-asset.ts',
        '../core/src/config.ts',
        '../core/src/constants.ts',
        '../core/src/context-types.ts',
        '../core/src/context.ts',
        '../core/src/create-generate-register-sw-script.ts',
        '../core/src/create-web-manifest-html-link.ts',
        '../core/src/dev/prepare-sw-names-and-glob-directory.ts',
        '../core/src/dev/prepare-temp-folder.ts',
        '../core/src/dual-sw-utilities.ts',
        '../core/src/generate-register-sw.ts',
        '../core/src/generate-virtual-module.ts',
        '../core/src/generate-web-manifest.ts',
        '../core/src/helpers.ts',
        '../core/src/html.ts',
        '../core/src/index.ts',
        '../core/src/inject-generate-register-sw.ts',
        '../core/src/inject-web-manifest-html-link.ts',
        '../core/src/inspector-utils.ts',
        '../core/src/logs.ts',
        '../core/src/prepare-pwa-context.ts',
        '../core/src/prepare-sw-names.ts',
        '../core/src/pwa-assets/build.ts',
        '../core/src/pwa-assets/config.ts',
        '../core/src/pwa-assets/dev.ts',
        '../core/src/pwa-assets/generator.ts',
        '../core/src/pwa-assets/html.ts',
        '../core/src/pwa-assets/manifest.ts',
        '../core/src/pwa-assets/options.ts',
        '../core/src/pwa-assets/types.ts',
        '../core/src/pwa-assets/utils.ts',
        '../core/src/resolve-inspector-dist.ts',
        '../core/src/types.ts',
      ],
      output: 'core.json',
    },
    vite: {
      entryPoints: [
        '../vite/src/node/dev/create-hmr-script.ts',
        '../vite/src/node/dev/default-service-worker-assets-normalizer.ts',
        '../vite/src/node/dev/inject-hmr-script.ts',
        '../vite/src/node/dev/prepare-register-sw.ts',
        '../vite/src/node/dev/prepare-sw-build.ts',
        '../vite/src/node/helpers.ts',
        '../vite/src/node/index.ts',
        '../vite/src/node/inject-manifest-hook.ts',
        '../vite/src/node/legacy.ts',
        '../vite/src/node/plugins/build-pwa-assets.ts',
        '../vite/src/node/plugins/build-register-sw.ts',
        '../vite/src/node/plugins/build-sw.ts',
        '../vite/src/node/plugins/dev-middleware.ts',
        '../vite/src/node/plugins/dev-pwa-assets-middleware.ts',
        '../vite/src/node/plugins/dev.ts',
        '../vite/src/node/plugins/devtools.ts',
        '../vite/src/node/plugins/info.ts',
        '../vite/src/node/plugins/inspector.ts',
        '../vite/src/node/plugins/main.ts',
        '../vite/src/node/plugins/pwa-assets.ts',
        '../vite/src/node/plugins/virtual-modules.ts',
        '../vite/src/node/pwa-assets-resolver.ts',
        '../vite/src/node/vite-context.ts',
      ],
      output: 'vite.json',
    },
  } as const

  const apiDir = abs('./api')
  rmSync(apiDir, { recursive: true, force: true })
  mkdirSync(apiDir, { recursive: true })

  const app = await Application.bootstrapWithPlugins({
    tsconfig: abs('./typedoc.tsconfig.json'),
    excludeInternal: true,
    readme: 'none',
    blockTags: [...OptionDefaults.blockTags, '@memberof', '@fires'],
    excludeTags: [...OptionDefaults.excludeTags, '@memberof', '@fires'],
    validation: { invalidLink: false, notExported: true },
  })

  for (const [name, { entryPoints, output }] of Object.entries(packages)) {
    console.log(`\n[gen] ${name} — ${entryPoints.length} entry point(s)`)

    app.options.setValue('entryPoints', entryPoints.map(p => normalizePath(abs(p))))
    // app.options.setValue('exclude', exclude)
    app.options.setValue('name', name)

    const project = await app.convert()
    if (!project)
      throw new Error(`[gen] ${name}: TypeDoc conversion failed`)

    const moduleCount = project.children?.length ?? 0
    if (entryPoints.length > 1 && moduleCount !== entryPoints.length) {
      throw new Error(
        `[gen] ${name}: expected ${entryPoints.length} modules but got ${moduleCount} — an entry point was dropped`,
      )
    }
    if (moduleCount === 0)
      throw new Error(`[gen] ${name}: produced an empty project`)

    await app.generateJson(project, abs(`./api/${output}`))
  }

  console.log('\n[gen] done — per-package JSON written to api/')
}

init().catch((e) => {
  console.error(e)
})
