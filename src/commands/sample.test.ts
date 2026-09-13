import { beforeAll, describe, expect, it } from 'vitest'
import { createAndRegisterCli, createWritable } from '../testUtils.js'
import { sampleCommand } from './sample.js'
import { initializeLogger, setLoggerOutput } from '../logger.js'

describe('SampleCommand', () => {
  beforeAll(async () => {
    await initializeLogger()
  })

  it('prints t and w values if provided', async () => {
    const { stdout, writes } = createWritable()
    setLoggerOutput({ stdout })
    const cli = createAndRegisterCli(sampleCommand)

    await cli.run(['-t', '123', '-w', 'abc'])
    expect(writes).toContain('t value: 123\n')
    expect(writes).toContain('w value: abc\n')
  })

  it('prints only t if only t is provided', async () => {
    const { stdout, writes } = createWritable()
    setLoggerOutput({ stdout })
    const cli = createAndRegisterCli(sampleCommand)

    await cli.run(['-t', 'hello'])

    expect(writes).toContain('t value: hello\n')
    expect(writes.some((line: string) => line.includes('w value'))).toBe(false)
  })
})
