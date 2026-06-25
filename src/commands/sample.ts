import { define } from 'gunshi'
import { logger } from '../logger'

export const sampleCommand = define({
  name: 'sample',
  description: 'Sample command',
  args: {
    t: {
      type: 'string',
      short: 't',
      description: 't value',
    },
    w: {
      type: 'string',
      short: 'w',
      description: 'w value',
    },
  },
  run: (ctx: { values: { t?: string; w?: string } }) => {
    logger.info(`sample command`)
    if (ctx.values.t) {
      logger.info(`t value: ${ctx.values.t}`)
    }
    if (ctx.values.w) {
      logger.info(`w value: ${ctx.values.w}`)
    }
  },
})
