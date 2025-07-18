# pulse-ts

TypeScript client for the RWAI Pulse API.

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

Pulse provides helpers and a workflow DSL to make analysis easy. For an overview of the helper
functions see the [Starter Helpers guide](docs/starters.md).

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis } from '@rwai/pulse'

const sentiments = await sentimentAnalysis(['text1', 'text2'])
const allocation = await themeAllocation(['text1', 'text2'], ['theme1', 'theme2'])

// Themes are optional in the themeAllocation function
const allocationWithoutThemes = await themeAllocation(['text1', 'text2'])
const clusters = await clusterAnalysis(['text1', 'text2'])
```

### Authentication

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
    // Enable request debugging if needed
    debug: true,
})
```

### Workflow DSL

Compose analysis steps using `Workflow`:

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

### JSON field name compatibility

The API is transitioning to `snake_case` JSON fields (e.g., `job_id`). The client normalizes both
formats so you can continue using camelCase names in your code.

## Security

For information on how to report security vulnerabilities see [SECURITY.md](./SECURITY.md).

## Development

The remainder of this document is aimed at contributors.

### Generating API docs

Generate the Typedoc reference:

```bash
bun run docs
```

The documentation will be written to `docs/api`.

### Building

Produce the distributable files:

```bash
bun run build
```

This creates `dist/index.js`, `dist/index.mjs` and type declarations in `dist/index.d.ts`.

### Testing

Run the unit tests with Bun. If you have a `.env.test` file in your project root, it will be loaded
automatically prior to running tests:

```bash
bun run test
```

Integration tests require several environment variables. Create a `.env.test` or `.env` file (or
export them in your shell) providing:

- `PULSE_CLIENT_ID`
- `PULSE_CLIENT_SECRET`
- `PULSE_TOKEN_URL`
- `PULSE_AUDIENCE`
- `PULSE_BASE_URL`

See `.env.example` for a template.

### Generating models

Update `src/models.ts` from the OpenAPI schema:

```bash
bun run generate
```

### Releasing

Tag the repository to trigger the release workflow:

```bash
VERSION=0.1.0
git tag -s "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

Ensure `NPM_TOKEN` and `COSIGN_PRIVATE_KEY` secrets are configured so the workflow can publish the
package and sign the tarball.

### Downloading Release Artifacts

Pre-built bundles, signatures and SBOM files are attached to each GitHub release.

```bash
VERSION=<tag>
curl -LO https://github.com/rwai/pulse-ts/releases/download/$VERSION/pulse-ts-$VERSION.tgz
curl -LO https://github.com/rwai/pulse-ts/releases/download/$VERSION/pulse-ts-$VERSION.tgz.sig
cosign verify-blob --key cosign.pub \
    --signature pulse-ts-$VERSION.tgz.sig \
    pulse-ts-$VERSION.tgz
```

If verification succeeds, unpack the archive and inspect `sbom.xml` for dependency metadata.

## Security

If you discover a security vulnerability, please report it to us. We will acknowledge receipt of
your report within 2 business days and work to address the issue promptly.
