import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import { unflatten } from '../../matrix'
import type { SimilarityResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Optional } from 'utility-types'

/**
 * Input shape for self-comparison similarity where a single set is compared to itself.
 */
export interface CompareSimilaritySelf {
    /** Array of text strings to compare among themselves. */
    set: string[]
}

/**
 * Input shape for cross-comparison similarity between two distinct sets.
 */
export interface CompareSimilarityCross {
    /** First array of text strings. */
    setA: string[]
    /** Second array of text strings. */
    setB: string[]
}

/**
 * Inputs for similarity computation, supporting both self and cross comparison.
 */
export type CompareSimilarityInputs = CompareSimilaritySelf | CompareSimilarityCross

/**
 * Options controlling similarity comparison requests.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false when fast=false, return Job handle.
 */
export type CompareSimilarityOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> = UniversalFeatureOptions<Fast, AwaitJobResult>

/**
 * Compute similarity scores between texts using the Pulse API.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false and fast=false, return a Job handle.
 * @param client - CoreClient instance for API calls.
 * @param inputs - Dataset inputs shape for similarity computation.
 * @param options - Similarity request options (fast, awaitJobResult).
 * @returns SimilarityResponse or Job<SimilarityResponse> based on options.
 */
export async function compareSimilarity<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
    Result = AwaitJobResult extends false ? Job<SimilarityResponse> : SimilarityResponse,
>(
    client: CoreClient,
    inputs: CompareSimilarityInputs,
    { awaitJobResult, fast }: CompareSimilarityOptions<Fast, AwaitJobResult> = {},
) {
    const path = `${client.baseUrl}/similarity`
    const payload: Record<string, unknown> = {
        fast,
        flatten: false,
    }

    if ('set' in inputs) {
        payload.set = inputs.set
    } else {
        payload.set_a = inputs.setA
        payload.set_b = inputs.setB
    }

    const options: FetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }
    const request = new Request(path, options)
    const { value: authedRequest } = await client.auth.authFlow(request).next()
    const response = await fetchWithRetry(authedRequest, options)
    const json = await response.json()
    if (!response.ok) {
        throw new PulseAPIError(response, json)
    }
    if (response.status === 202) {
        // Job accepted for background processing
        const { jobId } = json as { jobId: string }
        const job = new Job<Optional<SimilarityResponse, 'matrix'>, SimilarityResponse>({
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
            after: resp => {
                // If the matrix is not returned, unflatten the flattened result
                if (!resp.matrix) {
                    return {
                        ...resp,
                        matrix: unflatten(resp.flattened, [resp.n]) as number[][],
                    } satisfies SimilarityResponse
                } else {
                    return resp as SimilarityResponse
                }
            },
        })
        if (awaitJobResult) {
            return (await job.result()) as Result
        }
        return job as Result
    } else {
        const partial = json as Optional<SimilarityResponse, 'matrix'>

        if (!partial.matrix && partial.scenario === 'cross') {
            partial.matrix = unflatten(partial.flattened, [partial.n]) as number[][]
        }
        return partial as SimilarityResponse as Result
    }
}
