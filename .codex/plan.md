# Pulse TypeScript Client Epic Plan

**Goal**: Develop a TypeScript version of the Pulse data analysis API client
with full feature parity to the existing Python client, including documentation
and testing.

This is a living scratch pad. Update as work progresses.

---

 ## Table of Contents

 - [Overview](#overview)
 - [Plan](#plan)
 - [Tasks](#tasks)
   - [Backlog](#backlog)
   - [In Progress](#in-progress)
   - [Done](#done)
   - [Deferred](#deferred)
 - [Lessons Learned](#lessons-learned)
 - [Tests Skipped](#tests-skipped)
 - [Python Test Suite Reference](#python-test-suite-reference)

 ---

 ## Overview

 We need to port the existing Python client (in `python/`) to TypeScript,
 using bun for package management and vitest for testing. The work
 culminates in feature parity, documentation, and a stable release.

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

 6. **CI & Release**  
    - Configure GitHub Actions (test, lint, build)  
    - Prepare package for npm publication

 ---

 ## Tasks

### Backlog

  - [ ] Sketch TypeScript project layout (`src/`, `test/`)

 ### In Progress

 - _None yet_

### Done

  - [x] Initialize bun project (`bun init`)
  - [x] Add tsconfig.json with strict settings
  - [x] Install vitest and add basic config
  - [x] Review Python client structure under `python/`

 ### Deferred

 - ESLint/Prettier configuration (evaluate later)

 ---

 ## Lessons Learned

- **Python test suite structure**:
-  - Tests live under `python/tests/`, organized by module (e.g., `test_analysis.py`, `test_results.py`, `test_core_client.py`).
-  - VCR cassettes are stored in `python/tests/cassettes/` for replaying HTTP interactions.
-  - Fixture files (e.g., `fixtures/disney-*.txt`) provide sample data for batch and DSL tests.
-  - Tests cover authentication flows, DSL evaluation, analysis endpoints, batching, caching, and end-to-end scenarios.

 ---

 ## Tests Skipped

 - _TBD_

 ---

 ## Python Test Suite Reference

Path: `python/tests`
 List of tests here can be updated as we port them.