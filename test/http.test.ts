import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithRetry } from '../src/http'
import { setupPolly } from './setupPolly'

setupPolly()

describe('fetchWithRetry happy path', () => {
    it('returns response on first attempt when ok', async () => {
        const resp = { ok: true, status: 200 }
        const fetchMock = vi.fn().mockResolvedValue(resp)
        vi.stubGlobal('fetch', fetchMock)
        const url = 'http://example.com'
        const response = await fetchWithRetry(url, { retries: 2 })
        expect(response.ok).toBe(true)
        expect(response.status).toBe(200)
    })
})

describe('fetchWithRetry error scenarios', () => {
    const url = 'http://example.com'

    beforeEach(() => {
        vi.useRealTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('retries on network error then succeeds', async () => {
        const resp = { ok: true, status: 200 }
        const fetchMock = vi.fn().mockRejectedValueOnce(new Error('fail')).mockResolvedValue(resp)
        vi.stubGlobal('fetch', fetchMock)
        const result = await fetchWithRetry(url, { retries: 1 })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(result).toBe(resp)
    })

    it('retries on non-ok response then succeeds', async () => {
        const bad = { ok: false, status: 500 }
        const good = { ok: true, status: 200 }
        const fetchMock = vi.fn().mockResolvedValueOnce(bad).mockResolvedValue(good)
        vi.stubGlobal('fetch', fetchMock)
        const result = await fetchWithRetry(url, { retries: 1 })
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(result).toBe(good)
    })

    it('returns last response when retries exhausted', async () => {
        const bad = { ok: false, status: 500 }
        const fetchMock = vi.fn().mockResolvedValue(bad)
        vi.stubGlobal('fetch', fetchMock)
        const result = await fetchWithRetry(url, { retries: 0 })
        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(result).toBe(bad)
    })

    it('times out requests after the given timeout', async () => {
        const fetchMock = vi.fn(
            (_: unknown, { signal }: { signal: AbortSignal }) =>
                new Promise((resolve, reject) => {
                    setTimeout(() => resolve({ ok: true, status: 200 }), 3000)
                    signal.addEventListener('abort', () => reject(new Error('Request aborted')))
                })
        )
        vi.stubGlobal('fetch', fetchMock)
        const promise = fetchWithRetry(url, { timeout: 10, retries: 0 })
        await expect(promise).rejects.toThrow()
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})
