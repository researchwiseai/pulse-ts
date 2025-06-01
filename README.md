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

## Quick Start

Import and configure authentication:

```ts
import { ClientCredentialsAuth, CoreClient } from '@rwai/pulse';

const auth = new ClientCredentialsAuth(
  process.env.PULSE_CLIENT_ID!,
  process.env.PULSE_CLIENT_SECRET!,
);

const client = new CoreClient({
  baseUrl: 'https://api.rwai.com/pulse',
  auth,
});

(async () => {
  const embeddings = await client.create_embeddings(['hello', 'world']);
  console.log(embeddings);
})();
```

## Starter Helpers

Use convenience functions for common analysis tasks:

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis } from '@rwai/pulse';

// Sentiment analysis
const sentiments = await sentimentAnalysis(['text1', 'text2'], client);
console.log(sentiments);

// Theme allocation (optionally provide seed themes)
const allocation = await themeAllocation(['text1', 'text2'], client, ['theme1', 'theme2']);
console.log(allocation);

// Cluster analysis
const clusters = await clusterAnalysis(['text1', 'text2'], client);
console.log(clusters);
```

## Generating API docs

Generate the Typedoc API reference:

```bash
bun run docs
```

The docs will be output to `docs/api`.
