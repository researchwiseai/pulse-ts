import { fetchWithRetry, FetchOptions } from '../http';
import { AuthorizationCodePKCEAuth, ClientCredentialsAuth } from '../auth';
import { PulseAPIError } from '../errors';
import type { EmbeddingResponse, SimilarityResponse, ThemesResponse, SentimentResponse } from '../models';
import { Job } from './job';

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

  /**
   * Compute similarity scores between texts.
   *
   * @param set Array of text items to compare.
   * @param fast If true, return instant response; otherwise may enqueue a job.
   * @param flatten If true, flatten the similarity matrix into a 1D array.
   * @param awaitJobResult If false and fast=false, return a Job handle instead of awaiting result.
   */
  async compare_similarity(
    set: string[],
    fast = false,
    flatten = false,
    awaitJobResult = true
  ): Promise<SimilarityResponse | Job<SimilarityResponse>> {
    const path = `${this.baseUrl}/similarity`;
    const payload: Record<string, any> = { set, flatten };
    if (fast) {
      payload.fast = true;
    }
    const init: FetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    const req0 = new Request(path, init);
    const { value: authedReq } = await this.auth.authFlow(req0).next();
    const response = await fetchWithRetry(authedReq, init);
    const json = await response.json();
    if (!response.ok) {
      throw new PulseAPIError(response, json);
    }
    if (response.status === 202) {
      // Job accepted for background processing
      const { jobId } = json as { jobId: string };
      const job = new Job<SimilarityResponse>(jobId, this.baseUrl, this.auth);
      if (awaitJobResult) {
        return await job.result();
      }
      return job;
    }
    // synchronous result
    return json as SimilarityResponse;
  }

  /**
   * Generate themes for a set of input texts.
   *
   * @param inputs Array of input texts to analyze.
   * @param minThemes Minimum number of themes to return.
   * @param maxThemes Maximum number of themes to return.
   * @param fast If true, request a fast synchronous response; otherwise may enqueue a job.
   * @param awaitJobResult If false and fast=false, return a Job handle instead of awaiting the result.
   */
  async generate_themes(
    inputs: string[],
    minThemes: number,
    maxThemes: number,
    fast = false,
    awaitJobResult = true
  ): Promise<ThemesResponse | Job<ThemesResponse>> {
    const path = `${this.baseUrl}/themes`;
    const payload: Record<string, any> = { inputs, minThemes, maxThemes };
    if (fast) {
      payload.fast = true;
    }
    const init: FetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    const req0 = new Request(path, init);
    const { value: authedReq } = await this.auth.authFlow(req0).next();
    const response = await fetchWithRetry(authedReq, init);
    const json = await response.json();
    if (!response.ok) {
      throw new PulseAPIError(response, json);
    }
    if (response.status === 202) {
      const { jobId } = json as { jobId: string };
      const job = new Job<ThemesResponse>(jobId, this.baseUrl, this.auth);
      if (awaitJobResult) {
        return await job.result();
      }
      return job;
    }
    return json as ThemesResponse;
  }

  /**
   * Analyze sentiment for an array of input texts.
   *
   * @param inputs Array of text inputs to analyze.
   * @param fast If true, request a fast synchronous response; otherwise may enqueue a job.
   * @param awaitJobResult If false and fast=false, return a Job handle instead of awaiting the result.
   */
  async analyze_sentiment(
    inputs: string[],
    fast = false,
    awaitJobResult = true
  ): Promise<SentimentResponse | Job<SentimentResponse>> {
    const path = `${this.baseUrl}/sentiment`;
    const payload: Record<string, any> = { inputs };
    if (fast) {
      payload.fast = true;
    }
    const init: FetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    };
    const req0 = new Request(path, init);
    const { value: authedReq } = await this.auth.authFlow(req0).next();
    const response = await fetchWithRetry(authedReq, init);
    const json = await response.json();
    if (!response.ok) {
      throw new PulseAPIError(response, json);
    }
    if (response.status === 202) {
      const { jobId } = json as { jobId: string };
      const job = new Job<SentimentResponse>(jobId, this.baseUrl, this.auth);
      if (awaitJobResult) {
        return await job.result();
      }
      return job;
    }
    return json as SentimentResponse;
  }
}