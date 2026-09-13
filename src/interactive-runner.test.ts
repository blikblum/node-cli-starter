import { promises as fs } from 'node:fs'
import path from 'node:path'
import { tmpdir } from 'node:os'
import type { Command } from 'gunshi'
import { describe, expect, it, vi } from 'vitest'

import { commandRegistry } from './cli.js'
import {
  appendHistory,
  createHistoryStore,
  getCommandChoices,
  promptForArguments,
  runInteractive,
  type HistoryEntry,
  type PromptAdapter,
} from './interactive-runner.js'

function createPromptAdapter(overrides: Partial<PromptAdapter> = {}): PromptAdapter {
  return {
    select: vi.fn(),
    input: vi.fn(),
    number: vi.fn(),
    confirm: vi.fn(),
    ...overrides,
  }
}

describe('interactive command runner', () => {
  it('lists every registered command with its description', () => {
    const choices = getCommandChoices()

    expect(choices.map(({ value }) => value)).toEqual(Object.keys(commandRegistry))
    expect(choices.map(({ description }) => description)).toEqual(
      Object.values(commandRegistry).map(({ description }) => description),
    )
  })

  it('turns prompted argument values into Gunshi argv tokens', async () => {
    const command: Command = {
      args: {
        requiredText: { type: 'string', required: true, description: 'Required text' },
        optionalText: { type: 'string', description: 'Optional text' },
        count: { type: 'number', required: true, description: 'Count' },
        debug: { type: 'boolean', default: false, description: 'Debug' },
        headless: { type: 'boolean', default: true, description: 'Headless' },
        mode: { type: 'enum', choices: ['one', 'two'], required: true, description: 'Mode' },
        custom: { type: 'custom', parse: (value) => value, description: 'Custom' },
        tasks: { type: 'string', multiple: true, description: 'Tasks' },
      },
    }
    const input = vi
      .fn<PromptAdapter['input']>()
      .mockResolvedValueOnce('value with spaces')
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('raw-value')
      .mockResolvedValueOnce('register, print')
    const prompts = createPromptAdapter({
      input,
      number: vi.fn<PromptAdapter['number']>().mockResolvedValue(3),
      confirm: vi
        .fn<PromptAdapter['confirm']>()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false),
      select: vi.fn<PromptAdapter['select']>().mockResolvedValue('two'),
    })

    await expect(promptForArguments(command, prompts)).resolves.toEqual([
      '--requiredText',
      'value with spaces',
      '--count',
      '3',
      '--debug',
      '--no-headless',
      '--mode',
      'two',
      '--custom',
      'raw-value',
      '--tasks',
      'register',
      '--tasks',
      'print',
    ])
    expect(input.mock.calls[0]?.[0].validate?.('')).toBe('Informe um valor.')
  })

  it('loads missing or malformed history as empty and keeps five valid entries', async () => {
    const directory = await fs.mkdtemp(path.join(tmpdir(), 'node-cli-interactive-'))
    const filePath = path.join(directory, 'history.json')
    const store = createHistoryStore(filePath)

    await expect(store.load()).resolves.toEqual([])
    await fs.writeFile(filePath, '{invalid')
    await expect(store.load()).resolves.toEqual([])
    await fs.writeFile(
      filePath,
      JSON.stringify([
        { command: 'valid', args: ['--value', '1'], runAt: '2026-01-01T00:00:00.000Z' },
        { command: 'invalid', args: [1], runAt: '2026-01-01T00:00:00.000Z' },
      ]),
    )
    await expect(store.load()).resolves.toEqual([
      { command: 'valid', args: ['--value', '1'], runAt: '2026-01-01T00:00:00.000Z' },
    ])

    const entries = Array.from({ length: 6 }, (_, index) => ({
      command: `command-${index}`,
      args: [],
      runAt: `2026-01-0${index + 1}T00:00:00.000Z`,
    }))
    await store.save(entries)
    await expect(store.load()).resolves.toEqual(entries.slice(0, 5))
  })

  it('does not append an exact command and args duplicate', () => {
    const duplicate: HistoryEntry = {
      command: 'info',
      args: ['--format', 'json'],
      runAt: '2026-01-06T00:00:00.000Z',
    }
    const history = [{ ...duplicate, runAt: '2026-01-01T00:00:00.000Z' }]

    expect(appendHistory(history, duplicate)).toBe(history)
  })

  it('treats changes to the command or ordered args as distinct and keeps five entries', () => {
    const history = Array.from({ length: 5 }, (_, index) => ({
      command: `command-${index}`,
      args: ['--format', 'json'],
      runAt: `2026-01-0${index + 1}T00:00:00.000Z`,
    }))
    const firstEntry = history[0]
    if (!firstEntry) throw new Error('Expected history to contain entries')
    const entries: HistoryEntry[] = [
      {
        command: 'other-command',
        args: firstEntry.args,
        runAt: '2026-01-06T00:00:00.000Z',
      },
      {
        command: firstEntry.command,
        args: ['--format', 'text'],
        runAt: '2026-01-06T00:00:00.000Z',
      },
      {
        command: firstEntry.command,
        args: ['json', '--format'],
        runAt: '2026-01-06T00:00:00.000Z',
      },
    ]

    for (const entry of entries) {
      expect(appendHistory(history, entry)).toEqual([entry, ...history.slice(0, 4)])
    }
  })

  it('offers matching history only and executes a replay without saving it again', async () => {
    const oldRun: HistoryEntry = {
      command: 'other',
      args: ['--ignored'],
      runAt: '2026-01-01T00:00:00.000Z',
    }
    const matchingRun: HistoryEntry = {
      command: 'chosen',
      args: ['--value', 'saved'],
      runAt: '2026-01-02T00:00:00.000Z',
    }
    const events: string[] = []
    const save = vi.fn(async () => {
      events.push('save')
    })
    const select = vi
      .fn<PromptAdapter['select']>()
      .mockResolvedValueOnce('chosen')
      .mockResolvedValueOnce('rerun')
      .mockResolvedValueOnce(matchingRun.runAt)
    const execute = vi.fn(async () => {
      events.push('execute')
    })

    await runInteractive({
      commands: { chosen: { description: 'Chosen' }, other: { description: 'Other' } },
      prompts: createPromptAdapter({ select }),
      history: { load: async () => [oldRun, matchingRun], save },
      now: () => new Date('2026-01-03T00:00:00.000Z'),
      execute,
    })

    expect(select.mock.calls[2]?.[0].choices).toEqual([
      expect.objectContaining({ value: matchingRun.runAt }),
    ])
    expect(save).not.toHaveBeenCalled()
    expect(execute).toHaveBeenCalledWith(['chosen', '--value', 'saved'])
    expect(events).toEqual(['execute'])
  })

  it('saves a distinct invocation before executing it', async () => {
    const savedRun: HistoryEntry = {
      command: 'chosen',
      args: ['--value', 'saved'],
      runAt: '2026-01-02T00:00:00.000Z',
    }
    const events: string[] = []
    const save = vi.fn(async () => {
      events.push('save')
    })
    const select = vi
      .fn<PromptAdapter['select']>()
      .mockResolvedValueOnce('chosen')
      .mockResolvedValueOnce('new')
    const execute = vi.fn(async () => {
      events.push('execute')
    })

    await runInteractive({
      commands: {
        chosen: {
          args: { value: { type: 'string', description: 'Value' } },
          description: 'Chosen',
        },
      },
      prompts: createPromptAdapter({
        select,
        input: vi.fn<PromptAdapter['input']>().mockResolvedValue('fresh'),
      }),
      history: { load: async () => [savedRun], save },
      now: () => new Date('2026-01-03T00:00:00.000Z'),
      execute,
    })

    expect(save).toHaveBeenCalledWith([
      {
        command: 'chosen',
        args: ['--value', 'fresh'],
        runAt: '2026-01-03T00:00:00.000Z',
      },
      savedRun,
    ])
    expect(execute).toHaveBeenCalledWith(['chosen', '--value', 'fresh'])
    expect(events).toEqual(['save', 'execute'])
  })

  it('handles prompt cancellation without saving or executing', async () => {
    const cancellation = new Error('cancelled')
    cancellation.name = 'ExitPromptError'
    const save = vi.fn()
    const execute = vi.fn()
    const log = vi.fn()

    await runInteractive({
      commands: { chosen: {} },
      prompts: createPromptAdapter({
        select: vi.fn<PromptAdapter['select']>().mockRejectedValue(cancellation),
      }),
      history: { load: vi.fn(), save },
      execute,
      log,
    })

    expect(save).not.toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
    expect(log).toHaveBeenCalledWith('Operação cancelada.')
  })
})
