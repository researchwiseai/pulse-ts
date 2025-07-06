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

## Getting Started

We have organized into several distinct units to make it both easy to get up and running quickly and
to provide a solid foundation for building more complex applications.

### Starters

For a quick introduction to using the starter helpers, see the
[Starter Helpers guide](docs/starters.md).

```ts
import { sentimentAnalysis, themeAllocation, clusterAnalysis } from '@rwai/pulse'
const sentiments = await sentimentAnalysis(['text1', 'text2'])
const allocation = await themeAllocation(['text1', 'text2'], ['theme1', 'theme2'])
const allocationWithAutoThemes = await themeAllocation(['text1', 'text2'])
const clusterCreator = await clusterAnalysis(['text1', 'text2'])
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

## Testing

Run the unit tests with Bun:

```bash
bun run test
```

Integration tests require several environment variables. Create a `.env` file (or export them in
your shell) providing:

- `PULSE_CLIENT_ID`
- `PULSE_CLIENT_SECRET`
- `PULSE_TOKEN_URL`
- `PULSE_AUDIENCE`
- `PULSE_BASE_URL`

See `.env.example` for a template.

## Generating models

Generate TypeScript models from the OpenAPI schema:

```bash
bun run generate
```

This will update `src/models.ts` with the latest types.

## Releasing

Create and push a signed tag to trigger the GitHub release workflow which builds the package,
generates an SBOM, signs the tarball and publishes the package to npm.

```bash
VERSION=0.1.0
git tag -s "v$VERSION" -m "v$VERSION"
git push origin "v$VERSION"
```

Ensure `NPM_TOKEN` is configured and set the `COSIGN_PRIVATE_KEY` secret to the contents of your
cosign private key. The release workflow writes this secret to a temporary file before signing the
tarball.

## Downloading Release Artifacts

Pre-built bundles are attached to each GitHub release along with a detached signature and SBOM. The
`sbom.xml` file lists all dependencies used to produce the package.

Download and verify the tarball for a specific tag:

```bash
VERSION=<tag>
curl -LO https://github.com/rwai/pulse-ts/releases/download/$VERSION/pulse-ts-$VERSION.tgz
curl -LO https://github.com/rwai/pulse-ts/releases/download/$VERSION/pulse-ts-$VERSION.tgz.sig
cosign verify-blob --key cosign.pub \
    --signature pulse-ts-$VERSION.tgz.sig \
    pulse-ts-$VERSION.tgz
```

If verification succeeds you can unpack the archive and inspect `sbom.xml` for its dependency
metadata.

## Security

For information on how to report security vulnerabilities, see [SECURITY.md](./SECURITY.md). We aim
to acknowledge reports within 2 business days.
