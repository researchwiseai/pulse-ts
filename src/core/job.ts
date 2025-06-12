import { fetchWithRetry, type FetchOptions } from '../http'
import { PulseAPIError } from '../errors'
import type { Auth } from '../auth'

interface JobInfo<T, After = T> {
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
    private pollIntervalMs: number
    /** Function to process the result after job completion. */
    private readonly after: (result: T) => Promise<After> | After

    constructor({
        jobId,
        baseUrl,
        auth,
        pollIntervalMs = 1000,
        after = resp => resp as unknown as After,
    }: JobInfo<T, After>) {
        this.jobId = jobId
        this.baseUrl = baseUrl.replace(/\/+$/, '') // Ensure no trailing slash
        this.auth = auth
        this.pollIntervalMs = pollIntervalMs
        this.after = after
    }

    /**
     * Polls the Pulse API until the job completes, then fetches and returns the result.
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
