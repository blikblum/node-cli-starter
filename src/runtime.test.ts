import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CONFIG_DIR_ENV, getConfigDir } from './runtime.js'

describe('getConfigDir', () => {
  beforeEach(() => {
    vi.stubEnv(CONFIG_DIR_ENV, '')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('uses the Tauri config directory on macOS', () => {
    vi.spyOn(process, 'platform', 'get').mockReturnValue('darwin')
    vi.spyOn(os, 'homedir').mockReturnValue('/Users/fisio')
    vi.stubEnv('XDG_CONFIG_HOME', '/custom/config')

    expect(getConfigDir()).toBe(
      path.join('/Users/fisio', 'Library/Application Support', 'node-cli-starter'),
    )
  })

  it('uses the configured directory when the environment override is set', () => {
    vi.stubEnv(CONFIG_DIR_ENV, '/custom/application-config')

    expect(getConfigDir()).toBe('/custom/application-config')
  })
})
