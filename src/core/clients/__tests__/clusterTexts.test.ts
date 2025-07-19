import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { clusterTexts, type ClusterTextsInputs } from '../clusterTexts'
import type { CoreClient } from '../CoreClient'
import { PulseAPIError } from '../../../errors'
import { Job } from '../../job'
import { fetchWithRetry } from '../../../http'
import { setupPolly } from '../../../../test/setupPolly'
import type { components } from '../../../models'

vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))

// Mock the Job class similar to other tests
vi.mock('../../job', async importOriginal => {
    return {
        ...(await importOriginal<typeof import('../../job')>()),
        Job: vi.fn(function (this: Record<string, unknown>, options: { jobId: string; baseUrl: string; auth: unknown }) {
            this.jobId = options.jobId
            this.baseUrl = options.baseUrl
            this.auth = options.auth
            this.result = vi.fn()
        }),
    }
})

const fetchMock = fetchWithRetry as unknown as Mock

function mockCoreClient(): CoreClient {
    return {
        baseUrl: 'https://api.test',
        auth: {
            authFlow: vi.fn(() => ({
                next: async () => ({ value: new Request('https://api.test/clustering') }),
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

describe('clusterTexts', () => {
    setupPolly()

    let client: CoreClient

    beforeEach(() => {
        client = mockCoreClient()
        vi.clearAllMocks()
    })

    it('sends correct payload', async () => {
        const inputs: ClusterTextsInputs = { inputs: ['a', 'b'], k: 2 }
        const responseJson: components['schemas']['ClusteringResponse'] = {
            algorithm: 'kmeans',
            clusters: [],
            requestId: 'req-1',
        }
        fetchMock.mockResolvedValue(mockResponse(responseJson))

        const result = await clusterTexts(client, inputs)

        expect(result).toEqual(responseJson)
        const req = fetchMock.mock.calls[0][0]
        const init = fetchMock.mock.calls[0][1]
        expect(req.url).toBe('https://api.test/clustering')
        expect(JSON.parse(init?.body as string)).toEqual({ inputs: ['a', 'b'], k: 2 })
        expect(init?.method).toBe('POST')
    })

    it('returns Job when status is 202 and awaitJobResult is false', async () => {
        const jobId = 'job-123'
        fetchMock.mockResolvedValue(mockResponse({ jobId }, true, 202))
        const jobInstance = {}
        ;(Job as unknown as Mock).mockImplementation(
            () => jobInstance as unknown as InstanceType<typeof Job>,
        )

        const result = await clusterTexts(
            client,
            { inputs: ['x', 'y'], k: 2 },
            { awaitJobResult: false },
        )

        expect(result).toBe(jobInstance)
        expect(Job).toHaveBeenCalledWith({
            after: expect.any(Function),
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
    })

    it('accepts snake_case job_id in 202 response', async () => {
        const jobId = 'job-snake'
        fetchMock.mockResolvedValue(mockResponse({ job_id: jobId }, true, 202))
        const jobInstance = {}
        ;(Job as unknown as Mock).mockImplementation(
            () => jobInstance as unknown as InstanceType<typeof Job>,
        )

        const result = await clusterTexts(
            client,
            { inputs: ['x', 'y'], k: 2 },
            { awaitJobResult: false },
        )

        expect(result).toBe(jobInstance)
        expect(Job).toHaveBeenCalledWith(expect.objectContaining({ jobId }))
    })

    it('awaits job.result when awaitJobResult is true', async () => {
        const jobId = 'job-456'
        fetchMock.mockResolvedValue(mockResponse({ jobId }, true, 202))
        const jobResult: components['schemas']['ClusteringResponse'] = {
            algorithm: 'kmeans',
            clusters: [],
            requestId: 'req-2',
        }
        const jobObj = { result: vi.fn().mockResolvedValue(jobResult) }
        ;(Job as unknown as Mock).mockImplementation(
            () => jobObj as unknown as InstanceType<typeof Job>,
        )

        const result = await clusterTexts(
            client,
            { inputs: ['a', 'b'], k: 2 },
            { awaitJobResult: true },
        )

        expect(jobObj.result).toHaveBeenCalled()
        expect(result).toEqual(jobResult)
    })

    it('throws PulseAPIError on non-ok response', async () => {
        fetchMock.mockResolvedValue(mockResponse({ error: 'bad' }, false, 400))

        await expect(clusterTexts(client, { inputs: ['a', 'b'], k: 2 })).rejects.toBeInstanceOf(
            PulseAPIError,
        )
    })
})
