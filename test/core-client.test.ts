import { describe, it, expect, beforeEach, vi, afterAll, beforeAll } from 'vitest'
import { CoreClient } from '../src/core/clients/CoreClient'
import * as http from '../src/http'
import { PulseAPIError, TimeoutError } from '../src/errors'
import { setupPolly } from './setupPolly'
import { Auth } from '../src/auth'

const dummyAuth: Auth.Auth = {
    authFlow: async function* (req: Request) {
        yield req
        return req
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

    afterAll(() => {
        vi.clearAllMocks()
        vi.resetModules()
        vi.resetAllMocks()
        vi.clearAllTimers()
        vi.useRealTimers()
    })

    describe('createEmbeddings', () => {
        describe('fast', () => {
            it('returns data on success', async () => {
                const body = { requestId: 'r', embeddings: [{ vector: [0.1], text: 't' }] }
                const spy = vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
                    ok: true,
                    status: 200,
                    json: async () => body,
                } as unknown as Response)
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
                } as unknown as Response)
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
                    } as Response)
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        json: async () => ({ status: 'pending' }),
                    } as Response)
                    .mockResolvedValueOnce({
                        ok: true,
                        status: 200,
                        json: async () => ({ status: 'completed', resultUrl: 'http://result' }),
                    } as Response)
                    .mockResolvedValue({
                        ok: true,
                        status: 200,
                        json: async () => body,
                    } as Response)
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
                } as unknown as Response)
                await expect(client.createEmbeddings(['x'])).rejects.toBeInstanceOf(PulseAPIError)
            })

            it('propagates network errors', async () => {
                const err = new TimeoutError('http://x', 1000)
                vi.spyOn(http, 'fetchWithRetry').mockRejectedValue(err)
                await expect(client.createEmbeddings(['x'])).rejects.toBe(err)
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
                    } as Response)
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
                    } as Response)
                    const resp = await client.compareSimilarity({ set: ['x'] }, { fast: true })
                    expect(spy).toHaveBeenCalled()
                    const [request] = spy.mock.calls[0] ?? [undefined]
                    if (request === undefined) {
                        expect(request).toBeDefined()
                    } else {
                        const outbound = request as Request
                        const requestBody = await outbound.json()
                        expect(requestBody).toStrictEqual({
                            set: ['x'],
                            fast: true,
                        })

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
        } as unknown as Response)
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
        } as unknown as Response)
        const resp = await client.analyzeSentiment(['a'], { fast: true })
        expect(resp).toEqual(body)
    })
})

describe('integration tests', { skip: !process.env.PULSE_CLIENT_SECRET }, () => {
    setupPolly()

    let client: CoreClient

    beforeAll(() => {
        client = new CoreClient({
            baseUrl: process.env.PULSE_BASE_URL ?? 'https://staging.pulse.researchwiseai.com/v1',
            auth: new Auth.ClientCredentialsAuth({
                clientId: process.env.PULSE_CLIENT_ID ?? '',
                clientSecret: process.env.PULSE_CLIENT_SECRET ?? '',
                tokenUrl: process.env.PULSE_TOKEN_URL ?? '',
                audience: process.env.PULSE_AUDIENCE ?? '',
            }),
        })
    })

    it('createEmbeddings returns data', async () => {
        const resp = await client.createEmbeddings(['test'], { fast: true })
        expect(resp).toBeDefined()
        expect(resp.embeddings.length).toBe(1)
        expect(resp.embeddings[0].vector.length).toBeGreaterThan(0)
    })

    it('compareSimilarity returns flattened data when doing self', async () => {
        const resp = await client.compareSimilarity({ set: ['test1', 'test2'] }, { fast: true })
        expect(resp).toBeDefined()
        expect(resp.matrix).not.toBeDefined()
        expect(resp.flattened.length).toBe(1)
    })
    it('compareSimilarity returns flattened and matrix data when doing a cross', async () => {
        const resp = await client.compareSimilarity(
            { setA: ['test1', 'test2'], setB: ['testAlpha', 'testBravo'] },
            { fast: true },
        )
        expect(resp).toBeDefined()
        expect(resp.matrix!.length).toBe(2)
        expect(resp.flattened.length).toBe(4)
    })
    it('generateThemes returns data', { timeout: 10000 }, async () => {
        const resp = await client.generateThemes(
            ['apple', 'orange', 'banana', 'gold', 'silver', 'bronze'],
            {
                fast: true,
                minThemes: 1,
                maxThemes: 2,
            },
        )
        expect(resp).toBeDefined()
        expect(resp.themes.length).toBeGreaterThan(0)
    })
    it('analyzeSentiment returns data', { timeout: 20_000 }, async () => {
        const resp = await client.analyzeSentiment(['test'], { fast: true })
        expect(resp).toBeDefined()
        expect(resp.results.length).toBe(1)
    })
})
