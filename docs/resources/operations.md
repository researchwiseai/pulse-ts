---
title: Operational Playbook
description: Checklist for shipping Pulse-integrated services with confidence.
---

## Build + release pipeline

1. **Types** — `bun run typecheck`
2. **Lint** — `bun run lint` (auto-fixes style issues)
3. **Tests** — `bun run test`
4. **Docs** — `bun run docs && bun run docs:site`
5. **Build** — `bun run build`

Gate releases on all five steps; CI already enforces them via GitHub Actions.

## Environment conventions

- Configure `PULSE_*` secrets in `.env`, `.env.test`, or your secrets manager.
- For integration tests, store sanitized Polly recordings under `test/polly-recordings`.
- Never commit real credentials—`SECURITY.md` outlines the disclosure process if they leak.

## Docs deployment model

- `docs/api` contains the Typedoc bundle (generated).
- `docs/.vitepress/dist` is the static site output.
- Copy `docs/.vitepress/dist` to the `docs/` branch or GH Pages target of your choice.
- Include `docs/api` when deploying so the “API Reference” nav item works.

## Observability & debugging

- Set `debug: true` either on `CoreClient` or individual helpers to emit `x-pulse-debug` headers. Server responses echo the header back with trace ids.
- Use `Workflow.monitor` callbacks to emit structured logs per process.
- For background jobs, set a longer `pollIntervalMs` when instantiating `Job` to keep API pressure low.

## Working with open-source consumers

- Keep README snippets in sync with `/docs/getting-started.md` to avoid drift.
- Document new starters in `/docs/guides/starters.md` and add a short recipe.
- Update `API_UPDATE_SUMMARY.md` whenever the OpenAPI schema changes.

## Support rotation tips

- `CI_TEST_FAILURES_ANALYSIS.md` captures the latest flaky tests; review before merging large changes.
- `DEBUG_COMPLETE.md` and `TEST_FAILURES_DEBUG_SUMMARY.md` show historical debugging notes—link to them from incidents.
- When investigating OAuth errors, run `node -e "console.log(process.env.PULSE_CLIENT_ID)"` inside the deployment to confirm environment wiring.
