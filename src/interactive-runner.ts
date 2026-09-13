// oxlint-disable no-await-in-loop
import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  confirm as confirmPrompt,
  input as inputPrompt,
  number as numberPrompt,
  select as selectPrompt,
} from '@inquirer/prompts'
import type { ArgSchema, Command } from 'gunshi'

import { commandRegistry, runCli } from './cli.js'
import { getConfigDir } from './runtime.js'

const HISTORY_LIMIT = 5
const SKIP_ENUM_VALUE = '__node_cli_skip__'

export interface HistoryEntry {
  command: string
  args: string[]
  runAt: string
}

interface SelectChoice {
  name: string
  value: string
  description?: string
}

export interface PromptAdapter {
  select(config: {
    message: string
    choices: readonly SelectChoice[]
    default?: string
  }): Promise<string>
  input(config: {
    message: string
    default?: string
    validate?: (value: string) => boolean | string
  }): Promise<string>
  number(config: {
    message: string
    default?: number
    required?: boolean
    validate?: (value: number | undefined) => boolean | string
  }): Promise<number | undefined>
  confirm(config: { message: string; default?: boolean }): Promise<boolean>
}

export interface HistoryStore {
  load(): Promise<HistoryEntry[]>
  save(history: HistoryEntry[]): Promise<void>
}

export interface InteractiveDependencies {
  commands?: Record<string, Command>
  execute?: (args: string[]) => Promise<unknown>
  history?: HistoryStore
  now?: () => Date
  prompts?: PromptAdapter
  log?: (message: string) => void
}

export const defaultPrompts: PromptAdapter = {
  select: (config) => selectPrompt(config),
  input: (config) => inputPrompt(config),
  number: (config) => numberPrompt(config),
  confirm: (config) => confirmPrompt(config),
}

export function getInteractiveHistoryPath(): string {
  return path.join(getConfigDir(), 'interactive-history.json')
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<HistoryEntry>
  return (
    typeof entry.command === 'string' &&
    Array.isArray(entry.args) &&
    entry.args.every((arg) => typeof arg === 'string') &&
    typeof entry.runAt === 'string'
  )
}

export function createHistoryStore(filePath = getInteractiveHistoryPath()): HistoryStore {
  return {
    async load() {
      try {
        const parsed: unknown = JSON.parse(await fs.readFile(filePath, 'utf8'))
        return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(0, HISTORY_LIMIT) : []
      } catch {
        return []
      }
    },
    async save(history) {
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, `${JSON.stringify(history.slice(0, HISTORY_LIMIT), null, 2)}\n`)
    },
  }
}

export function appendHistory(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const duplicate = history.some(
    (candidate) =>
      candidate.command === entry.command &&
      candidate.args.length === entry.args.length &&
      candidate.args.every((arg, index) => arg === entry.args[index]),
  )
  if (duplicate) return history

  return [entry, ...history].slice(0, HISTORY_LIMIT)
}

export function getCommandChoices(
  commands: Record<string, Command> = commandRegistry,
): SelectChoice[] {
  return Object.entries(commands).map(([name, command]) => ({
    name,
    value: name,
    description: command.description,
  }))
}

function argumentMessage(name: string, schema: ArgSchema): string {
  const required = schema.required ? ' (obrigatório)' : ''
  return `${schema.description ?? name} (--${name})${required}`
}

