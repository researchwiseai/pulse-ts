import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { SentimentResponse } from '../../models'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'

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
>(
    client: CoreClient,
    inputs: string[],
    options: AnalyzeSentimentOptions<Fast, AwaitJobResult> = {},
): Promise<AwaitJobResult extends false ? Job<SentimentResponse> : SentimentResponse> {
    return requestFeature(client, '/sentiment', { inputs }, options)
}
