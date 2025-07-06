import type { AuthorizationCodePKCEOptions } from './types'
import { randomBytes, createHash } from 'crypto'

/**
 * Base64-url encode a buffer (RFC 7636).
 */
function base64URLEncode(buffer: Buffer): string {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Implements the OAuth2 Authorization Code PKCE flow to obtain and refresh access and refresh tokens.
 */

export class AuthorizationCodePKCEAuth {
    private readonly _tokenUrl: string
    private readonly _authorizeUrl: string
    private readonly _clientId: string
    private _code?: string
    private readonly _redirectUri: string
    private _codeVerifier?: string
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
    constructor(options: Partial<AuthorizationCodePKCEOptions> = {}) {
        this._tokenUrl =
            options.tokenUrl ??
            process.env.PULSE_TOKEN_URL ??
            'https://research-wise-ai-eu.eu.auth0.com/oauth/token'
        this._authorizeUrl =
            options.authorizeUrl ??
            process.env.PULSE_AUTHORIZE_URL ??
            (() => {
                try {
                    return `${new URL(this._tokenUrl).origin}/authorize`
                } catch {
                    return ''
                }
            })()
        this._code = options.code
        this._redirectUri =
            options.redirectUri ??
            process.env.PULSE_REDIRECT_URI ??
            'http://localhost:3000/callback'
        this._codeVerifier = options.codeVerifier
        this._scope =
            options.scope ?? process.env.PULSE_SCOPE ?? 'openid profile email offline_access'
        this._audience =
            options.audience ??
            process.env.PULSE_AUDIENCE ??
            'https://core.researchwiseai.com/pulse/v1'

        const clientId = options.clientId ?? process.env.PULSE_CLIENT_ID

        if (!clientId) {
            throw new Error('Client ID is required for Authorization Code PKCE authentication')
        } else {
            this._clientId = clientId
        }
    }

    /**
     * Perform the interactive authorization request to obtain an authorization code and PKCE verifier.
     * Opens the system browser or prints the URL, then listens for the callback to capture the code.
     */
    private async _performAuthorization(): Promise<void> {
        // Generate PKCE code verifier and challenge
        const verifier = this._codeVerifier ?? base64URLEncode(randomBytes(32))
        this._codeVerifier = verifier
        const challenge = base64URLEncode(createHash('sha256').update(verifier).digest())

        // State for CSRF protection
        const state = base64URLEncode(randomBytes(16))

        // Build the authorization URL
        const authUrl = new URL(this._authorizeUrl)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('client_id', this._clientId)
        authUrl.searchParams.set('redirect_uri', this._redirectUri)
        authUrl.searchParams.set('code_challenge', challenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')
        if (this._scope) authUrl.searchParams.set('scope', this._scope)
        if (this._audience) authUrl.searchParams.set('audience', this._audience)
        authUrl.searchParams.set('state', state)

        // Open browser if possible, otherwise instruct user
        let opened = false
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const openMod: any = await import('open')
            const opener = typeof openMod === 'function' ? openMod : openMod.default
            if (typeof opener === 'function') {
                await opener(authUrl.toString())
                opened = true
            }
        } catch {
            // ignore if open is not available
        }
        if (!opened) {
            console.log(`Open this URL in your browser:
${authUrl}`)
        }

        // Await the callback to our redirect URI
        const redirectUrl = new URL(this._redirectUri)
        const port = redirectUrl.port ? Number(redirectUrl.port) : undefined
        const host = redirectUrl.hostname
        // eslint-disable-next-line no-async-promise-executor
        await new Promise<void>(async (resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let server: any
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const httpMod: any = await import('http')
                const httpLib = httpMod.default ?? httpMod
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                server = httpLib.createServer((req: any, res: any) => {
                    if (!req.url) return
                    const reqUrl = new URL(req.url, `${redirectUrl.protocol}//${redirectUrl.host}`)
                    if (reqUrl.pathname !== redirectUrl.pathname) return
                    const returnedState = reqUrl.searchParams.get('state')
                    const code = reqUrl.searchParams.get('code')
                    if (returnedState !== state || !code) {
                        res.writeHead(400, { 'Content-Type': 'text/plain' })
                        res.end('Invalid authentication response')
                        reject(new Error('Invalid state or missing code in callback'))
                        server.close()
                        return
                    }
                    res.writeHead(200, { 'Content-Type': 'text/plain' })
                    res.end('Authentication complete; you may now close this window.')
                    this._code = code
                    resolve()
                    server.close()
                })
                server.listen(port, host)
            } catch (err) {
                reject(err)
            }
        })
    }

    async _refreshToken(): Promise<void> {
        // If no code or verifier provided, run interactive authorization flow
        if (!this._code || !this._codeVerifier) {
            await this._performAuthorization()
        }
        const nowSec = Date.now() / 1000
        const data: Record<string, string> = {
            grant_type: 'authorization_code',
            client_id: this._clientId,
            code: this._code!,
            redirect_uri: this._redirectUri,
            code_verifier: this._codeVerifier!,
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

    /**
     * Check whether the required environment variables are set for Authorization Code PKCE authentication flow.
     */
    static isAvailable(): boolean {
        return Boolean(
            process.env.PULSE_CLIENT_ID &&
                process.env.PULSE_TOKEN_URL &&
                process.env.PULSE_CODE &&
                process.env.PULSE_REDIRECT_URI &&
                process.env.PULSE_CODE_VERIFIER,
        )
    }
}
