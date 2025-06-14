import type { Auth } from '../../auth'

/**
 * Configuration options for creating a CoreClient instance.
 *
 * @property baseUrl - Base URL of the Pulse API (no trailing slash).
 * @property auth - Auth strategy instance for request authentication.
 */
export interface CoreClientOptions {
    /** Base URL of the Pulse API (no trailing slash). */
    baseUrl: string
    /** Authenticator instance to sign API requests. */
    auth: Auth.Auth
}
