import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { EmbeddingResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

export interface CreateEmbeddingsOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {}

export async function createEmbeddings<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
    Result = AwaitJobResult extends false ? Job<EmbeddingResponse> : EmbeddingResponse,
>(
    client: CoreClient,
    inputs: string[],
    { awaitJobResult, fast }: CreateEmbeddingsOptions<Fast, AwaitJobResult> = {},
) {
    const path = `${client.baseUrl}/embeddings`
    const payload: Record<string, unknown> = { inputs, fast }

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
        const job = new Job<EmbeddingResponse>({
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
        if (awaitJobResult !== false) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    return json as EmbeddingResponse as Result
}
