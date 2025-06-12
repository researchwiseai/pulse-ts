# Authentication

The client supports OAuth2 authentication using either client credentials or the Authorization Code
PKCE flow.

## Client Credentials

```ts
import { ClientCredentialsAuth } from '@rwai/pulse'

const auth = new ClientCredentialsAuth(
    process.env.PULSE_CLIENT_ID!,
    process.env.PULSE_CLIENT_SECRET!,
)
```

## Authorization Code PKCE

```ts
import { AuthorizationCodePKCEAuth } from '@rwai/pulse'

const auth = new AuthorizationCodePKCEAuth({
    tokenUrl: 'https://login.example.com/oauth/token',
    clientId: 'my-client',
    code: '<auth-code-from-login>',
    codeVerifier: '<generated-verifier>',
    redirectUri: 'https://app.example.com/callback',
})
```
