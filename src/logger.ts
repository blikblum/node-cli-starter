import { configure, getLogger, type LogRecord } from '@logtape/logtape'
import { Writable } from 'stream'

export const logger = getLogger('my-app')

function simpleFormatter(record: LogRecord): string {
  return record.message
    .map((part) => {
      if (typeof part === 'string') {
        return part
      } else if (part instanceof Error) {
        return part.stack ?? part.message
      } else {
        return JSON.stringify(part, null, 2)
      }
    })
    .join(' ')
}

let stdoutWritable: Writable = process.stdout
let stderrWritable: Writable = process.stderr

export function setLoggerOutput({ stdout, stderr }: { stdout?: Writable; stderr?: Writable }) {
  stdoutWritable = stdout ?? stdoutWritable
  stderrWritable = stderr ?? stderrWritable
}

function writableSync(record: LogRecord) {
  const message = simpleFormatter(record)
  if (record.level === 'error') {
    stderrWritable.write(message + '\n')
  } else {
    stdoutWritable.write(message + '\n')
  }
}

export async function initializeLogger() {
  await configure({
    sinks: {
      console: writableSync,
    },
    loggers: [
      { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
      { category: 'my-app', lowestLevel: 'debug', sinks: ['console'] },
    ],
  })
}
