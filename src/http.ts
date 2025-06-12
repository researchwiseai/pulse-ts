if (typeof window === 'undefined' && process.env.DEBUG_PROXY) {
    import('undici').then(({ setGlobalDispatcher, ProxyAgent }) => {
        // Point to the Postman proxy you started on port 5555
        const dispatcher = new ProxyAgent(process.env.DEBUG_PROXY!) // e.g. 'http://127.0.0.1:5555'
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
    const req = new Request(input)
    try {
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
    options: FetchOptions = {},
): Promise<Response> {
    const { timeout = 30000, retries = 1, ...init } = options
    let attempt = 0
    while (true) {
        attempt++
        try {
            const response = await attemptFetch(input, init, timeout)
            if (!response.ok && attempt <= retries) continue
            return response
        } catch (err) {
            if (attempt <= retries) continue
            handleFetchError(err, input.url, timeout)
        }
    }
}
