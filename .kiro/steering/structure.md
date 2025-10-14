# Project Structure

## Source Organization (`src/`)

### Core API Layer

- `core/clients/` - API client implementations and endpoint methods
    - `CoreClient.ts` - Main client class
    - Individual endpoint files (analyzeSentiment.ts, clusterTexts.ts, etc.)
    - `__tests__/` - Unit tests for each endpoint
- `core/batching.ts` - Request batching utilities
- `core/job.ts` - Job monitoring and polling
- `core/log.ts` - Logging utilities

### Authentication (`auth/`)

- `AuthorizationCodePKCEAuth.ts` - PKCE flow implementation
- `ClientCredentialsAuth.ts` - Client credentials flow
- `AutoAuth.ts` - Auto-detection of auth method
- `types.ts` - Auth interface definitions

### Processing Layer

- `processes/` - Individual process implementations (Cluster, Sentiment, ThemeAllocation, etc.)
    - Each process implements the `Process<Name, Return>` interface
    - `types.ts` - Core process types and utilities
    - `shuffle.ts` - Data shuffling utilities

### Results Layer

- `results/` - Result wrapper classes with helper methods
    - `SentimentResult.ts`
    - `ThemeAllocationResult.ts`
    - `ThemeGenerationResult.ts`

### High-Level APIs

- `analyzer.ts` - Orchestrator for executing process sequences
- `dsl.ts` - Workflow builder with fluent API
- `starters.ts` - Simple helper functions for common use cases

### Utilities

- `matrix/` - Matrix operations and utilities
    - `core/` - Basic matrix operations
    - `utils/` - Helper functions for matrix manipulation
- `clustering/` - Clustering algorithms (HAC, k-modes, auto-clustering)
    - `helpers/` - Distance calculations, silhouette scores, etc.

### Infrastructure

- `http.ts` - HTTP utilities and retry logic
- `errors.ts` - Custom error classes
- `models.ts` - Generated TypeScript types from OpenAPI spec
- `index.ts` - Main entry point with exports

## Test Organization (`test/`)

- Integration tests at root level
- `processes/` - Process-specific tests
- `recordings/` - Polly.js HTTP recordings for deterministic tests
- `setupEnv.js` - Test environment configuration
- `setupPolly.ts` - Polly.js configuration

## Configuration Files

- `.qlty/` - Qlty quality tool configuration
    - `configs/` - ESLint, Prettier, and other tool configs
- `.github/` - GitHub Actions workflows
- `.kiro/` - Kiro steering rules and settings

## Documentation

- `docs/api/` - Generated TypeDoc API documentation
- `docs/starters.md` - Starter helpers guide
- `README.md` - Main documentation
- `CHANGELOG.md` - Version history
- `SECURITY.md` - Security policy

## Build Output

- `dist/` - Compiled distributable files (ESM, CJS, types)
- `coverage/` - Test coverage reports

## Naming Conventions

- **Files**: camelCase for implementation files, PascalCase for classes
- **Directories**: camelCase
- **Exports**: Named exports preferred, namespace exports for logical grouping (Auth, Processes)
- **Tests**: `*.test.ts` suffix, co-located with source or in `test/` directory
