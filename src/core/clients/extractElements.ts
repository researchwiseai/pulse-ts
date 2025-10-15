import type { components } from '../../models'
import { requestFeature } from './requestFeature'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Job } from '../job'

/**
 * Input parameters for element extraction requests.
 */
export type ExtractionsRequest = components['schemas']['ExtractionsRequest']
export type ExtractionsResponse = components['schemas']['ExtractionsResponse']

export interface ExtractElementsInputs {
    /** Array of text strings to extract elements from. */
    texts: string[]
    /** Optional type of extraction to perform defaults to 'named-entities'. */
    type?: 'named-entities' | 'themes'
    /** Array of items or themes to extract elements for. */
    dictionary: string[]
    /** Expand the dictionary with related terms. */
    expand_dictionary?: boolean
    /** Optional model version to use for extraction. */
    version?: 'original'
}

/**
 * Options controlling element extraction requests.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false when fast=false, return Job handle.
 */
export type ExtractElementsOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> = UniversalFeatureOptions<Fast, AwaitJobResult>

/**
 * Extract specified elements from texts based on given named entities or themes via the Pulse API.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false and fast=false, return a Job handle.
 * @param client - CoreClient instance for API calls.
 * @param inputs - Text inputs
 * @param options - Extraction options (fast, awaitJobResult).
 * @returns ExtractionsResponse or Job handle based on options.
 */
export async function extractElements<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
    Result = AwaitJobResult extends false
        ? Job<components['schemas']['ExtractionsResponse']>
        : components['schemas']['ExtractionsResponse'],
>(
    client: CoreClient,
    inputs: ExtractElementsInputs,
    options: ExtractElementsOptions<Fast, AwaitJobResult> = {},
) {
    const body: Omit<ExtractionsRequest, 'fast'> = {
        inputs: inputs.texts,
        type: inputs.type,
        dictionary: inputs.dictionary,
        expand_dictionary: inputs.expand_dictionary ?? true,
        version: inputs.version,
        ...(options.provider !== undefined && { provider: options.provider }),
    }

    return requestFeature<
        Omit<ExtractionsRequest, 'fast'>,
        ExtractionsResponse,
        Fast,
        AwaitJobResult
    >(client, '/extractions', body, options) as Promise<Result>
}
