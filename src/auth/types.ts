import type { CoreClient } from '../core/clients/CoreClient'

/**
 * Options for the OAuth2 Authorization Code PKCE authentication flow.
 *
 * @property tokenUrl - URL of the OAuth2 token endpoint.
 * @property authorizeUrl - URL of the OAuth2 authorization endpoint. If not provided, derived
 *   from the tokenUrl origin by appending `/authorize`.
 * @property clientId - Client identifier issued by the authorization server.
 * @property code - Authorization code received from the authorization server. If omitted, an
 *   interactive flow will be initiated to obtain one.
 * @property redirectUri - Redirect URI used in the authorization request.
 * @property codeVerifier - PKCE code verifier corresponding to the code challenge. If omitted,
 *   one will be generated during the interactive flow.
 * @property scope - Optional space-delimited OAuth2 scopes.
 * @property audience - Optional API audience parameter.
 */
export interface AuthorizationCodePKCEOptions {
    tokenUrl: string
    authorizeUrl?: string
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
} /**
 * Authentication interface for obtaining and refreshing access tokens.
 */

export interface Auth {
    /**
     * Generator that attaches authentication credentials to outgoing requests.
     *
     * @param req - Original Request object.
     * @returns An AsyncGenerator yielding an authenticated Request.
     */
    authFlow(req: Request, client: CoreClient | boolean): AsyncGenerator<Request, Request>
    /** Perform token refresh and update internal token state. */
    _refreshToken(): Promise<void>

    /** OAuth2 access token or undefined if not yet acquired. */
    accessToken: string | undefined
    /** OAuth2 refresh token or undefined if not applicable. */
    refreshToken: string | undefined
    /** Unix timestamp (seconds) when the access token expires; undefined if unknown. */
    expiresAt: number | undefined
}
