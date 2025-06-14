import { fetchWithRetry, type FetchOptions } from '../http'
import { PulseAPIError } from '../errors'
import type { Auth } from '../auth'

/** @internal */
export interface JobInfo<T, After = T> {
    readonly jobId: string
    readonly baseUrl: string
    readonly auth: Auth
    readonly pollIntervalMs?: number
    after?: (result: T) => Promise<After> | After
}

/**
 * Represents a background job returned by the Pulse API.
 * Allows polling for completion and fetching the final result.
 */
export class Job<T, After = T> {
    /** The job identifier returned by the Pulse API. */
    public readonly jobId: string
    /** Base URL of the Pulse API (no trailing slash). */
    private readonly baseUrl: string
    /** Authenticator to sign requests. */
    private readonly auth: Auth
    /** Poll interval in milliseconds (default: 1000ms). */
    private readonly pollIntervalMs: number
    /** Function to process the result after job completion. */
    private readonly after: (result: T) => Promise<After> | After

    /**
     * Create a new Job instance to poll a background job on the Pulse API.
     *
     * @param options - Configuration for polling the job.
     *   - `jobId`: Identifier of the job returned by the Pulse API.
     *   - `baseUrl`: Base URL of the Pulse API (without trailing slash).
     *   - `auth`: Authenticator instance to sign polling requests.
     *   - `pollIntervalMs`: Milliseconds between polling attempts. Defaults to 1000.
     *   - `after`: Optional callback to transform the raw result payload.
     */
    constructor({
        after = resp => resp as unknown as After,
        auth,
        baseUrl,
        jobId,
        pollIntervalMs = 1000,
    }: JobInfo<T, After>) {
        this.jobId = jobId
        this.baseUrl = baseUrl.replace(/\/+$/, '') // Ensure no trailing slash
        this.auth = auth
        this.pollIntervalMs = pollIntervalMs
        this.after = after
    }

    /**
     * Polls the Pulse API until the background job completes and returns its final result.
     *
     * @returns A promise that resolves to the parsed job result, processed by the `after` callback.
     * @throws {PulseAPIError} If the API returns an error status for the job status query.
     * @throws {Error} If fetching the job result fails or the job status is 'failed'.
     */
    async result(): Promise<After> {
        while (true) {
            const url = `${this.baseUrl}/jobs?jobId=${encodeURIComponent(this.jobId)}`
            const req0 = new Request(url, { method: 'GET' })
            const { value: authedReq } = await this.auth.authFlow(req0).next()
            const res = await fetchWithRetry(authedReq, {} as FetchOptions)
            const info = await res.json()
            if (!res.ok) {
                throw new PulseAPIError(res, info)
            }
            if (info.status === 'completed') {
                const resultUrl: string = info.resultUrl
                const resultReq = new Request(resultUrl, { method: 'GET' })
                const resultRes = await fetchWithRetry(resultReq, {} as FetchOptions)
                if (!resultRes.ok) {
                    const errorBody = await resultRes.text()
                    throw new Error(
                        `Error fetching job result from ${resultUrl}: ${resultRes.status} ${errorBody}`,
                    )
                }
                return await this.after(await resultRes.json())
            }
            if (info.status === 'failed') {
                throw new Error(`Job ${this.jobId} failed`)
            }
            await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs))
        }
    }
}
