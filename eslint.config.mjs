import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default tseslint.config(
  {
    ignores: ['**/.*', 'dist/'],
  },
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    ...js.configs.recommended,
  },
  {
    files: ['src/**/*.{js,mjs,cjs,ts,mts,cts,tsx}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{ts,mts,cts,tsx}'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-cond-assign': ['error', 'always'],
      eqeqeq: ['error', 'smart'],
      'no-constant-binary-expression': 'error',
      curly: 'error',
      'default-case': 'error',
      'default-case-last': 'error',
      'no-constant-condition': 'error',
      'no-fallthrough': 'error',
      'use-isnan': 'error',
      'arrow-body-style': ['error', 'as-needed'], // 'as-needed' is often preferred for brevity
      'no-promise-executor-return': 'error',
      'no-await-in-loop': 'warn',
      'no-useless-escape': 'error',
      'prefer-object-spread': 'error',
      'prefer-spread': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-useless-catch': 'error',
      'no-bitwise': 'warn',
    },
  },
  eslintConfigPrettier,
)
