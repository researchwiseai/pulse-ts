import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { components } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

/**
 * Input parameters for element extraction requests.
 */
export interface ExtractElementsInputs {
    /** Array of text strings to extract elements from. */
    inputs: string[]
    /** Array of theme labels to guide the extraction. */
    themes: string[]
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
 * @returns ExtractionsResponse or Job<ExtractionsResponse> based on options.
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
    const path = `${client.baseUrl}/themes`
    const payload: Record<string, unknown> = { ...inputs, fast }

    const init: FetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }
    const request = new Request(path, init)
    const { value: authedRequest } = await client.auth.authFlow(request, client).next()
    const response = await fetchWithRetry(authedRequest, init)
    const json = await response.json()
    if (!response.ok) {
        throw new PulseAPIError(response, json)
    }
    if (response.status === 202) {
        const { jobId } = json as { jobId: string }
        const job = new Job<components['schemas']['ExtractionsResponse']>({
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
        if (awaitJobResult) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    return json as components['schemas']['ExtractionsResponse'] as Result
}
