import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import markdown from '@eslint/markdown'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        plugins: { js },
        extends: ['js/recommended'],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: { globals: globals.node },
    },
    tseslint.configs.recommended,
    {
        files: ['**/*.ts'],
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
            ],
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
])
