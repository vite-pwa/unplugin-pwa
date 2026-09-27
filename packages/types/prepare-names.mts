import { glob } from 'tinyglobby'

async function prepareNames() {
  const files = await glob('../{core,vite}/src/**/*.ts', {
    ignore: ['*.d.ts', '**/*.d.ts', '**/client/*.ts', '**/client/**/*.ts'],
    onlyFiles: true,
    absolute: false,
    expandDirectories: false,
  })
  for (const file of files.sort()) {
    // eslint-disable-next-line no-console
    console.log(`        '${file.replace(/\\/g, '/')}',`)
  }
}

prepareNames()
