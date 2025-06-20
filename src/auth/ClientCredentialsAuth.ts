/**
 * Implements the OAuth2 Client Credentials flow to obtain access tokens.
 */

import type { Auth, ClientCredentialsOptions } from './types'
import { ENV_VAR, DEFAULTS } from '../config'
import { BaseAuth } from './BaseAuth'

export class ClientCredentialsAuth extends BaseAuth implements Auth {
    private readonly tokenUrl: string
    private readonly clientId: string
    private readonly clientSecret: string
    private readonly audience?: string

    get accessToken(): string | undefined {
        return this._accessToken
    }

    get refreshToken(): string | undefined {
        return undefined // Client Credentials flow does not use refresh tokens
    }

    get expiresAt(): number | undefined {
        return this._expiresAt
    }

    /**
     * Create a ClientCredentialsAuth instance.
     *
     * @param options - Configuration for the client credentials flow.
     */
    constructor(options: Partial<ClientCredentialsOptions> = {}) {
        super()
        this.tokenUrl = options.tokenUrl ?? process.env[ENV_VAR.TOKEN_URL] ?? DEFAULTS.TOKEN_URL
        this.audience = options.audience ?? process.env[ENV_VAR.AUDIENCE] ?? DEFAULTS.AUDIENCE
        const clientId = options.clientId ?? process.env[ENV_VAR.CLIENT_ID]
        const clientSecret = options.clientSecret ?? process.env[ENV_VAR.CLIENT_SECRET]

        if (!clientId || !clientSecret) {
            throw new Error(
                'Client ID and Client Secret must be provided for Client Credentials flow.',
            )
        } else {
            this.clientId = clientId
            this.clientSecret = clientSecret
        }
    }

    async _refreshToken(): Promise<void> {
        const nowSec = Date.now() / 1000
        const data: Record<string, string> = {
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
        }
        if (this.audience) data.audience = this.audience

        const response = await fetch(this.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data),
        })
        if (!response.ok) {
            throw new Error(`Token refresh failed with status ${response.status}`)
        }
        const json = await response.json()
        this._accessToken = json.access_token
        this._expiresAt = nowSec + json.expires_in - 60
    }

    /**
     * Check whether the required environment variables are set for Client Credentials authentication flow.
     */
    static isAvailable(): boolean {
        return Boolean(
            process.env[ENV_VAR.CLIENT_ID] &&
                process.env[ENV_VAR.CLIENT_SECRET] &&
                process.env[ENV_VAR.TOKEN_URL],
        )
    }
}
