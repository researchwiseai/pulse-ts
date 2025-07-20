import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { compareSimilarity, type CompareSimilarityInputs } from '../compareSimilarity'
import type { SimilarityResponse } from '../compareSimilarity'
import type { CoreClient } from '../CoreClient'
import { PulseAPIError } from '../../../errors'
import { Job } from '../../job'
import { fetchWithRetry } from '../../../http'
import { unflatten } from '../../../matrix'
import { setupPolly } from '../../../../test/setupPolly'

const fetchWithRetryMock = fetchWithRetry as unknown as MockedFunction<typeof fetchWithRetry>

// Mocks
vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))
vi.mock('../../../matrix', () => ({
    unflatten: vi.fn((flattened: number[], [n]: [number]) => {
        // Simple reshape for test
        const matrix: number[][] = []
        for (let i = 0; i < flattened.length; i += n) {
            matrix.push(flattened.slice(i, i + n))
        }
        return matrix
    }),
}))

function mockCoreClient() {
    return {
        baseUrl: 'https://api.test',
        auth: {
            authFlow: vi.fn(() => ({
                next: () => ({
                    value: {
                        url: 'https://api.test/similarity',
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                    },
                }),
            })),
        },
    } as unknown as CoreClient
}

function mockResponse(json: unknown, ok = true, status = 200): Response {
    return {
        ok,
        status,
        json: vi.fn().mockResolvedValue(json),
    } as unknown as Response
}

describe('compareSimilarity', () => {
    setupPolly()

    let client: CoreClient

    beforeEach(() => {
        client = mockCoreClient()
        vi.clearAllMocks()
    })

    it('sends correct payload for self-comparison', async () => {
        const inputs: CompareSimilarityInputs = { set: ['a', 'b'] }
        const responseJson = {
            scenario: 'self',
            matrix: [
                [1, 0.5],
                [0.5, 1],
            ],
            n: 2,
        }
        fetchWithRetryMock.mockResolvedValue(mockResponse(responseJson))

        const result = await compareSimilarity(client, inputs)

        expect(fetchWithRetry).toHaveBeenCalled()
        const req = fetchWithRetryMock.mock.calls[0][0]
        const opts = fetchWithRetryMock.mock.calls[0][1]
        expect(req.url).toBe('https://api.test/similarity')
        expect(JSON.parse(opts?.body as string)).toMatchObject({
            set: ['a', 'b'],
            flatten: false,
        })
        expect(result).toEqual(responseJson)
    })

    it('sends correct payload for cross-comparison', async () => {
        const inputs: CompareSimilarityInputs = { setA: ['a'], setB: ['b'] }
        const responseJson = { scenario: 'cross', matrix: [[0.7]], n: 1 }
        fetchWithRetryMock.mockResolvedValue(mockResponse(responseJson))

        const result = await compareSimilarity(client, inputs)

        expect(fetchWithRetry).toHaveBeenCalled()
        const opts = fetchWithRetryMock.mock.calls[0][1]
        expect(JSON.parse(opts?.body as string)).toMatchObject({
            set_a: ['a'],
            set_b: ['b'],
            flatten: false,
        })
        expect(result).toEqual(responseJson)
    })

    it('throws PulseAPIError on non-ok response', async () => {
        const inputs: CompareSimilarityInputs = { set: ['a'] }
        fetchWithRetryMock.mockResolvedValue(mockResponse({ error: 'fail' }, false, 400))

        await expect(compareSimilarity(client, inputs)).rejects.toBeInstanceOf(PulseAPIError)
    })

    it('returns Job if response is 202 and awaitJobResult is false', async () => {
        const inputs: CompareSimilarityInputs = { set: ['a'] }
        const jobId = 'job-123'
        fetchWithRetryMock.mockResolvedValue(mockResponse({ jobId }, true, 202))

        const result = await compareSimilarity(client, inputs, {
            awaitJobResult: false,
            fast: false,
        })

        expect(result).toBeInstanceOf(Job)
        expect(result.jobId).toBe(jobId)
    })

    it('accepts snake_case job_id in 202 response', async () => {
        const inputs: CompareSimilarityInputs = { set: ['a'] }
        const jobId = 'job-snake'
        fetchWithRetryMock.mockResolvedValue(mockResponse({ job_id: jobId }, true, 202))
        const result = await compareSimilarity(client, inputs, {
            awaitJobResult: false,
            fast: false,
        })
        expect(result).toBeInstanceOf(Job)
        expect(result.jobId).toBe(jobId)
    })

    it('awaits Job result if response is 202 and awaitJobResult is true', async () => {
        const inputs: CompareSimilarityInputs = { set: ['a'] }
        const jobId = 'job-456'
        fetchWithRetryMock.mockResolvedValue(mockResponse({ jobId }, true, 202))

        // Patch Job.prototype.result to resolve to a fake result
        const fakeResult = { scenario: 'self', matrix: [[1]], n: 1 }
        vi.spyOn(Job.prototype, 'result').mockResolvedValue(fakeResult)

        const result = await compareSimilarity(client, inputs, {
            awaitJobResult: true,
            fast: false,
        })

        expect(result).toEqual(fakeResult)
    })

    it('unflattens matrix if not present and scenario is cross', async () => {
        const inputs: CompareSimilarityInputs = { setA: ['a'], setB: ['b'] }
        const responseJson = { scenario: 'cross', flattened: [0.1], n: 1 }
        fetchWithRetryMock.mockResolvedValue(mockResponse(responseJson))

        const result = await compareSimilarity(client, inputs)

        expect(unflatten).toHaveBeenCalledWith([0.1], [1])
        expect(result.matrix).toEqual([[0.1]])
    })

    it('Job after hook unflattens matrix if not present', async () => {
        const inputs: CompareSimilarityInputs = { set: ['a'] }
        const jobId = 'job-789'
        fetchWithRetryMock.mockResolvedValue(mockResponse({ jobId }, true, 202))

        // Patch Job.prototype.result to call after hook
        const jobResp = { scenario: 'cross', flattened: [0.2], n: 1 }
        vi.spyOn(Job.prototype, 'result').mockImplementation(function (this: unknown) {
            // Simulate after hook
            return Promise.resolve(
                (this as { after(r: typeof jobResp): SimilarityResponse }).after(jobResp),
            )
        })

        const result = await compareSimilarity(client, inputs, {
            awaitJobResult: true,
            fast: false,
        })

        expect(unflatten).toHaveBeenCalledWith([0.2], [1])
        expect(result.matrix).toEqual([[0.2]])
    })
})
