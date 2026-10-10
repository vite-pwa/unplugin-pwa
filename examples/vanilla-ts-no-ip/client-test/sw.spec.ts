import type { Page } from '@playwright/test'
import process from 'node:process'
import { expect, test } from '@playwright/test'
import { PW_SW_RACE_TIMEOUT, PW_TEST_PAGE_LOAD_TIMEOUT } from '../constants'

const customSW = process.env.SW === 'true'

const swName = customSW ? 'custom-sw.js' : 'sw.js'

async function findCache(page: Page) {
  return await page.evaluate(async () => {
    const cacheState: Record<string, Array<string>> = {}
    for (const cacheName of await caches.keys()) {
      const cache = await caches.open(cacheName)
      cacheState[cacheName] = (await cache.keys()).map(req => req.url)
    }
    return cacheState
  })
}

async function awaitSWRegistration(page: Page, timeoutMs: number): Promise<string> {
  return await page.evaluate(async (timeout) => {
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error(
          'Service worker registration failed: time out',
        )), timeout)
      }),
    ])
    // @ts-expect-error registration is of type unknown
    return registration.active?.scriptURL
  }, timeoutMs)
}

test('TypeScript (no injection point): The service worker is registered', async ({ page }) => {
  await page.goto('/')

  const swURL = await awaitSWRegistration(page, PW_SW_RACE_TIMEOUT)
  expect(swURL).toBe(`http://localhost:4173/${swName}`)

  let cacheContents = await findCache(page)

  if (customSW) {
    expect(Object.keys(cacheContents).length).toEqual(0)

    await page.reload({ timeout: PW_TEST_PAGE_LOAD_TIMEOUT })

    await awaitSWRegistration(page, PW_SW_RACE_TIMEOUT)

    cacheContents = await findCache(page)

    expect(Object.keys(cacheContents).length).toEqual(3)

    /*
    {
      pages: [ 'http://localhost:4173/' ],
      assets: [
        'http://localhost:4173/assets/index[.-]65a98a41.js',
      ],
      images: [ 'http://localhost:4173/favicon.svg' ]
    }
    */

    let key = 'pages'

    expect(cacheContents[key]).toBeDefined()
    let urls = cacheContents[key].map(url => url.slice('http://localhost:4173/'.length))
    expect(urls.length).toEqual(1)
    expect(urls.includes('')).toEqual(true)

    key = 'assets'
    expect(cacheContents[key]).toBeDefined()
    urls = cacheContents[key].map(url => url.slice('http://localhost:4173/'.length))
    expect(urls.length).toEqual(1)
    expect(urls.some(url => url.startsWith('assets/index-') || url.startsWith('assets/index.'))).toEqual(true)

    key = 'images'
    expect(cacheContents[key]).toBeDefined()
    urls = cacheContents[key].map(url => url.slice('http://localhost:4173/'.length))
    expect(urls.length).toEqual(1)
    expect(urls.includes('favicon.svg')).toEqual(true)
  }
  else {
    expect(Object.keys(cacheContents).length).toEqual(1)

    const key = 'workbox-precache-v2-http://localhost:4173/'

    expect(Object.keys(cacheContents)[0]).toEqual(key)

    const urls = cacheContents[key].map(url => url.slice('http://localhost:4173/'.length))

    /*
      'http://localhost:4173/index.html?__WB_REVISION__=073370aa3804305a787b01180cd6b8aa',
      'http://localhost:4173/manifest.webmanifest?__WB_REVISION__=27df2fa4f35d014b42361148a2207da3'
      */
    expect(urls.some(url => url.startsWith('manifest.webmanifest?__WB_REVISION__='))).toEqual(true)
    expect(urls.some(url => url.startsWith('index.html?__WB_REVISION__='))).toEqual(true)
    expect(urls.some(url => url.startsWith(`${swName}`))).toEqual(false)
  }
})
