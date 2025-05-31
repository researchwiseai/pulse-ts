export interface AuthorizationCodePKCEOptions {
    tokenUrl: string
    clientId: string
    code: string
    redirectUri: string
    codeVerifier: string
    scope?: string
    audience?: string
}

export interface ClientCredentialsOptions {
    tokenUrl: string
    clientId: string
    clientSecret: string
    audience?: string
}

export class ClientCredentialsAuth {
    private tokenUrl: string
    private clientId: string
    private clientSecret: string
    private audience?: string

    _accessToken?: string
    _expiresAt?: number

    constructor(options: ClientCredentialsOptions) {
        this.tokenUrl = options.tokenUrl
        this.clientId = options.clientId
        this.clientSecret = options.clientSecret
        this.audience = options.audience
    }

    private async _refreshToken(): Promise<void> {
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

export class AuthorizationCodePKCEAuth {
    private tokenUrl: string
    private clientId: string
    private code: string
    private redirectUri: string
    private codeVerifier: string
    private scope?: string
    private audience?: string

    _accessToken?: string
    _refreshTokenValue?: string
    _expiresAt?: number

    constructor(options: AuthorizationCodePKCEOptions) {
        this.tokenUrl = options.tokenUrl
        this.clientId = options.clientId
        this.code = options.code
        this.redirectUri = options.redirectUri
        this.codeVerifier = options.codeVerifier
        this.scope = options.scope
        this.audience = options.audience
    }

    async _refreshToken(): Promise<void> {
        const nowSec = Date.now() / 1000
        const data: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: this.clientId,
            code: this.code,
            redirect_uri: this.redirectUri,
            code_verifier: this.codeVerifier,
        }
        if (this.scope) data.scope = this.scope
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
        this._refreshTokenValue = json.refresh_token
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
