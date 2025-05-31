export interface FetchOptions extends RequestInit {
  /** Maximum time (ms) to wait before aborting the request */
  timeout?: number;
  /** Number of retry attempts on network or non-OK responses */
  retries?: number;
}

export async function fetchWithRetry(
  input: RequestInfo,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeout = 30000, retries = 1, ...init } = options;
  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok && attempt <= retries) {
        continue;
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      if (attempt <= retries) {
        continue;
      }
      throw err;
    }
  }
}