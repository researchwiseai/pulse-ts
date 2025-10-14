# Technology Stack

## Runtime & Package Manager

- **Runtime**: Bun 1.0+ (primary), Node.js 18+ (supported)
- **Package Manager**: Bun
- **Language**: TypeScript 5.0+

## Build System

- **Bundler**: tsup with SWC
- **Output**: Dual ESM/CJS with source maps and type declarations
- **Tree-shaking**: Enabled

## Testing

- **Framework**: Vitest
- **Coverage**: V8 provider
- **HTTP Mocking**: Polly.js for recording/replaying API interactions
- **Test Files**: `src/**/*.test.ts` and `test/**/*.test.ts`

## Code Quality

- **Linter**: ESLint 9+ with TypeScript ESLint
- **Formatter**: Prettier
- **Quality Tool**: Qlty CLI
- **Config Location**: `.qlty/configs/`

## Key Dependencies

- **zod** (v4) - Runtime validation and schema definition (tree-shakeable via `zod/mini`)
- **undici** - HTTP client (external in build)

## Common Commands

```bash
# Development
bun run build          # Clean and build distributable files
bun run test           # Run all tests once
bun run test:watch     # Run tests in watch mode
bun run typecheck      # Type check without emitting

# Code Quality
bun run fmt            # Format code with Prettier
bun run lint           # Lint and auto-fix with ESLint
bun run qlty:check     # Run Qlty quality checks

# Documentation
bun run docs           # Generate TypeDoc API documentation

# Code Generation
bun run generate       # Generate TypeScript types from OpenAPI spec
```

## TypeScript Configuration

- **Target**: ESNext
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- **Decorators**: Experimental decorators enabled
- **Source**: `src/` directory
- **Output**: `dist/` directory

## Build Artifacts

- `dist/index.js` - ESM bundle
- `dist/index.cjs` - CommonJS bundle
- `dist/index.d.ts` - Type declarations
- Source maps included for debugging
