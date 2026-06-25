# Repository Guidelines

## Project Structure & Module Organization

This repository is a TypeScript CLI starter for Node.js 24. Runtime code lives in
`src/`. The CLI bootstrap is `src/index.ts`, logging setup is in `src/logger.ts`,
and command implementations live under `src/commands/`. Keep command-specific
tests beside the command, for example `src/commands/sample.test.ts`. Shared test
helpers currently live in `src/testUtils.ts`. Build output is written to `dist/`
and should be treated as generated.

## Build, Test, and Development Commands

Use Yarn 4 with the Node version from `.nvmrc`.

- `yarn install`: install dependencies.
- `yarn dev`: run the CLI through `tsx`; pass CLI args after `--`, for example
  `yarn dev -- -t hello -w world`.
- `yarn build`: bundle `src/index.ts` into `dist/cli.js` with Rolldown.
- `yarn check-types`: run TypeScript without emitting files.
- `yarn lint` / `yarn lint:fix`: check or autofix ESLint issues under `src/`.
- `yarn format` / `yarn format:check`: write or check Prettier formatting.
- `yarn test`, `yarn test:watch`, `yarn test:coverage`: run Vitest once, in watch
  mode, or with V8 coverage.

## Coding Style & Naming Conventions

Write TypeScript using ES modules. Prettier enforces single quotes, no semicolons,
and a 100-character print width. ESLint uses strict type-checked TypeScript rules,
Node globals, and Prettier compatibility. Prefer small named exports such as
`sampleCommand`, `initializeLogger`, and `createWritable`. Name command files in
lowercase, for example `src/commands/sample.ts`, and use matching `*.test.ts`
files for tests.

## Testing Guidelines

Vitest discovers `src/**/*.test.ts` and `test/**/*.test.ts`, excluding `dist/`.
Use `describe`, `it`, and `expect` from Vitest. For CLI behavior, prefer testing
commands directly with helpers from `src/testUtils.ts` and captured writable
streams rather than relying on subprocesses. Add or update tests whenever command
arguments, logging output, or error behavior changes.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries such as `setup testing` and
`Add logger (LogTape)`. Keep commit subjects concise and focused on one change.
Pull requests should explain the behavior change, list validation commands run
such as `yarn test` and `yarn lint`, link related issues when available, and
include terminal output examples for CLI-facing changes.
