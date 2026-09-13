import { cli, type Command } from 'gunshi'
import { initializeLogger } from './logger.js'

import pkg from '../package.json' with { type: 'json' }

import { sampleCommand } from './commands/sample.js'
import { rootCommand } from './commands/root.js'

export const commandRegistry: Record<string, Command> = {
  sample: sampleCommand,
}

export async function runCli(args: string[]): Promise<string | undefined> {
  await initializeLogger()
  return cli(args, rootCommand, {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    subCommands: commandRegistry,
  })
}
