---
title: Getting Started
description: Install the Pulse TypeScript SDK, configure authentication, and run your first analysis in minutes.
---

## Requirements

- Node.js 18+
- Bun 1.0+ (recommended for scripts)
- TypeScript 5+
- Access to RWAI Pulse with OAuth2 Client Credentials

Optional but useful:

- Polly recordings for deterministic integration tests
- `.env.test` containing `PULSE_*` variables for CI

## Install the SDK

```bash
bun add @rwai/pulse
```

or

```bash
npm install @rwai/pulse
```

## Configure authentication

The SDK ships an OAuth2 client as well as helpers for providing existing access tokens.
Use Client Credentials in most server-side scenarios:

```ts
import { ClientCredentialsAuth, CoreClient } from '@rwai/pulse'

const auth = new ClientCredentialsAuth({
    clientId: process.env.PULSE_CLIENT_ID!,
    clientSecret: process.env.PULSE_CLIENT_SECRET!,
    tokenUrl: process.env.PULSE_TOKEN_URL!,
    audience: process.env.PULSE_AUDIENCE!,
})

const client = new CoreClient({
    baseUrl: process.env.PULSE_BASE_URL ?? 'https://api.rwai.com/pulse',
    auth,
    debug: process.env.NODE_ENV !== 'production',
})
```

Drop-in alternatives include `StaticTokenAuth` for short-lived demos and `CompositeAuth` for chaining fallback strategies.

## Run a starter helper

Starter helpers do not require the workflow DSL. Each helper accepts raw strings or file paths and returns a typed result:

```ts
import { sentimentAnalysis } from '@rwai/pulse'

const sentiments = await sentimentAnalysis([
    'I love this UI but the latency hurts',
    'Support never answered my ticket',
])

console.log(sentiments.summary())
console.log(sentiments.positiveRatio)
```

The helpers encode sane defaults for batching, language detection, and retries, making them ideal for notebooks or cron jobs.

## Model a workflow

Use the fluent `Workflow` builder when you need provenance, branching, or reusable pipelines:

```ts
import { Workflow } from '@rwai/pulse'

const surveyWorkflow = new Workflow()
    .source('responses', ['Great team', 'Pricing is confusing'])
    .sentiment()
    .theme_generation({ name: 'themes' })
    .cluster({ dependsOn: 'themes' })

const results = await surveyWorkflow.run({ client })
console.log(results.sentiment.summary())
console.log(results.themes.topics())
```

Each step can target different sources, emit named results, and mix in custom processes.
See the [Workflow DSL guide](/guides/workflows) for branching, custom transforms, and job interception.

## Generate docs

Keep documentation close to the codebase:

- `bun run docs` → Typedoc API reference under `docs/api`
- `bun run docs:dev` → VitePress dev server for this site
- `bun run docs:site` → Static build in `docs/.vitepress/dist` with the Typedoc bundle copied to `/api`

Add both commands to CI to guarantee that the public portal always matches the currently published package.
