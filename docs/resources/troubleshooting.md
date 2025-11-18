---
title: Troubleshooting Checklist
description: Runbook for the questions we see most often while integrating Pulse.
---

### Install errors mentioning `AccessDenied`

Set `BUN_TMPDIR` and `BUN_INSTALL` to writable directories when adding dependencies under sandboxed environments.

```bash
mkdir -p /tmp/bun_tmp /tmp/bun_install
BUN_TMPDIR=/tmp/bun_tmp BUN_INSTALL=/tmp/bun_install bun add -d vitepress
```

### `Unknown source for ...`

The Workflow DSL validates that each alias exists before running a process. Add `.source('alias', data)` or ensure a previous process emitted that alias. For generated themes, pass `themesFrom` explicitly if you renamed the `themeGeneration` step.

### Jobs never finish

Check whether you requested `fast: true` for an operation that only supports async (data dictionaries, for example). If the server legitimately needs more time, instantiate `new Job({ pollIntervalMs: 5000, ... })` so you are not rate-limited.

### OAuth token fails in CI

Verify `PULSE_TOKEN_URL` and `PULSE_AUDIENCE` are present. `ClientCredentialsAuth.isAvailable()` is handy in smoke tests. When using Authorization Code PKCE locally, make sure the redirect URI matches the Auth0 app exactly.

### Typedoc output is stale

Run `bun run docs` after touching public APIs. The VitePress build copies `docs/api` automatically, but only if the folder exists.

### Docs site missing API Reference

Ensure your deployment copies `docs/.vitepress/dist/api`. The build hook mirrors whatever is already in `docs/api`—so generate it first.

### CSV parsing issues

`generateDataDictionary` expects a 2D array of **strings**. Coerce numbers via `.toString()` or pass `{ cast: true }` when using `csv-parse`.

### Theme allocation mislabels responses

Provide custom `threshold` and set `singleLabel: false` to allow multi-label assignments. Alternatively, feed curated themes through `themes` rather than letting the DSL auto-generate them.

Add new entries here whenever an issue repeats twice; future-you will thank you.
