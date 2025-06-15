import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
        reporters: ['default'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src'],
        },
        includeSource: ['src/**/*.ts'],
    },
})
