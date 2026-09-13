import { define } from 'gunshi'
import { logger } from '../logger.js'

export const rootCommand = define({
  name: 'root',
  description: 'Root command',
  run: () => {
    logger.info(`root command`)
  },
})
