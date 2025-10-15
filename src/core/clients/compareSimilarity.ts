import { unflatten } from '../../matrix'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Optional } from 'utility-types'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'
import type { components } from '../../models'

export type SimilarityResponse = components['schemas']['SimilarityResponse']

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
> = UniversalFeatureOptions<Fast, AwaitJobResult> & {
    version?: string
    flatten?: boolean
    split?: components['schemas']['Split']
}

// Request payload shapes for the similarity endpoint
interface CompareSimilarityBaseRequest {
    version?: string
    flatten?: boolean
    split?: components['schemas']['Split']
}
type CompareSimilarityRequestSelf = CompareSimilarityBaseRequest & { set: string[] }
type CompareSimilarityRequestCross = CompareSimilarityBaseRequest & {
    set_a: string[]
    set_b: string[]
}
type CompareSimilarityRequest = CompareSimilarityRequestSelf | CompareSimilarityRequestCross

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
>(
    client: CoreClient,
    inputs: CompareSimilarityInputs,
    options: CompareSimilarityOptions<Fast, AwaitJobResult> = {},
): Promise<AwaitJobResult extends false ? Job<SimilarityResponse> : SimilarityResponse> {
    let body: CompareSimilarityRequest
    if ('set' in inputs) {
        body = {
            set: inputs.set,
            version: options.version,
            split: options.split,
            flatten: options.flatten,
        }
    } else {
        body = {
            set_a: inputs.setA,
            set_b: inputs.setB,
            version: options.version,
            split: options.split,
            flatten: options.flatten,
        }
    }
    return requestFeature<
        CompareSimilarityRequest,
        Optional<SimilarityResponse, 'matrix'>,
        Fast,
        AwaitJobResult,
        SimilarityResponse
    >(client, '/similarity', body, options, (resp): SimilarityResponse => {
        if (!resp.matrix && resp.scenario === 'cross' && resp.mode === 'matrix') {
            return {
                ...resp,
                matrix: unflatten(resp.flattened, [resp.n]) as number[][],
            }
        }
        return resp as SimilarityResponse
    })
}
