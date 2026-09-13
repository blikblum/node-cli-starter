import os from 'node:os'
import path from 'node:path'

// initial setup: replace node-cli-starter with actual cli id
const APP_NAME = 'node-cli-starter'
export const CONFIG_DIR_ENV = 'NODE_CLI_STARTER_CONFIG_DIR'

function getAppDir(category: 'cache' | 'config' | 'data'): string {
  const xdgHome = process.env[`XDG_${category.toUpperCase()}_HOME`]
  const isWindows = process.platform === 'win32'
  const home = os.homedir()
  const windowsLocalAppData = isWindows ? process.env.LOCALAPPDATA : undefined
  const macosConfigDir =
    process.platform === 'darwin' && category === 'config'
      ? path.join(home, 'Library/Application Support')
      : undefined
  const base =
    macosConfigDir ??
    xdgHome ??
    windowsLocalAppData ??
    path.join(home, category === 'data' ? '.local/share' : `.${category}`)

  return path.join(base, APP_NAME)
}

export function getConfigDir(): string {
  const configuredDirectory = process.env[CONFIG_DIR_ENV]
  if (configuredDirectory) return configuredDirectory

  return getAppDir('config')
}

export function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}
