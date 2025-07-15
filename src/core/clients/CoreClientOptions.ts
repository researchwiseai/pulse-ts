import type { Auth } from '../../auth'

/**
 * Configuration options for creating a CoreClient instance.
 *
 * @property baseUrl - Base URL of the Pulse API (no trailing slash).
 * @property auth - Auth strategy instance for request authentication.
 * @property debug - When true, include the `x-pulse-debug` header on all requests.
 */
export interface CoreClientOptions {
    /** Base URL of the Pulse API (no trailing slash). */
    baseUrl: string
    /** Authenticator instance to sign API requests. */
    auth: Auth.Auth
    /** When true, include the `x-pulse-debug` header on all requests. */
    debug?: boolean
}
