import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { EmbeddingResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

/**
 * Options controlling embeddings creation requests.
 *
 * @typeParam Fast - If true, request fast synchronous response.
 * @typeParam AwaitJobResult - If false when fast=false, return Job handle.
 */
export type CreateEmbeddingsOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> = UniversalFeatureOptions<Fast, AwaitJobResult>

/**
 * Create vector embeddings for a batch of input texts.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false and fast=false, return a Job handle.
 * @param client - CoreClient instance to perform API calls.
 * @param inputs - Array of input strings to embed.
 * @param options - Embedding request options (fast, awaitJobResult).
 * @returns A promise resolving to EmbeddingResponse or Job<EmbeddingResponse>.
 */
export async function createEmbeddings<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
    Result = AwaitJobResult extends false ? Job<EmbeddingResponse> : EmbeddingResponse,
>(
    client: CoreClient,
    inputs: string[],
    { awaitJobResult, fast }: CreateEmbeddingsOptions<Fast, AwaitJobResult> = {},
) {
    const path = `${client.baseUrl}/embeddings`
    const payload: Record<string, unknown> = { inputs, fast }

    const init: FetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }
    const request = new Request(path, init)
    const { value: authedRequest } = await client.auth.authFlow(request).next()
    const response = await fetchWithRetry(authedRequest, init)
    const json = await response.json()
    if (!response.ok) {
        throw new PulseAPIError(response, json)
    }
    if (response.status === 202) {
        const { jobId } = json as { jobId: string }
        const job = new Job<EmbeddingResponse>({
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
        if (awaitJobResult !== false) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    return json as EmbeddingResponse as Result
}
