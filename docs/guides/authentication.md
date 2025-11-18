---
title: Authentication
description: Choose the right OAuth2 strategy for machine-to-machine and interactive Pulse clients.
---

Pulse ships three authenticators. Each implements the shared `Auth` interface consumed by `CoreClient` and the Analyzer.

## Recommended: Client Credentials

Use `ClientCredentialsAuth` for server-side apps, background jobs, or notebooks that already have access to RWAI secrets.

```ts
import { ClientCredentialsAuth, CoreClient } from '@rwai/pulse'

const auth = new ClientCredentialsAuth({
    clientId: process.env.PULSE_CLIENT_ID,
    clientSecret: process.env.PULSE_CLIENT_SECRET,
    tokenUrl: process.env.PULSE_TOKEN_URL,
    audience: process.env.PULSE_AUDIENCE,
})

const client = new CoreClient({ auth })
```

Required environment variables:

| Variable | Description |
| --- | --- |
| `PULSE_CLIENT_ID` | OAuth2 application id |
| `PULSE_CLIENT_SECRET` | secret issued by RWAI |
| `PULSE_TOKEN_URL` | Auth0 tenant token endpoint |
| `PULSE_AUDIENCE` | API identifier, defaults to `https://core.researchwiseai.com/pulse/v1` |

`ClientCredentialsAuth.isAvailable()` verifies that the necessary variables are present—handy for CI smoke tests.

## AutoAuth fallbacks

`AutoAuth` tries Authorization Code PKCE first, then falls back to Client Credentials. This is convenient for CLIs or scripts that might run in multiple environments.

```ts
import { AutoAuth, CoreClient } from '@rwai/pulse'

const client = new CoreClient({ auth: new AutoAuth(), debug: true })
```

If neither flow is available, construction throws with a helpful error listing the missing variables.

## Interactive: Authorization Code + PKCE

Desktop, SPA, or local tools that need delegated user access can opt into the Authorization Code PKCE handler.

```ts
import { AuthorizationCodePKCEAuth } from '@rwai/pulse'

const auth = new AuthorizationCodePKCEAuth({
    clientId: process.env.PULSE_CLIENT_ID,
    redirectUri: 'http://localhost:4173/callback',
    scope: 'openid profile email offline_access',
})
```

Calling any API with this authenticator triggers `_performAuthorization()` automatically when a token or refresh token is missing. A browser window opens, the user signs-in, and the local callback server captures the authorization code.

Tips:

- Provide `code` and `codeVerifier` manually if you already control the PKCE exchange outside of the SDK.
- Override `authorizeUrl` to integrate with custom tenants or proxies.
- Store `refreshToken` securely; the class keeps it in-memory but you can persist it between runs by subclassing the authenticator.

## Swapping authenticators

All SDK surfaces accept the `Auth` interface, so you can rotate credentials without touching consuming code:

```ts
import type { Auth } from '@rwai/pulse'

function createClient(auth: Auth) {
    return new CoreClient({ baseUrl: 'https://api.rwai.com/pulse', auth })
}

const client = createClient(new ClientCredentialsAuth())
```

Later, you might call `client.auth` to inspect the active strategy, or use `client.auth.accessToken` to capture current state for debugging.
