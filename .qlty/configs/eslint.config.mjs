import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import markdown from '@eslint/markdown'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import { defineConfig } from 'eslint/config'

export default defineConfig(
    {
        ignores: ['dist/**', '.codex/**', 'coverage/**', 'docs/api/assets/**'],
    },
    [
        {
            files: ['src/**/*.{js,mjs,cjs,ts}'],
            plugins: { js },
            extends: ['js/recommended'],
        },
        {
            files: ['src.**/*.{js,mjs,cjs,ts}'],
            languageOptions: { globals: globals.node },
        },
        tseslint.configs.recommended,
        {
            files: ['src/**/*.ts'],
            plugins: { 'sort-destructure-keys': sortDestructureKeys },
            rules: {
                '@typescript-eslint/no-unused-vars': [
                    'error',
                    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
                ],
                'sort-destructure-keys/sort-destructure-keys': ['error', { caseSensitive: false }],
            },
        },
        {
            files: ['**/*.md'],
            plugins: { markdown },
            language: 'markdown/gfm',
            extends: ['markdown/recommended'],
        },
        {
            // Allow the use of "any" in test files with more relaxed rules.
            files: ['**/*.test.ts'],
            rules: {
                '@typescript-eslint/no-explicit-any': 'off',
            },
        },
    ],
)
