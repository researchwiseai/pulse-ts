import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { ExtractionsResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

export interface ExtractElementsInputs {
    inputs: string[]
    themes: string[]
}

export interface ExtractElementsOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {}

export async function extractElements<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
    Result = AwaitJobResult extends false ? Job<ExtractionsResponse> : ExtractionsResponse
>(
    client: CoreClient,
    inputs: ExtractElementsInputs,
    { awaitJobResult, fast }: ExtractElementsOptions<Fast, AwaitJobResult> = {}
) {
    const path = `${client.baseUrl}/themes`
    const payload: Record<string, unknown> = { ...inputs, fast }

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
        const job = new Job<ExtractionsResponse>(jobId, client.baseUrl, client.auth)
        if (awaitJobResult) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    return json as ExtractionsResponse as Result
}
