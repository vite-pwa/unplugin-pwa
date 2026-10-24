<script setup lang="ts">
import { useColorMode, useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'

const base = import.meta.env.BASE_URL
const light = `${base}icon_light.svg`
const dark = `${base}icon_dark.svg`

const devFramesColorSchema = useColorMode({
  storageKey: 'devframes-color-scheme',
  shallow: true,
  initOnMounted: false,
  listenToStorageChanges: true,
  writeDefaults: false,
})

const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')

const heroClass = computed(() => {
  const setting = devFramesColorSchema.value
  const pd = prefersDark.value

  return setting === 'dark' || (pd && setting !== 'light') ? 'dark-logo' : 'light-logo'
})
</script>

<template>
  <header
    class="px-[1rem] py-0 h-[50px] border-b border-main flex items-center"
  >
    <div class="flex flex-auto items-center ws-nowrap">
      <div class="w-8 h-8">
        <img
          :src="light"
          class="w-full h-full m-auto dark-hidden"
          alt="Unplugin PWA Inspector logo"
          draggable="false"
          :class="heroClass"
        >
        <img
          :src="dark"
          class="w-full h-full m-auto light-hidden"
          alt="Unplugin PWA Inspector logo"
          draggable="false"
          :class="heroClass"
        >
      </div>
      <div class="of-hidden pl-2 h-[50px] content-center">
        Unplugin PWA Inspector
        <sup class="align-super text-teal-700 bg-teal-700/10 dark:bg-teal-900/30 dark:text-teal-400 px-1.5 rounded italic">beta</sup>
      </div>
    </div>
  </header>
</template>

<style scoped>
@media (prefers-color-scheme: light) {
  .light-hidden {
    display: none;
  }
}
@media (prefers-color-scheme: dark) {
  .dark-hidden {
    display: none;
  }
}

.dark-logo.light-hidden {
  display: unset;
}
.dark-logo.dark-hidden {
  display: none;
}
.light-logo.dark-hidden {
  display: unset;
}
.light-logo.light-hidden {
  display: none;
}
</style>
