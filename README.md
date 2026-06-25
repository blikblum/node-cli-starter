# node-cli-starter

A minimal TypeScript CLI starter built with Gunshi for command definition,
LogTape for logging, Rolldown for bundling, and Vitest for tests.

## Current app state

The repository currently boots a single sample command from `src/index.ts`.
When the app starts it initializes logging and runs the command defined in
`src/commands/sample.ts`.

The sample command:

- always logs `sample command`
- accepts two optional string flags: `-t` and `-w`
- logs `t value: ...` when `-t` is provided
- logs `w value: ...` when `-w` is provided

This behavior is covered by the tests in `src/commands/sample.test.ts`.

## Requirements

- Node.js 24
- Yarn 4

Install dependencies with:

```bash
yarn install
```

## Running the CLI

Use the development entrypoint while iterating locally:

```bash
yarn dev
```

Pass CLI arguments after `--`:

```bash
yarn dev -- -t hello -w world
```

Expected output:

```text
sample command
t value: hello
w value: world
```

## Available scripts

- `yarn build` bundles the CLI into `dist/cli.js`
- `yarn check-types` runs the TypeScript type checker without emitting files
- `yarn dev` runs the CLI entrypoint with `tsx`
- `yarn format` formats files under `src/` with Prettier
- `yarn format:check` checks formatting under `src/`
- `yarn lint` lints files under `src/` with ESLint
- `yarn lint:fix` runs ESLint with autofix enabled
- `yarn test` runs the test suite once with Vitest
- `yarn test:coverage` runs tests with coverage reporting
- `yarn test:watch` starts Vitest in watch mode

## Build output

Create a production bundle with:

```bash
yarn build
```

This writes the bundled CLI to `dist/cli.js`.

## Project structure

```text
src/
  index.ts              CLI bootstrap
  logger.ts             LogTape configuration
  testUtils.ts          CLI test helpers
  commands/
    sample.ts           current sample command
    sample.test.ts      command behavior tests
```

## Extending the starter

To turn this into a real CLI, replace the sample command in
`src/commands/sample.ts` or register additional commands from `src/index.ts`.
