import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'

fs.rmSync(
  fileURLToPath(new URL('../dev-dist', import.meta.url)),
  { recursive: true, force: true },
)
