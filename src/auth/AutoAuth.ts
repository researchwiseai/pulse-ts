import { ClientCredentialsAuth } from './ClientCredentialsAuth'
import { AuthorizationCodePKCEAuth } from './AuthorizationCodePKCEAuth'
import type { Auth } from './types'

/**
 * AutoAuth selects an authentication flow based on environment variables.
 * It can be used in place of ClientCredentialsAuth or AuthorizationCodePKCEAuth.
 */
export class AutoAuth implements Auth {
    private readonly authImpl: Auth

    /**
     * Return true if either Authorization Code PKCE or Client Credentials flow is available.
     */
    static isAvailable(): boolean {
        return AuthorizationCodePKCEAuth.isAvailable() || ClientCredentialsAuth.isAvailable()
    }

    constructor() {
        if (AuthorizationCodePKCEAuth.isAvailable()) {
            this.authImpl = new AuthorizationCodePKCEAuth()
        } else if (ClientCredentialsAuth.isAvailable()) {
            this.authImpl = new ClientCredentialsAuth()
        } else {
            throw new Error(
                'No authentication method available. ' +
                    'Set environment variables for Authorization Code PKCE or Client Credentials flow.',
            )
        }
    }

    get accessToken(): string | undefined {
        return this.authImpl.accessToken
    }

    get refreshToken(): string | undefined {
        return this.authImpl.refreshToken
    }

    get expiresAt(): number | undefined {
        return this.authImpl.expiresAt
    }

    async _refreshToken(): Promise<void> {
        return this.authImpl._refreshToken()
    }

    async *authFlow(req: Request): AsyncGenerator<Request, Request> {
        yield* this.authImpl.authFlow(req)
        return req
    }
}
