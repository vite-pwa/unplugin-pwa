import { isCI } from 'std-env'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: isCI ? ['text', 'lcov'] : ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*types.ts'],
    },
  },
})
