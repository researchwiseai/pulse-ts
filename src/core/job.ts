import { fetchWithRetry, type FetchOptions } from '../http'
import { PulseAPIError } from '../errors'
import type { Auth } from '../auth'
import { debugLog } from './log'

/** @internal */
export interface JobInfo<T, After = T> {
    readonly jobId: string
    readonly baseUrl: string
    readonly auth: Auth.Auth
    readonly debug?: boolean
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
    private readonly auth: Auth.Auth
    private readonly debug: boolean
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
        debug = false,
        jobId,
        pollIntervalMs = 1000,
    }: JobInfo<T, After>) {
        this.jobId = jobId
        this.baseUrl = baseUrl.replace(/\/{1,100}$/, '') // Ensure no trailing slash
        this.auth = auth
        this.debug = debug
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
        debugLog(this.debug, `[Job ${this.jobId}] starting result polling`)
        while (true) {
            const url = `${this.baseUrl}/jobs?jobId=${encodeURIComponent(this.jobId)}`
            debugLog(this.debug, `[Job ${this.jobId}] polling status ${url}`)
            const req0 = new Request(url, {
                method: 'GET',
                headers: this.debug ? { 'x-pulse-debug': 'true' } : undefined,
            })
            const { value: authedReq } = await this.auth.authFlow(req0).next()
            const res = await fetchWithRetry(authedReq, {} as FetchOptions)
            const info = await res.json()
            debugLog(this.debug, `[Job ${this.jobId}] status`, info)
            if (!res.ok) {
                throw new PulseAPIError(res, info)
            }
            if (info.status === 'completed') {
                debugLog(this.debug, `[Job ${this.jobId}] completed; fetching result`)
                // accept either snake_case or camelCase for download URL
                const resultUrl: string = info.result_url ?? info.resultUrl!
                const resultReq = new Request(resultUrl, {
                    method: 'GET',
                    headers: this.debug ? { 'x-pulse-debug': 'true' } : undefined,
                })
                const resultRes = await fetchWithRetry(resultReq, {} as FetchOptions)
                if (!resultRes.ok) {
                    const errorBody = await resultRes.text()
                    throw new Error(
                        `Error fetching job result from ${resultUrl}: ${resultRes.status} ${errorBody}`,
                    )
                }
                const finalRes = await resultRes.json()
                debugLog(this.debug, `[Job ${this.jobId}] result fetched`, finalRes)
                return await this.after(finalRes)
            }
            if (info.status === 'failed') {
                debugLog(this.debug, `[Job ${this.jobId}] failed`)
                throw new Error(`Job ${this.jobId} failed`)
            }
            debugLog(
                this.debug,
                `[Job ${this.jobId}] pending; waiting ${this.pollIntervalMs}ms before retry`,
            )
            await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs))
        }
    }
}
