import { runCli } from './cli.js'

async function main(): Promise<void> {
  await runCli(process.argv.slice(2))
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
