# Repository Guidelines

## Project Structure & Module Organization

This repository is a TypeScript CLI starter. Runtime code lives in
`src/`. The CLI bootstrap is `src/index.ts`, logging setup is in `src/logger.ts`,
and command implementations live under `src/commands/`. Keep command-specific
tests beside the command, for example `src/commands/sample.test.ts`. Shared test
helpers currently live in `src/testUtils.ts`. Build output is written to `dist/`
and should be treated as generated.

## Build, Test, and Development Commands

Use Yarn 4 with the Node version from `.nvmrc`.

- `yarn install`: install dependencies.
- `yarn dev`: run the CLI through `tsx`; pass CLI args after `--`, for example
- `yarn build`: bundle `src/index.ts` into `dist/` with Rolldown.
- `yarn check-types`: run TypeScript without emitting files.
- `yarn lint` / `yarn lint:fix`: check or autofix Oxlint issues under `src/`.
- `yarn format` / `yarn format:check`: write or check Oxfmt formatting.
- `yarn test`, `yarn test:watch`, `yarn test:coverage`: run Vitest once, in watch
  mode, or with V8 coverage.

## Testing, Coding Style & Naming Conventions

Code style is enforced with Oxlint and Oxfmt. Prefer small named exports such as
`sampleCommand`, `initializeLogger`, and `createWritable`. Name command files in
lowercase, for example `src/commands/sample.ts`, and use matching `*.test.ts`
files for tests.

Testing is done with Vitest. For CLI behavior, prefer testing
commands directly with helpers from `src/testUtils.ts` and captured writable
streams rather than relying on subprocesses. Add or update tests whenever command
arguments, logging output, or error behavior changes.

After finishing code tasks, run `check-types`, `lint`, and `format:check`
