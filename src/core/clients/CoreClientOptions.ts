import type { Auth } from '../../auth';

/** Core client for interacting with Pulse API endpoints. */

export interface CoreClientOptions {
    baseUrl: string;
    auth: Auth;
}
