import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { analyzeSentiment } from '../analyzeSentiment'
import { PulseAPIError } from '../../../errors'
import { Job } from '../../job'
import { fetchWithRetry } from '../../../http'
import { setupPolly } from '../../../../test/setupPolly'
import type { components } from '../../../models'

const fetchWithRetryMock = fetchWithRetry as unknown as MockedFunction<typeof fetchWithRetry>

// Mocks
vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))

const mockAuthFlow = (authedRequest: Request) => ({
    next: () => ({ value: authedRequest }),
})

const baseUrl = 'https://api.example.com'
const mockAuth = { authFlow: vi.fn() }
const client = { baseUrl, auth: mockAuth } as any

const inputs = ['I love this!', 'I hate that.']

describe('analyzeSentiment', () => {
    setupPolly()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns SentimentResponse on 200', async () => {
        const responseJson: components['schemas']['SentimentResponse'] = {
            requestId: 'req-123',
            results: [
                { sentiment: 'positive', confidence: 0.95 },
                { sentiment: 'negative', confidence: 0.9 },
            ],
        }
        const fakeResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(responseJson),
        }
        fetchWithRetryMock.mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const result = await analyzeSentiment(client, inputs, {})
        expect(result).toEqual(responseJson)
        expect(fetchWithRetry).toHaveBeenCalled()
    })

    it('throws PulseAPIError on non-2xx response', async () => {
        const errorJson = { error: 'Bad Request' }
        const fakeResponse = {
            ok: false,
            status: 400,
            json: vi.fn().mockResolvedValue(errorJson),
        }
        fetchWithRetryMock.mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        await expect(analyzeSentiment(client, inputs, {})).rejects.toBeInstanceOf(PulseAPIError)
    })

    it('returns Job if status is 202 and awaitJobResult is false', async () => {
        const jobId = 'job-123'
        const fakeResponse = {
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId }),
        }
        fetchWithRetryMock.mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const result = await analyzeSentiment(client, inputs, { awaitJobResult: false })
        expect(result).toBeInstanceOf(Job)
        expect(result.jobId).toBe(jobId)
    })

    it('awaits job.result() if status is 202 and awaitJobResult is true', async () => {
        const jobId = 'job-456'
        const fakeResponse = {
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId }),
        }
        fetchWithRetryMock.mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        // Mock Job.prototype.result
        const jobResult: components['schemas']['SentimentResponse'] = {
            requestId: 'req-456',
            results: [{ sentiment: 'neutral', confidence: 0.5 }],
        }
        const jobResultSpy = vi.spyOn(Job.prototype, 'result').mockResolvedValue(jobResult)

        const result = await analyzeSentiment(client, inputs, { awaitJobResult: true })
        expect(jobResultSpy).toHaveBeenCalled()
        expect(result).toEqual(jobResult)

        jobResultSpy.mockRestore()
    })

    it('awaits job.result() if status is 202 and awaitJobResult is omitted', async () => {
        const jobId = 'job-789'
        const fakeResponse = {
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId }),
        }
        fetchWithRetryMock.mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const jobResult: components['schemas']['SentimentResponse'] = {
            requestId: 'req-789',
            results: [{ sentiment: 'neutral', confidence: 0.5 }],
        }
        const jobResultSpy = vi.spyOn(Job.prototype, 'result').mockResolvedValue(jobResult)

        const result = await analyzeSentiment(client, inputs)
        expect(jobResultSpy).toHaveBeenCalled()
        expect(result).toEqual(jobResult)

        jobResultSpy.mockRestore()
    })
})
