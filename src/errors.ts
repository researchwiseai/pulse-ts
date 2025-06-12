/**
 * Represents an error returned by the Pulse API when a request fails.
 *
 * @param response - The HTTP Response object from the failed request.
 * @param body - The parsed response body or error payload.
 */
export class PulseAPIError extends Error {
    /** HTTP status code returned by the API */
    status: number
    /** HTTP status text returned by the API */
    statusText: string
    /** Parsed response body, if available */
    body: unknown

    constructor(response: Response, body: unknown) {
        super(`Pulse API Error: ${response.status} ${response.statusText}`)
        this.name = 'PulseAPIError'
        this.status = response.status
        this.statusText = response.statusText
        this.body = body
    }
}

/** Error thrown when an HTTP request times out. */
export class TimeoutError extends Error {
    /**
     * @param url - The request URL that timed out.
     * @param timeout - Timeout duration in milliseconds.
     */
    constructor(url: string, timeout: number) {
        super(`Request to ${url} timed out after ${timeout}ms`)
        this.name = 'TimeoutError'
    }
}

/** Error thrown when a network error occurs during fetch. */
export class NetworkError extends Error {
    /**
     * @param url - The request URL that caused the network error.
     * @param cause - The original error raised by fetch.
     */
    constructor(url: string, cause: Error) {
        super(`Network error while requesting ${url}: ${cause.message}`)
        this.name = 'NetworkError'
    }
}
