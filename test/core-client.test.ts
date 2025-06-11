import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CoreClient } from '../src/core/clients/CoreClient'
import * as http from '../src/http'
import { PulseAPIError } from '../src/errors'
import type { Auth } from '../src'

const dummyAuth: Auth = {
    authFlow: async function* (req: Request) {
        yield req
    },
    _refreshToken: () => Promise.resolve(),
    refreshToken: '',
    accessToken: '',
    expiresAt: 0,
}

describe('CoreClient', () => {
    const baseUrl = 'http://api'
    let client: CoreClient

    beforeEach(() => {
        client = new CoreClient({ baseUrl, auth: dummyAuth })
        vi.restoreAllMocks()
    })

    describe('createEmbeddings', () => {
        describe('fast', () => {
            it('returns data on success', async () => {
                const body = { requestId: 'r', embeddings: [{ vector: [0.1], text: 't' }] }
                const spy = vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => body,
                } as any)
                const resp = await client.createEmbeddings(['t'], { fast: true })
                expect(spy).toHaveBeenCalled()
                const [request] = spy.mock.calls[0] ?? [undefined]
                if (request === undefined) {
                    expect(request).toBeDefined()
                } else {
                    const outbound = request as Request
                    const requestBody = await outbound.json()
                    expect(requestBody).toStrictEqual({ inputs: ['t'], fast: true })

                    const requestHeaders = outbound.headers
                    expect(requestHeaders.get('Content-type')).toBe('application/json')
                }

                expect(resp).toEqual(body)
            })
        })

        describe('slow', () => {
            it('passes fast=false', async () => {
                const body = { requestId: 'r', embeddings: [{ vector: [0.1], text: 't' }] }
                const spy = vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
                    ok: true,
                    status: 202,
                    json: async () => body,
                } as any)
                await client.createEmbeddings(['t'], { fast: false, awaitJobResult: false })
                expect(spy).toHaveBeenCalled()
                const [request] = spy.mock.calls[0] ?? [undefined]
                if (request === undefined) {
                    expect(request).toBeDefined()
                } else {
                    const outbound = request as Request
                    const requestBody = await outbound.json()
                    expect(requestBody).toStrictEqual({ inputs: ['t'], fast: false })

                    const requestHeaders = outbound.headers
                    expect(requestHeaders.get('Content-type')).toBe('application/json')
                }
            })

            it('defaults to waiting for the job and returning the result', async () => {
                const featureResponseBody = {
                    requestId: 'r',
                    embeddings: [{ vector: [0.1], text: 't' }],
                }
                const jobPendingResponse = {
                    ok: true,
                    status: 202,
                    json: async () => ({
                        status: 'pending',
                    }),
                } as Response
                const jobCompleteResponse = {
                    ok: true,
                    status: 202,
                    json: async () => ({ status: 'completed', resultUrl: 'http://result' }),
                } as Response
                const httpSpy = vi
                    .spyOn(http, 'fetchWithRetry')
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 202,
                        json: async () => ({ jobId: 'abc' }),
                    } as Response)
                    .mockResolvedValueOnce(jobPendingResponse)
                    .mockResolvedValueOnce(jobPendingResponse)
                    .mockResolvedValueOnce(jobCompleteResponse)
                    .mockResolvedValue({
                        ok: true,
                        status: 200,
                        json: async () => featureResponseBody,
                    } as Response)

                const result = await client.createEmbeddings(['t'], { fast: false })
                expect(httpSpy).toHaveBeenCalledTimes(5)
                expect(result).toEqual(featureResponseBody)
            })

            it('passes fast=false and does not pass awaitJobResult when true', async () => {
                const body = { requestId: 'r', embeddings: [{ vector: [0.1], text: 't' }] }
                const spy = vi
                    .spyOn(http, 'fetchWithRetry')
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 202,
                        json: async () => ({ status: 'pending', jobId: 'abc' }),
                    } as any)
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        json: async () => ({ status: 'pending' }),
                    } as any)
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        json: async () => ({ status: 'completed', resultUrl: 'http://result' }),
                    } as any)
                    .mockResolvedValue({
                        ok: true,
                        status: 200,
                        json: async () => body,
                    } as any)
                await client.createEmbeddings(['t'], { fast: false, awaitJobResult: true })
                expect(spy).toHaveBeenCalled()
                const [request] = spy.mock.calls[0] ?? [undefined]
                if (request === undefined) {
                    expect(request).toBeDefined()
                } else {
                    const outbound = request as Request
                    const requestBody = await outbound.json()
                    expect(requestBody).toStrictEqual({ inputs: ['t'], fast: false })

                    const requestHeaders = outbound.headers
                    expect(requestHeaders.get('Content-type')).toBe('application/json')
                }
            })

            it('passes fast=false and does not pass awaitJobResult when false', async () => {
                const featureResponseBody = {
                    requestId: 'r',
                    embeddings: [{ vector: [0.1], text: 't' }],
                }
                const jobPendingResponse = {
                    ok: true,
                    status: 202,
                    json: async () => ({
                        status: 'pending',
                    }),
                } as Response
                const jobCompleteResponse = {
                    ok: true,
                    status: 202,
                    json: async () => ({ status: 'completed', resultUrl: 'http://result' }),
                } as Response
                const httpSpy = vi
                    .spyOn(http, 'fetchWithRetry')
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 202,
                        json: async () => ({ jobId: 'abc' }),
                    } as Response)
                    .mockResolvedValueOnce(jobPendingResponse)
                    .mockResolvedValueOnce(jobPendingResponse)
                    .mockResolvedValueOnce(jobCompleteResponse)
                    .mockResolvedValue({
                        ok: true,
                        status: 200,
                        json: async () => featureResponseBody,
                    } as Response)
                await client.createEmbeddings(['t'], { fast: false, awaitJobResult: false })
                expect(httpSpy).toHaveBeenCalled()
                const [request] = httpSpy.mock.calls[0] ?? [undefined]
                if (request === undefined) {
                    expect(request).toBeDefined()
                } else {
                    const outbound = request as Request
                    const requestBody = await outbound.json()
                    expect(requestBody).toStrictEqual({ inputs: ['t'], fast: false })

                    const requestHeaders = outbound.headers
                    expect(requestHeaders.get('Content-type')).toBe('application/json')
                }
            })

            it('throws PulseAPIError on failure', async () => {
                const errBody = { error: 'bad' }
                vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
                    ok: false,
                    status: 400,
                    statusText: 'Bad Request',
                    json: async () => errBody,
                } as any)
                await expect(client.createEmbeddings(['x'])).rejects.toBeInstanceOf(PulseAPIError)
            })
        })
    })

    describe('compareSimilarity', () => {
        describe('self', () => {
            describe('fast', () => {
                it('returns data when fast', async () => {
                    const body = {
                        requestId: 'r',
                        matrix: [[1]],
                        flattened: [1],
                        similarity: [[1]],
                        scenario: 'self',
                        mode: 'matrix',
                        n: 1,
                    }
                    vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
                        ok: true,
                        status: 200,
                        json: async () => body,
                    } as any)
                    const resp = await client.compareSimilarity({ set: ['x'] }, { fast: true })
                    expect(resp).toEqual(body)
                })

                it('passes fast=true', async () => {
                    const body = {
                        requestId: 'r',
                        matrix: [[1]],
                        flattened: [1],
                        similarity: [[1]],
                        scenario: 'self',
                        mode: 'matrix',
                        n: 1,
                    }
                    const spy = vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
                        ok: true,
                        status: 200,
                        json: async () => body,
                    } as any)
                    const resp = await client.compareSimilarity({ set: ['x'] }, { fast: true })
                    expect(spy).toHaveBeenCalled()
                    const [request] = spy.mock.calls[0] ?? [undefined]
                    if (request === undefined) {
                        expect(request).toBeDefined()
                    } else {
                        const outbound = request as Request
                        const requestBody = await outbound.json()
                        expect(requestBody).toStrictEqual({ set: ['x'], fast: true, flatten: true })

                        const requestHeaders = outbound.headers
                        expect(requestHeaders.get('Content-type')).toBe('application/json')
                    }

                    expect(resp).toEqual(body)
                })
            })
        })
    })

    it('generate_themes returns data when fast', async () => {
        const body = { requestId: 'r', themes: [] }
        vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => body,
        } as any)
        const resp = await client.generateThemes(['a'], {
            fast: true,
            minThemes: 1,
            maxThemes: 2,
        })
        expect(resp).toEqual(body)
    })

    it('analyze_sentiment returns data when fast', async () => {
        const body = { requestId: 'r', results: [] }
        vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => body,
        } as any)
        const resp = await client.analyzeSentiment(['a'], { fast: true })
        expect(resp).toEqual(body)
    })
})
