import { Command, Option } from 'clipanion'
import { logger } from '../logger'

export class SampleCommand extends Command {
  static paths = [[]]

  valueT = Option.String('-t', { required: false })
  valueW = Option.String('-w', { required: false })

  // eslint-disable-next-line @typescript-eslint/require-await
  async execute() {
    if (this.valueT) {
      logger.info(`t value: ${this.valueT}`)
    }
    if (this.valueW) {
      logger.info(`w value: ${this.valueW}`)
    }
  }
}
