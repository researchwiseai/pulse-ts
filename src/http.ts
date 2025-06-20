import { ENV_VAR, DEFAULTS } from './config'

if (typeof window === 'undefined' && process.env[ENV_VAR.DEBUG_PROXY]) {
    import('undici').then(({ ProxyAgent, setGlobalDispatcher }) => {
        // Point to the Postman proxy you started on port 5555
        const dispatcher = new ProxyAgent(process.env[ENV_VAR.DEBUG_PROXY]!) // e.g. 'http://127.0.0.1:5555'
        setGlobalDispatcher(dispatcher) // affect **all** subsequent fetch() calls
    })
}

export interface FetchOptions extends RequestInit {
    /** Maximum time (ms) to wait before aborting the request */
    timeout?: number
    /** Number of retry attempts on network or non-OK responses */
    retries?: number
}

import { NetworkError, TimeoutError } from './errors'

/**
 * Attempt a fetch with a timeout, returning the Response or throwing on error.
 */
async function attemptFetch(input: Request, init: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    // Use input Request directly to preserve body and headers without consuming its body
    const req = input
    try {
        // Merge existing request headers with init.headers, preserving authorization
        const headerObj: Record<string, string> = {}
        req.headers.forEach((v, k) => {
            headerObj[k] = v
        })
        const initHeaders: Record<string, string> = {}
        if (init.headers) {
            new Headers(init.headers).forEach((v, k) => {
                initHeaders[k] = v
            })
        }
        const authorization = req.headers.get('authorization')
        const headers = {
            ...headerObj,
            ...initHeaders,
            ...(authorization ? { authorization } : {}),
        }
        return await fetch(req, { ...init, headers, signal: controller.signal })
    } finally {
        clearTimeout(timer)
    }
}

/**
 * Normalize fetch errors into TimeoutError or NetworkError, or rethrow other errors.
 *
 * @param err - The error thrown during fetch.
 * @param url - The request URL being fetched.
 * @param timeout - Timeout duration in milliseconds.
 * @throws TimeoutError when request is aborted.
 * @throws NetworkError when a network error occurs.
 */
function handleFetchError(err: unknown, url: string, timeout: number): never {
    if (err instanceof DOMException && err.name === 'AbortError') {
        throw new TimeoutError(url, timeout)
    }
    if (err instanceof TypeError) {
        throw new NetworkError(url, err)
    }
    throw err as Error
}

/**
 * Perform a fetch request with automatic timeout and retry support.
 *
 * @param input - The Request object to send.
 * @param options - Fetch options including timeout, retries, and other RequestInit fields.
 * @returns A promise resolving to the Response object.
 * @throws TimeoutError if the request times out after the specified duration.
 * @throws NetworkError for network-related failures after retries.
 */
export async function fetchWithRetry(
    input: Request,
    options: Omit<FetchOptions, 'headers'> = {},
): Promise<Response> {
    const { retries = DEFAULTS.RETRIES, timeout = DEFAULTS.TIMEOUT, ...init } = options
    let attempt = 0
    if (process.env[ENV_VAR.DEBUG_LOGGING]) {
        console.log(`Starting fetch with retries=${retries}, timeout=${timeout}ms`)
        console.log(`Request URL: ${input.url}`)
        console.log(`Request Method: ${input.method || 'GET'}`)
        console.log(`Request Body: ${input.body ? JSON.stringify(input.body) : 'No body'}`)
        input.headers.forEach((value, key) => {
            console.log(`Header: ${key} = ${value}`)
        })
    }
    while (true) {
        attempt++

        if (process.env[ENV_VAR.DEBUG_LOGGING]) {
            console.log(`Attempt ${attempt} of ${retries + 1}`)
        }
        try {
            const response = await attemptFetch(
                input,
                {
                    ...init,
                    headers: input.headers, // Preserve original request headers
                },
                timeout,
            )
            if (!response.ok && attempt <= retries) {
                if (process.env[ENV_VAR.DEBUG_LOGGING]) {
                    console.warn(`Response not OK: ${response.status} ${response.statusText}`)
                }
                continue
            }

            if (process.env[ENV_VAR.DEBUG_LOGGING]) {
                console.log(`Fetch successful on attempt ${attempt}`)
                console.log('Response Headers:')
                response.headers.forEach((value, key) => {
                    console.log(`  ${key}: ${value}`)
                })
                console.log(`Response Status: ${response.status} ${response.statusText}`)
            }

            return response
        } catch (err) {
            if (process.env[ENV_VAR.DEBUG_LOGGING]) {
                console.error(`Fetch attempt ${attempt} failed:`, err)
            }
            if (attempt <= retries) continue
            handleFetchError(err, input.url, timeout)
        }
    }
}