function splitMultiple(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function validateText(value: string, schema: ArgSchema): boolean | string {
  const values = schema.multiple ? splitMultiple(value) : value.trim() ? [value] : []
  if (schema.required && values.length === 0) return 'Informe um valor.'
  if (schema.type === 'number' && values.some((item) => !Number.isFinite(Number(item))))
    return 'Informe um número válido.'
  return true
}

function addArgument(argv: string[], name: string, schema: ArgSchema, values: string[]): void {
  for (const value of values) {
    if (schema.type === 'positional') argv.push(value)
    else argv.push(`--${name}`, value)
  }
}

export async function promptForArguments(
  command: Command,
  prompts: PromptAdapter = defaultPrompts,
): Promise<string[]> {
  const argv: string[] = []
  for (const [name, schema] of Object.entries(command.args ?? {})) {
    const message = argumentMessage(name, schema)
    if (schema.type === 'boolean') {
      const value = await prompts.confirm({ message, default: Boolean(schema.default) })
      if (value && schema.default !== true) argv.push(`--${name}`)
      else if (!value && schema.default === true) argv.push(`--no-${name}`)
      continue
    }

    if (schema.type === 'enum' && !schema.multiple) {
      const choices = (schema.choices ?? []).map((choice) => ({ name: choice, value: choice }))
      if (!schema.required && schema.default === undefined)
        choices.unshift({ name: '(não informar)', value: SKIP_ENUM_VALUE })
      const value = await prompts.select({
        message,
        choices,
        default: typeof schema.default === 'string' ? schema.default : undefined,
      })
      if (value !== SKIP_ENUM_VALUE) addArgument(argv, name, schema, [value])
      continue
    }

    if (schema.type === 'number' && !schema.multiple) {
      const value = await prompts.number({
        message,
        default: typeof schema.default === 'number' ? schema.default : undefined,
        required: schema.required,
        validate: (input) => (schema.required && input === undefined ? 'Informe um valor.' : true),
      })
      if (value !== undefined) addArgument(argv, name, schema, [`${value}`])
      continue
    }

    const value = await prompts.input({
      message: schema.multiple ? `${message} (separados por vírgula)` : message,
      default:
        schema.default === undefined || Array.isArray(schema.default)
          ? undefined
          : String(schema.default),
      validate: (input) => validateText(input, schema),
    })
    const values = schema.multiple ? splitMultiple(value) : value.trim() ? [value] : []
    addArgument(argv, name, schema, values)
  }
  return argv
}

function formatInvocation(entry: HistoryEntry): string {
  return [entry.command, ...entry.args]
    .map((token) => (/\s/.test(token) ? JSON.stringify(token) : token))
    .join(' ')
}

function isPromptCancellation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ExitPromptError'
}

export async function runInteractive(dependencies: InteractiveDependencies = {}): Promise<void> {
  const commands = dependencies.commands ?? commandRegistry
  const execute = dependencies.execute ?? runCli
  const historyStore = dependencies.history ?? createHistoryStore()
  const now = dependencies.now ?? (() => new Date())
  const prompts = dependencies.prompts ?? defaultPrompts
  const log = dependencies.log ?? console.log

  try {
    const commandName = await prompts.select({
      message: 'Selecione um comando',
      choices: getCommandChoices(commands),
    })
    const command = commands[commandName]
    if (!command) throw new Error(`Comando não encontrado: ${commandName}`)

    const history = await historyStore.load()
    const matchingHistory = history.filter((entry) => entry.command === commandName)
    let args: string[]
    if (matchingHistory.length > 0) {
      const action = await prompts.select({
        message: 'Como deseja executar o comando?',
        choices: [
          { name: 'Novo comando', value: 'new' },
          { name: 'Executar novamente um comando salvo', value: 'rerun' },
        ],
      })
      if (action === 'rerun') {
        const selectedRunAt = await prompts.select({
          message: 'Selecione o comando salvo',
          choices: matchingHistory.map((entry) => ({
            name: formatInvocation(entry),
            value: entry.runAt,
            description: new Date(entry.runAt).toLocaleString(),
          })),
        })
        const selectedEntry = matchingHistory.find((entry) => entry.runAt === selectedRunAt)
        if (!selectedEntry) throw new Error(`Comando salvo não encontrado: ${selectedRunAt}`)
        args = [...selectedEntry.args]
      } else args = await promptForArguments(command, prompts)
    } else args = await promptForArguments(command, prompts)

    const entry = { command: commandName, args, runAt: now().toISOString() }
    const updatedHistory = appendHistory(history, entry)
    if (updatedHistory !== history) await historyStore.save(updatedHistory)
    await execute([commandName, ...args])
  } catch (error) {
    if (isPromptCancellation(error)) {
      log('Operação cancelada.')
      return
    }
    throw error
  }
}
