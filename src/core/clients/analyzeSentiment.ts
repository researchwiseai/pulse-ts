import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import type { SentimentResponse } from '../../models'
import { Job } from '../job'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

/**
 * Configuration options for the analyzeSentiment function.
 *
 * @property fast - If true, performs a quicker analysis with potentially reduced accuracy. Defaults to false.
 * @property awaitJobResult - If true, waits for the sentiment analysis job to complete before returning the result. Defaults to false.
 */
export type AnalyzeSentimentOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> = UniversalFeatureOptions<Fast, AwaitJobResult>
/**
 * Analyzes the sentiment of the provided inputs using the CoreClient.
 *
 * Sends a POST request to the `/sentiment` endpoint with the given texts.
 * Optionally performs a fast analysis and handles asynchronous job responses.
 *
 * @param client - The CoreClient instance used to send authenticated requests.
 * @param inputs - An array of strings to analyze for sentiment.
 * @param options.fast - If true, triggers a faster (possibly less accurate) sentiment analysis.
 * @param options.awaitJobResult - If false, returns a Job object for polling; if true or omitted, awaits and returns the job result.
 * @returns A `SentimentResponse` when the analysis completes immediately, or a `Job<SentimentResponse>` if the request is accepted for asynchronous processing.
 * @throws {PulseAPIError} When the HTTP response status is not in the 2xx range.
 */
export async function analyzeSentiment<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
    Result = AwaitJobResult extends false ? Job<SentimentResponse> : SentimentResponse,
>(
    client: CoreClient,
    inputs: string[],
    { fast, awaitJobResult }: AnalyzeSentimentOptions<Fast, AwaitJobResult> = {},
): Promise<Result> {
    const path = `${client.baseUrl}/sentiment`
    const payload: Record<string, unknown> = { fast, inputs }

    const opts: FetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }
    const request = new Request(path, opts)
    const { value: authedRequest } = await client.auth.authFlow(request).next()
    const response = await fetchWithRetry(authedRequest, opts)
    const json = await response.json()
    if (!response.ok) {
        throw new PulseAPIError(response, json)
    }
    if (response.status === 202) {
        const { jobId } = json as { jobId: string }
        const job = new Job<SentimentResponse>({
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
        if (awaitJobResult !== false) {
            return (await job.result()) as Result
        }
        return job as Result
    }
    return json as SentimentResponse as Result
}
