import { PulseAPIError } from '../../errors'
import { fetchWithRetry, type FetchOptions } from '../../http'
import { Job } from '../job'
import { debugLog } from '../log'
import { normalizeJobId } from './utils'
import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'

/**
 * Generic helper to perform API feature requests with optional Job polling.
 *
 * @typeParam TReq - Request payload type (excluding { fast }).
 * @typeParam TRaw - Raw response type returned by the API.
 * @typeParam Fast - When true, request a fast synchronous response.
 * @typeParam AwaitJobResult - When false (and Fast not true), return Job handle instead of awaiting.
 * @typeParam TAfter - Final result type after applying the `after` transform (defaults to TRaw).
 * @typeParam TResult - Return type: TRaw or Job<TRaw, TAfter>, depending on AwaitJobResult.
 *
 * @param client - CoreClient instance for API calls.
 * @param endpoint - API endpoint path (must start with '/').
 * @param body - Request payload fields excluding the `fast` flag.
 * @param options - Universal feature options (fast, awaitJobResult).
 * @param after - Optional transform applied to raw responses (sync or job result).
 * @returns The final result or Job handle, based on options.
 * @throws PulseAPIError on non-2xx HTTP responses.
 */
export async function requestFeature<
    TReq,
    TRaw,
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
    TAfter = TRaw,
    TResult = AwaitJobResult extends false ? Job<TRaw, TAfter> : TAfter,
>(
    client: CoreClient,
    endpoint: string,
    body: TReq,
    options: UniversalFeatureOptions<Fast, AwaitJobResult>,
    after: (raw: TRaw) => TAfter = raw => raw as unknown as TAfter,
): Promise<TResult> {
    const { awaitJobResult, fast } = options
    const url = `${client.baseUrl}${endpoint}`
    const payload = { ...body, fast }
    debugLog(client.debug, `Requesting ${url}`, payload)

    const init: FetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(client.debug ? { 'x-pulse-debug': 'true' } : {}),
        },
        body: JSON.stringify(payload),
    }

    const request = new Request(url, init)
    const { value: authedRequest } = await client.auth.authFlow(request).next()

    const response = await fetchWithRetry(authedRequest, init)
    debugLog(client.debug, `Response ${response.status} for ${endpoint}`)
    const json = await response.json()
    debugLog(client.debug, `Response body`, json)

    if (!response.ok) {
        throw new PulseAPIError(response, json)
    }

    if (response.status === 202) {
        // accept either snake_case or camelCase
        const rawJson = json as { job_id: string } | { jobId: string }
        const jobId = normalizeJobId(rawJson)
        debugLog(client.debug, `Received job ${jobId}`)
        const job = new Job<TRaw, TAfter>({
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
            debug: client.debug,
            after,
        })
        // If awaitJobResult is explicitly false
        if (awaitJobResult === false) {
            return job as unknown as TResult
        }
        return (await job.result()) as unknown as TResult
    }

    const raw = json as TRaw
    return after(raw) as unknown as TResult
}
