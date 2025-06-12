/**
 * Options for the OAuth2 Authorization Code PKCE authentication flow.
 *
 * @property tokenUrl - URL of the OAuth2 token endpoint.
 * @property clientId - Client identifier issued by the authorization server.
 * @property code - Authorization code received from the authorization server.
 * @property redirectUri - Redirect URI used in the authorization request.
 * @property codeVerifier - PKCE code verifier corresponding to the code challenge.
 * @property scope - Optional space-delimited OAuth2 scopes.
 * @property audience - Optional API audience parameter.
 */
export interface AuthorizationCodePKCEOptions {
    tokenUrl: string
    clientId: string
    code: string
    redirectUri: string
    codeVerifier: string
    scope?: string
    audience?: string
}

/**
 * Options for the OAuth2 Client Credentials authentication flow.
 *
 * @property tokenUrl - URL of the OAuth2 token endpoint.
 * @property clientId - Client identifier issued by the authorization server.
 * @property clientSecret - Client secret issued by the authorization server.
 * @property audience - Optional API audience parameter.
 */
export interface ClientCredentialsOptions {
    tokenUrl: string
    clientId: string
    clientSecret: string
    audience?: string
}

/**
 * Authentication interface for obtaining and refreshing access tokens.
 */
export interface Auth {
    /**
     * Generator that attaches authentication credentials to outgoing requests.
     *
     * @param req - Original Request object.
     * @returns An AsyncGenerator yielding an authenticated Request.
     */
    authFlow(req: Request): AsyncGenerator<Request, Request>
    /** Perform token refresh and update internal token state. */
    _refreshToken(): Promise<void>

    /** OAuth2 access token or undefined if not yet acquired. */
    accessToken: string | undefined
    /** OAuth2 refresh token or undefined if not applicable. */
    refreshToken: string | undefined
    /** Unix timestamp (seconds) when the access token expires; undefined if unknown. */
    expiresAt: number | undefined
}

/**
 * Implements the OAuth2 Client Credentials flow to obtain access tokens.
 */
export class ClientCredentialsAuth implements Auth {
    private readonly tokenUrl: string
    private readonly clientId: string
    private readonly clientSecret: string
    private readonly audience?: string

    private _accessToken?: string
    private _expiresAt?: number

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
    constructor(options: ClientCredentialsOptions) {
        this.tokenUrl = options.tokenUrl
        this.clientId = options.clientId
        this.clientSecret = options.clientSecret
        this.audience = options.audience
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

    async *authFlow(req: Request): AsyncGenerator<Request> {
        const url = new URL(req.url)
        if (this.audience && url.host !== new URL(this.audience).host) {
            yield req
            return
        }
        if (!this._accessToken || !this._expiresAt || Date.now() / 1000 >= this._expiresAt) {
            await this._refreshToken()
        }
        const headers = new Headers(req.headers)
        headers.set('Authorization', `Bearer ${this._accessToken}`)
        yield new Request(req, { headers })
    }
}

/**
 * Implements the OAuth2 Authorization Code PKCE flow to obtain and refresh access and refresh tokens.
 */
export class AuthorizationCodePKCEAuth {
    private readonly _tokenUrl: string
    private readonly _clientId: string
    private readonly _code: string
    private readonly _redirectUri: string
    private readonly _codeVerifier: string
    private readonly _scope?: string
    private readonly _audience?: string

    private _accessToken?: string
    private _refreshTokenValue?: string
    private _expiresAt?: number

    get accessToken(): string | undefined {
        return this._accessToken
    }

    get refreshToken(): string | undefined {
        return this._refreshTokenValue
    }

    get expiresAt(): number | undefined {
        return this._expiresAt
    }

    /**
     * Create an AuthorizationCodePKCEAuth instance.
     *
     * @param options - Configuration for the authorization code PKCE flow.
     */
    constructor(options: AuthorizationCodePKCEOptions) {
        this._tokenUrl = options.tokenUrl
        this._clientId = options.clientId
        this._code = options.code
        this._redirectUri = options.redirectUri
        this._codeVerifier = options.codeVerifier
        this._scope = options.scope
        this._audience = options.audience
    }

    async _refreshToken(): Promise<void> {
        const nowSec = Date.now() / 1000
        const data: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: this._clientId,
            code: this._code,
            redirect_uri: this._redirectUri,
            code_verifier: this._codeVerifier,
        }
        if (this._scope) data.scope = this._scope
        if (this._audience) data.audience = this._audience

        const response = await fetch(this._tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data),
        })
        if (!response.ok) {
            throw new Error(`Token refresh failed with status ${response.status}`)
        }
        const json = await response.json()
        this._accessToken = json.access_token
        this._refreshTokenValue = json.refresh_token
        this._expiresAt = nowSec + json.expires_in - 60
    }

    async *authFlow(req: Request): AsyncGenerator<Request> {
        const url = new URL(req.url)
        if (this._audience && url.host !== new URL(this._audience).host) {
            yield req
            return
        }
        if (!this._accessToken || !this._expiresAt || Date.now() / 1000 >= this._expiresAt) {
            await this._refreshToken()
        }
        const headers = new Headers(req.headers)
        headers.set('Authorization', `Bearer ${this._accessToken}`)
        yield new Request(req, { headers })
    }
}
