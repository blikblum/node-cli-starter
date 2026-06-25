import { cli } from 'gunshi'
import { Writable } from 'stream'

export const createWritable = () => {
  const writes: string[] = []
  const stdout = new Writable({
    write(chunk: unknown, _encoding, callback) {
      writes.push(chunk?.toString() ?? '')
      callback()
    },
  })
  return { stdout, writes }
}

export const createAndRegisterCli = (command: Parameters<typeof cli>[1]) => ({
  run: async (args: string[]) => cli(args, command),
})
