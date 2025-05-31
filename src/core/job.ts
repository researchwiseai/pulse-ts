import { fetchWithRetry, type FetchOptions } from '../http'
import { PulseAPIError } from '../errors'
import type { Auth} from '../auth'

/**
 * Represents a background job returned by the Pulse API.
 * Allows polling for completion and fetching the final result.
 */
export class Job<T> {
    private pollIntervalMs: number

    constructor(
        /** The job identifier returned by the Pulse API. */
        public readonly jobId: string,
        /** Base URL of the Pulse API (no trailing slash). */
        private readonly baseUrl: string,
        /** Authenticator to sign requests. */
        private readonly auth: Auth,
        /** Poll interval in milliseconds (default: 1000ms). */
        pollIntervalMs = 1000,
    ) {
        this.pollIntervalMs = pollIntervalMs
    }

    /**
     * Polls the Pulse API until the job completes, then fetches and returns the result.
     */
    async result(): Promise<T> {
        while (true) {
            const url = `${this.baseUrl}/jobs?jobId=${encodeURIComponent(this.jobId)}`
            const req0 = new Request(url, { method: 'GET' })
            const { value: authedReq } = await this.auth.authFlow(req0).next()
            const res = await fetchWithRetry(authedReq, {} as FetchOptions)
            const info = await res.json()
            if (!res.ok) {
                throw new PulseAPIError(res, info)
            }
            if (info.status === 'completed' || info.status === 'complete') {
                const resultUrl: string = info.resultUrl
                const resultReq = new Request(resultUrl, { method: 'GET' })
                const resultRes = await fetchWithRetry(resultReq, {} as FetchOptions)
                if (!resultRes.ok) {
                    const errorBody = await resultRes.text()
                    throw new Error(
                        `Error fetching job result from ${resultUrl}: ${resultRes.status} ${errorBody}`,
                    )
                }
                return await resultRes.json()
            }
            if (info.status === 'failed') {
                throw new Error(`Job ${this.jobId} failed`)
            }
            await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs))
        }
    }
}
