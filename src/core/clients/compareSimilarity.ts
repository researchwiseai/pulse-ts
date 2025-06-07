import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { SimilarityResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

export interface CompareSimilaritySelf {
    set: string[]
}

export interface CompareSimilarityCross {
    setA: string[]
    setB: string[]
}

export type CompareSimilarityInputs = CompareSimilaritySelf | CompareSimilarityCross

export interface CompareSimilarityOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {}

export async function compareSimilarity<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
    Result = AwaitJobResult extends false ? Job<SimilarityResponse> : SimilarityResponse
>(
    client: CoreClient,
    inputs: CompareSimilarityInputs,
    { awaitJobResult, fast }: CompareSimilarityOptions<Fast, AwaitJobResult> = {}
) {
    const path = `${client.baseUrl}/similarity`
    const payload: Record<string, unknown> = { ...inputs, fast, flatten: true }

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
        const job = new Job<SimilarityResponse>(jobId, client.baseUrl, client.auth)
        if (awaitJobResult) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    // synchronous result
    return json as SimilarityResponse as Result
}
