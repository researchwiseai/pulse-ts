import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
    outDir: 'dist',
    swc: {
        swcrc: true,
    },
    tsconfig: 'tsconfig.build.json',
    define: {
        'import.meta.vitest': 'undefined',
        'process.env.DEBUG_PROXY': 'false', // Disable the debug proxy in the build
    },
    external: ['undici', 'open'],
})
