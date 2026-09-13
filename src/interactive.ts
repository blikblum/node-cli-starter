import { runInteractive } from './interactive-runner.js'

void runInteractive().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
