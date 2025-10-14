# Repository Guidelines

## Project Structure & Module Organization
- src: TypeScript source (e.g., `auth/`, `core/`, `dsl.ts`, `http.ts`, `index.ts`, generated `models.ts`).
- test: Unit and integration tests, Polly recordings, and setup files.
- docs: Typedoc site (API docs); `docs/api` is generated.
- dist: Build output; do not edit.
- scripts: Project utilities (e.g., `coverage-by-feature.mjs`).
- Root configs: `vitest.config.js`, `tsconfig*.json`, `.qlty/configs/*`, `openapi.yml`.

## Build, Test, and Development Commands
- Install: Use Bun. Example: `bun install`.
- Test: `bun run test` (Vitest, CI mode). Coverage: `bun run test -- --coverage`.
- Lint: `bun run lint` (ESLint with project config).
- Format: `bun run fmt` (Prettier).
- Typecheck: `bun run typecheck` (tsc, no emit).
- Build: `bun run build` (cleans and builds via tsup to `dist/`).
- Generate models: `bun run generate` (from `openapi.yml` to `src/models.ts`).
- Docs: `bun run docs` (Typedoc site under `docs/`).

## Coding Style & Naming Conventions
- Language: TypeScript (ESM). Indent 4 spaces, single quotes, no semicolons, width 100.
- Tools: ESLint (`.qlty/configs/eslint.config.mjs`), Prettier (`.qlty/configs/.prettierrc.json`).
- Filenames: kebab-case for folders, camelCase/`PascalCase` for identifiers; tests mirror source paths.

## Testing Guidelines
- Framework: Vitest; coverage via V8. Test files: `*.test.ts`; integration tests: `*.integration.test.ts`.
- Env: If integration tests skip, required env vars are missing; this is OK locally. See `.env.example` and `.env.test`.
- Run locally: `bun run test` or `bun run test -- --coverage`.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`). Keep messages imperative and scoped.
- PRs: Include a clear summary, linked issues, test coverage notes, and doc updates when APIs change. Ensure all commands above pass.

## Security & Configuration Tips
- Never commit secrets. Use `.env.test` for test values; load via test setup. Review `SECURITY.md`.
- CI runs on GitHub Actions and enforces linting, formatting, type safety, and coverage.
