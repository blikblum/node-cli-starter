#!/usr/bin/env node
// NOTE: You can remove the first line if you don't plan to release an
// executable package. E.g. code that can be used as cli like prettier or eslint

import { cli } from 'gunshi'
import { sampleCommand } from './commands/sample'
import { initializeLogger } from './logger'
import { version } from '../package.json'

initializeLogger()
  .then(async () => {
    try {
      await cli(process.argv.slice(2), sampleCommand, {
        name: 'node-cli-starter',
        version,
        description: 'A starter CLI built with Gunshi',
      })
    } catch (error) {
      console.error(error)
    }
  })
  .catch(() => {
    console.error('Failed to configure logging')
    // Failed to configure logging
    process.exit(1)
  })
