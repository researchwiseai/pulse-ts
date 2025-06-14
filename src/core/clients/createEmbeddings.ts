import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { EmbeddingResponse } from '../../models'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'

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
>(
    client: CoreClient,
    inputs: string[],
    options: CreateEmbeddingsOptions<Fast, AwaitJobResult> = {},
): Promise<AwaitJobResult extends false ? Job<EmbeddingResponse> : EmbeddingResponse> {
    return requestFeature(client, '/embeddings', { inputs }, options)
}
