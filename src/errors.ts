/**
 * Represents an error returned by the Pulse API when a request fails.
 */
export class PulseAPIError extends Error {
    /** HTTP status code returned by the API */
    status: number
    /** HTTP status text returned by the API */
    statusText: string
    /** Parsed response body, if available */
    body: any

    constructor(response: Response, body: any) {
        super(`Pulse API Error: ${response.status} ${response.statusText}`)
        this.name = 'PulseAPIError'
        this.status = response.status
        this.statusText = response.statusText
        this.body = body
    }
}

export class TimeoutError extends Error {
    constructor(url: string, timeout: number) {
        super(`Request to ${url} timed out after ${timeout}ms`)
        this.name = 'TimeoutError'
    }
}

export class NetworkError extends Error {
    constructor(url: string, cause: Error) {
        super(`Network error while requesting ${url}: ${cause.message}`)
        this.name = 'NetworkError'
    }
}
