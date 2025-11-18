---
layout: home
title: Pulse TypeScript SDK
hero:
    name: Pulse TS
    text: Build explainable insights with RWAI Pulse
    tagline: Typed helpers, workflow DSL, and Analyzer utilities for orchestrating qualitative intelligence pipelines.
    actions:
        - theme: brand
          text: Start Building
          link: /getting-started
        - theme: alt
          text: Browse API Reference
          link: /api/index.html
features:
    - title: Analyzer-first architecture
      details: Compose asynchronous jobs, incremental polling, and strongly typed result helpers for any RWAI analysis.
    - title: Workflow DSL
      details: Model reusable research pipelines with a fluent builder that enforces data contracts and provenance.
    - title: Instant starter helpers
      details: Run curated helpers for sentiment, clustering, summaries, and DDI codebooks without boilerplate.
    - title: Production hygiene
      details: OAuth2 credentials, retryable HTTP client, structured errors, and CI-friendly documentation outputs.
---

## Why Pulse?

Pulse TS is the official RWAI SDK for analysts and platform builders who need qualitative intelligence
at scale. The package wraps the Pulse REST API with:

- A **core client** that handles OAuth2 Client Credentials, retries, and telemetry-friendly logging.
- An **Analyzer** abstraction that orchestrates jobs, polls results, and exposes domain-specific result objects.
- A **workflow DSL** for composing sources, processes, branching, and custom steps while keeping everything type-safe.
- **Starter helpers** for teams who want to plug analysis straight into scripts or notebooks without learning the DSL.

## Documentation scope

This site groups content into three tracks:

1. **Guides** explain how to authenticate, structure jobs, and customize analysis flows.
2. **Examples** pair real-world prompts or CSV data with reusable workflow snippets.
3. **Resources** collect operational tips for CI, observability, and troubleshooting.

For method-level signatures and schema details, generate the latest Typedoc bundle via `bun run docs` and open `/api/index.html`.

## Release cadence

Pulse TS follows semantic versioning. Each release ships:

- updated OpenAPI-derived models in `src/models.ts`
- regenerated API reference in `docs/api`
- change highlights in `CHANGELOG.md`

Subscribe to GitHub releases to receive notifications when new helpers or DSL primitives land.
