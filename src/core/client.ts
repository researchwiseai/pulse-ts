import { fetchWithRetry, FetchOptions } from '../http';
import { AuthorizationCodePKCEAuth, ClientCredentialsAuth } from '../auth';
import { PulseAPIError } from '../errors';
import type { EmbeddingResponse } from '../models';

/** Core client for interacting with Pulse API endpoints. */
export interface CoreClientOptions {
  baseUrl: string;
  auth: AuthorizationCodePKCEAuth | ClientCredentialsAuth;
}

export class CoreClient {
  private baseUrl: string;
  private auth: AuthorizationCodePKCEAuth | ClientCredentialsAuth;

  constructor(options: CoreClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/g, '');
    this.auth = options.auth;
  }

  /** Create embeddings for an array of text inputs. */
  async create_embeddings(texts: string[], fast = false): Promise<EmbeddingResponse> {
    const path = `${this.baseUrl}/embeddings${fast ? '/fast' : ''}`;
    const init: FetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    };
    const req0 = new Request(path, init);
    const { value: authedReq } = await this.auth.authFlow(req0).next();
    const response = await fetchWithRetry(authedReq, init);
    const json = await response.json();
    if (!response.ok) {
      throw new PulseAPIError(response, json);
    }
    return json as EmbeddingResponse;
  }
}