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
    /** Optional category labels to guide the extraction. */
    categories?: string[]
    /** Optional custom dictionary mapping categories to keywords. */
    dictionary?: Record<string, string[]>
    /** Expand the dictionary with related terms. */
    expand_dictionary?: boolean
    /** Use named-entity recognition for extraction. */
    use_ner?: boolean
    /** Use a language model to assist extraction. */
    use_llm?: boolean
    /** Confidence threshold for matches. */
    threshold?: number
    /** Optional model version to use for extraction. */
    version?: string
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
 * Extract specified elements from texts based on given themes via the Pulse API.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false and fast=false, return a Job handle.
 * @param client - CoreClient instance for API calls.
 * @param inputs - Inputs including texts and theme labels.
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
    { awaitJobResult, fast }: ExtractElementsOptions<Fast, AwaitJobResult> = {},
) {
    const body: Omit<ExtractionsRequest, 'fast'> = {
        texts: inputs.texts,
        categories: inputs.categories,
        dictionary: inputs.dictionary,
        expand_dictionary: inputs.expand_dictionary ?? true,
        use_ner: inputs.use_ner ?? true,
        use_llm: inputs.use_llm ?? true,
        threshold: inputs.threshold ?? 0.5,
        version: inputs.version,
    }

    return requestFeature<
        Omit<ExtractionsRequest, 'fast'>,
        ExtractionsResponse,
        Fast,
        AwaitJobResult
    >(client, '/extractions', body, { awaitJobResult, fast }) as Promise<Result>
}
