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

export async function fetchWithRetry(
    input: Request,
    options: FetchOptions = {},
): Promise<Response> {
    const { timeout = 30000, retries = 1, ...init } = options
    const baseRequest = input
    let attempt = 0
    while (true) {
        attempt++
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeout)
        const request = new Request(baseRequest)
        try {
            const authorization = request.headers.get('authorization')
            const headerObj: Record<string, string> = {}
            request.headers.forEach((v, k) => {
                headerObj[k] = v
            })
            const response = await fetch(request, {
                ...init,
                headers: {
                    ...headerObj,
                    ...init.headers,
                    ...(authorization ? { authorization } : {}),
                },
                signal: controller.signal,
            })
            clearTimeout(timer)
            if (!response.ok && attempt <= retries) {
                continue
            }
            return response
        } catch (err) {
            clearTimeout(timer)
            if (attempt <= retries) {
                continue
            }
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw new TimeoutError(request.url, timeout)
            }
            if (err instanceof TypeError) {
                throw new NetworkError(request.url, err)
            }
            throw err
        }
    }
}
