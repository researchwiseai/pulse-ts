import type { components } from '../../models'
import { requestFeature } from './requestFeature'
import type { CoreClient } from './CoreClient'

/**
 * Input parameters for element extraction requests.
 */
export type ExtractionsRequest = components['schemas']['ExtractionsRequest']
export type ExtractionsResponse = components['schemas']['ExtractionsResponse']

export interface ExtractElementsInputs {
    /** Array of text strings to extract elements from. */
    inputs: string[]
    /** Category label to guide extraction. */
    category: string
    /** Canonical terms associated with the category. */
    dictionary: string[]
    /** Expand the dictionary with related terms. */
    expand_dictionary?: boolean
    /** Optional limit on number of additions when expanding the dictionary. */
    expand_dictionary_limit?: number
}

/**
 * Extract specified elements from texts via the Pulse API.
 *
 * @param client - CoreClient instance for API calls.
 * @param inputs - Inputs including texts and category dictionary.
 * @returns ExtractionsResponse containing matches for each input.
 */
export async function extractElements(
    client: CoreClient,
    inputs: ExtractElementsInputs,
): Promise<ExtractionsResponse> {
    const body: ExtractionsRequest = {
        inputs: inputs.inputs,
        category: inputs.category,
        dictionary: inputs.dictionary,
        expand_dictionary: inputs.expand_dictionary ?? false,
        ...(inputs.expand_dictionary_limit != null
            ? { expand_dictionary_limit: inputs.expand_dictionary_limit }
            : {}),
    }

    return requestFeature<ExtractionsRequest, ExtractionsResponse>(client, '/extractions', body, {})
}
