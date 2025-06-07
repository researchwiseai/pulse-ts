import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { ThemesResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

export interface GenerateThemeOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {
    minThemes?: number
    maxThemes?: number
    context?: string
}

export async function generateThemes<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
    Result = AwaitJobResult extends false ? Job<ThemesResponse> : ThemesResponse
>(
    client: CoreClient,
    inputs: string[],
    { awaitJobResult, fast, maxThemes, minThemes }: GenerateThemeOptions<Fast, AwaitJobResult> = {}
) {
    const path = `${client.baseUrl}/themes`
    const payload: Record<string, unknown> = { inputs, fast, minThemes, maxThemes }

    const init: FetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }
    const req0 = new Request(path, init)
    const { value: authedReq } = await client.auth.authFlow(req0).next()
    const response = await fetchWithRetry(authedReq, init)
    const json = await response.json()
    if (!response.ok) {
        throw new PulseAPIError(response, json)
    }
    if (response.status === 202) {
        const { jobId } = json as { jobId: string }
        const job = new Job<ThemesResponse>(jobId, client.baseUrl, client.auth)
        if (awaitJobResult) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    return json as ThemesResponse as Result
}
