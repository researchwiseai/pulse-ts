if (typeof window === 'undefined' && process.env.DEBUG_PROXY) {
    await import('undici').then(({ setGlobalDispatcher, ProxyAgent }) => {
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

export async function fetchWithRetry(
    input: Request,
    options: FetchOptions = {},
): Promise<Response> {
    const { timeout = 30000, retries = 1, ...init } = options
    let attempt = 0
    while (true) {
        attempt++
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeout)
        try {
            const authorization = input.headers?.get('authorization')
            const response = await fetch(input, {
                ...init,
                headers: {
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
            throw err
        }
    }
}
