# Pulse TypeScript Client Epic Plan

**Goal**: Develop a TypeScript version of the Pulse data analysis API client with full feature
parity to the existing Python client, including documentation and testing.

This is a living scratch pad. Update as work progresses.

---

## Table of Contents

-   [Overview](#overview)
-   [Plan](#plan)
-   [Tasks](#tasks)
    -   [Backlog](#backlog)
    -   [In Progress](#in-progress)
    -   [Done](#done)
    -   [Deferred](#deferred)
-   [Lessons Learned](#lessons-learned)
-   [Tests Skipped](#tests-skipped)
-   [Python Test Suite Reference](#python-test-suite-reference)

    ***

## Overview

We need to port the existing Python client (in `python/`) to TypeScript, using bun for package
management and vitest for testing. The work culminates in feature parity, documentation, and a
stable release.

## Plan

1. **Project Setup**

    - Initialize bun project
    - Configure TypeScript (tsconfig.json)
    - Setup vitest for testing
    - Optional: ESLint/Prettier setup (TBD)

2. **Core Client Modules**

    - Authentication (login/token management)
    - HTTP request layer (fetch wrapper, retries, timeouts)
    - Models & Types (interfaces or classes)
    - Error handling

3. **API Endpoints Implementation**

    - Mirror each endpoint in the Python client
    - Map parameters, request/response shapes, pagination, etc.

4. **Testing**

    - For each Python test in `python/tests`, write an equivalent vitest test
    - Validate edge cases, error handling, pagination, etc.

5. **Documentation**

    - Update README.md with TypeScript usage examples
    - Generate API reference (e.g., Typedoc)

6. **Code Quality & Coverage**

-   Integrate Qlty CLI for code quality checks, formatting, and coverage reporting
-   Hook Qlty into pre-commit workflow to enforce standards before committing
-   (Optional) Evaluate ESLint/Prettier plugins via Qlty

7. **CI & Release**

-   Configure GitHub Actions to run tests, Qlty checks, and build on push/main
-   Prepare package for npm publication

---

## Tasks

### Backlog

  <!-- API Endpoints Implementation -->

-- [x] Port generate_themes endpoint -- [x] Port analyze_sentiment endpoint -- [x] Port
extract_elements endpoint -- [x] Port pagination / batching utilities

  <!-- Quality & CI Tasks -->

### In Progress

-   [ ] Generate Typedoc API reference

### Done

-   [x] Initialize bun project (`bun init`)
-   [x] Add tsconfig.json with strict settings
-   [x] Install vitest and add basic config
-   [x] Review Python client structure under `python/`
-   [x] Sketch TypeScript project layout (`src/`, `test/`)
-   [x] Port authentication (login/token management)
-   [x] Port HTTP request layer (fetch wrapper, retries, timeouts)
-   [x] Port error handling
-   [x] Port models & types (interfaces or classes)
-   [x] Port create_embeddings endpoint
-   [x] Port compare_similarity endpoint
-   [x] Port generate_themes endpoint
-   [x] Port analyze_sentiment endpoint
-   [x] Port extract_elements endpoint
-   [x] Port pagination / batching utilities
-   [x] Integrate Qlty CLI configuration and rules
-   [x] Add pre-commit hook for Qlty checks (formatting, linting, coverage gates)
-   [x] Create GitHub Actions workflow for tests, Qlty checks, and build on main
-   [x] Port DSL / Workflow builder & Analysis layer
-   [x] Update README.md with TypeScript usage examples

### Deferred

-   ESLint/Prettier configuration (evaluate later)

    ***

## Lessons Learned

-   **Python test suite structure**:
-   Tests live under `python/tests/`, organized by module (e.g., `test_analysis.py`,
    `test_results.py`, `test_core_client.py`).
-   VCR cassettes are stored in `python/tests/cassettes/` for replaying HTTP interactions.
-   Fixture files (e.g., `fixtures/disney-*.txt`) provide sample data for batch and DSL tests.
-   Tests cover authentication flows, DSL evaluation, analysis endpoints, batching, caching, and
    end-to-end scenarios.

---

## Tests Skipped

-   _TBD_

    ***

## Python Test Suite Reference

Path: `python/tests` List of tests here can be updated as we port them:

-   `test_batching.py` → `test/batching.test.ts`
-   `test_http.py` → `test/http.test.ts`
-   `test_errors.py` → `test/errors.test.ts`
-   `test_job.py` → `test/job.test.ts`
-   `test_auth_*.py` → `test/auth.test.ts`
-   `test_core_client.py` → `test/core-client.test.ts`
-   `test_results.py` → `test/results.test.ts`
-   `test_analysis.py` → `test/analysis.test.ts`
-   `test_dsl_e2e.py` → `test/dsl.test.ts`
-   `test_starters.py` → `test/starters.test.ts`
