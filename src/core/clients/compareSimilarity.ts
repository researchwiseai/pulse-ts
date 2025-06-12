import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import { unflatten } from '../../matrix'
import type { SimilarityResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Optional } from 'utility-types'

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
    AwaitJobResult extends boolean | undefined,
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {}

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
