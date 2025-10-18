#!/usr/bin/env node
// NOTE: You can remove the first line if you don't plan to release an
// executable package. E.g. code that can be used as cli like prettier or eslint

import { runExit } from 'clipanion'
import { SampleCommand } from './commands/SampleCommand'
import { initializeLogger } from './logger'

initializeLogger()
  .then(() => {
    runExit([SampleCommand]).catch((error: unknown) => {
      console.error(error)
    })
  })
  .catch(() => {
    console.error('Failed to configure logging')
    // Failed to configure logging
    process.exit(1)
  })
