# pulse-ts

The TypeScript client for using the RWAI Pulse API

## Requirements

- Node.js 18 or higher
- TypeScript 5.0 or higher
- Bun 1.0 or higher
- Qlty CLI

## Installation

Install with Bun:

```bash
bun add @rwai/pulse
```

Or with npm/yarn:

```bash
npm install @rwai/pulse
# or
yarn add @rwai/pulse
```

## Authentication

Configure OAuth2 credentials and create a client:

```ts
import { ClientCredentialsAuth, CoreClient } from '@rwai/pulse'

const auth = new ClientCredentialsAuth(
    process.env.PULSE_CLIENT_ID!,
    process.env.PULSE_CLIENT_SECRET!,
)

const client = new CoreClient({
    baseUrl: 'https://api.rwai.com/pulse',
    auth,
})
```

## Workflow DSL

Use the `Workflow` class to compose processing steps:

```ts
import { Workflow } from '@rwai/pulse'

const wf = new Workflow()
    .source('dataset', ['hello', 'world'])
    .sentiment()
    .theme_generation()
    .cluster()

const results = await wf.run({ client })
console.log(results.sentiment.summary())
```

## Starter Helpers

Convenience helpers cover common tasks:

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis } from '@rwai/pulse'

const sentiments = await sentimentAnalysis(['text1', 'text2'], client)
const allocation = await themeAllocation(['text1', 'text2'], client, ['theme1', 'theme2'])
const clusters = await clusterAnalysis(['text1', 'text2'], client)
```

## Generating API docs

Generate the Typedoc API reference:

```bash
bun run docs
```

The docs will be output to `docs/api`.

## Building

To create the distributable files run:

```bash
bun run build
```

This generates `dist/index.js`, `dist/index.mjs` and the type declarations in `dist/index.d.ts`.
IDEs will automatically pick up these types for improved editor support.

## Generating models

Generate TypeScript models from the OpenAPI schema:

```bash
bun run generate
```

This will update `src/models.ts` with the latest types.
