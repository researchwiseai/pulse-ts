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

/**
 * Type guard to determine if an unknown error is a `PulseAPIError`.
 *
 * This function checks if the provided value is an instance of `PulseAPIError`
 * or if it's an object that structurally matches the `PulseAPIError` interface
 * (i.e., it has `status`, `statusText`, and `body` properties). This makes the
 * check robust even for errors that have been serialized and deserialized, where
 * `instanceof` checks might fail.
 *
 * @param error The value to check.
 * @returns `true` if the value is a `PulseAPIError`, otherwise `false`.
 *
 * @example
 * ```typescript
 * try {
 *   await makeApiRequest();
 * } catch (error) {
 *   if (isPulseAPIError(error)) {
 *     // TypeScript now knows `error` is of type `PulseAPIError`
 *     console.error(`API Error ${error.status}: ${error.statusText}`);
 *   } else {
 *     console.error("An unknown error occurred", error);
 *   }
 * }
 * ```
 */
export function isPulseAPIError(error: unknown): error is PulseAPIError {
    return (
        error instanceof PulseAPIError ||
        (typeof error === 'object' &&
            error !== null &&
            'status' in error &&
            'statusText' in error &&
            'body' in error)
    )
}

/**
 * Checks if a given value is a TimeoutError.
 *
 * This function is a type guard that narrows the type of the input to `TimeoutError`.
 * It performs a robust check, first using `instanceof`, and then falling back to a
 * structural check on the error's `name` property. This ensures that it correctly
 * identifies timeout errors even if they originate from a different module instance
 * or context where `instanceof` might fail.
 *
 * @param error - The value to check.
 * @returns `true` if the value is a `TimeoutError`, `false` otherwise.
 */
export function isTimeoutError(error: unknown): error is TimeoutError {
    return (
        error instanceof TimeoutError ||
        (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            (error as { name: string }).name === 'TimeoutError')
    )
}

/**
 * Type guard to check if a value is a `NetworkError`.
 *
 * This function provides a robust way to determine if an unknown error is a
 * `NetworkError`. It checks for direct instances of `NetworkError` and also
 * performs a structural check on the object's `name` property. This ensures
 * reliability even when the error object crosses different JavaScript contexts
 * (e.g., iframes, web workers) or has been serialized, where `instanceof`
 * might fail.
 *
 * @param error - The value to check.
 * @returns `true` if the value is a `NetworkError`, `false` otherwise.
 */
export function isNetworkError(error: unknown): error is NetworkError {
    return (
        error instanceof NetworkError ||
        (typeof error === 'object' &&
            error !== null &&
            'name' in error &&
            (error as { name: string }).name === 'NetworkError')
    )
}
