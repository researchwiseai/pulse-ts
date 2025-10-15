import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { generateDataDictionary } from '../generateDataDictionary'
import type { CoreClient } from '../CoreClient'
import { PulseAPIError } from '../../../errors'
import { Job } from '../../job'
import { fetchWithRetry } from '../../../http'
import { setupPolly } from '../../../../test/setupPolly'
import type { components } from '../../../models'

vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))

const mockAuthFlow = (authedRequest: Request) => ({
    next: () => ({ value: authedRequest }),
})

const baseUrl = 'https://api.example.com'
const mockAuth = { authFlow: vi.fn() }
const client = { baseUrl, auth: mockAuth } as unknown as CoreClient

const sampleData = [
    ['Name', 'Age', 'City', 'Satisfaction'],
    ['John Doe', '25', 'New York', 'Very Satisfied'],
    ['Jane Smith', '30', 'Los Angeles', 'Satisfied'],
    ['Bob Johnson', '35', 'Chicago', 'Neutral'],
]

describe('generateDataDictionary', () => {
    setupPolly()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns DataDictionaryResponse on 200', async () => {
        const responseJson: components['schemas']['DataDictionaryResponse'] = {
            requestId: 'req-123',
            profileVersion: '0.1',
            profileName: 'DDI Profile',
            codebook: {
                title: 'Test Codebook',
                description: 'Test description',
                creationDate: '2024-01-01',
                language: 'en',
                generationMethod: 'AI-assisted',
                variables: [],
                valueDomains: [],
                categories: [],
            },
        }
        const fakeResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(responseJson),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const result = await generateDataDictionary(client, sampleData, {})
        expect(result).toEqual(responseJson)
        expect(fetchWithRetry).toHaveBeenCalled()
    })

    it('sends data and fast=false in the request body with minimal options', async () => {
        const fakeResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                requestId: 'r',
                profileVersion: '0.1',
                profileName: 'DDI Profile',
                codebook: { variables: [] },
            }),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        await generateDataDictionary(client, sampleData, {})

        const init = (fetchWithRetry as Mock).mock.calls[0][1]
        const payload = JSON.parse(init.body as string)
        expect(payload).toEqual({
            data: sampleData,
            fast: false,
        })
    })

    it('sends all optional metadata in the request body when provided', async () => {
        const fakeResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                requestId: 'r',
                profileVersion: '0.1',
                profileName: 'DDI Profile',
                codebook: { variables: [] },
            }),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        await generateDataDictionary(client, sampleData, {
            title: 'Customer Survey',
            description: 'Survey responses from Q1 2024',
            context: 'Annual customer satisfaction survey',
            language: 'es',
        })

        const init = (fetchWithRetry as Mock).mock.calls[0][1]
        const payload = JSON.parse(init.body as string)
        expect(payload).toEqual({
            data: sampleData,
            fast: false,
            options: {
                title: 'Customer Survey',
                description: 'Survey responses from Q1 2024',
                context: 'Annual customer satisfaction survey',
                language: 'es',
            },
        })
    })

    it('defaults language to "en" when other options are provided but language is omitted', async () => {
        const fakeResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                requestId: 'r',
                profileVersion: '0.1',
                profileName: 'DDI Profile',
                codebook: { variables: [] },
            }),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        await generateDataDictionary(client, sampleData, {
            title: 'Test Title',
        })

        const init = (fetchWithRetry as Mock).mock.calls[0][1]
        const payload = JSON.parse(init.body as string)
        expect(payload.options).toEqual({
            title: 'Test Title',
            language: 'en',
        })
    })

    it('throws error when fast=true is specified', async () => {
        await expect(generateDataDictionary(client, sampleData, { fast: true })).rejects.toThrow(
            'Data dictionary generation only supports asynchronous mode (fast=false or omitted)',
        )

        // Verify that no API call was made
        expect(fetchWithRetry).not.toHaveBeenCalled()
    })

    it('throws PulseAPIError on non-2xx response', async () => {
        const errorJson = { error: 'Bad Request', message: 'Data exceeds maximum size' }
        const fakeResponse = {
            ok: false,
            status: 400,
            json: vi.fn().mockResolvedValue(errorJson),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        await expect(generateDataDictionary(client, sampleData, {})).rejects.toBeInstanceOf(
            PulseAPIError,
        )
    })

    it('returns Job if status is 202 and awaitJobResult is false', async () => {
        const jobId = 'job-123'
        const fakeResponse = {
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId }),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const result = await generateDataDictionary(client, sampleData, { awaitJobResult: false })
        expect(result).toBeInstanceOf(Job)
        expect(result.jobId).toBe(jobId)
    })

    it('accepts snake_case job_id in 202 response', async () => {
        const jobId = 'job-snake'
        const fakeResponse = {
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ job_id: jobId }),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const result = await generateDataDictionary(client, sampleData, { awaitJobResult: false })
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
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        // Mock Job.prototype.result
        const jobResult: components['schemas']['DataDictionaryResponse'] = {
            requestId: 'req-456',
            profileVersion: '0.1',
            profileName: 'DDI Profile',
            codebook: {
                title: 'Job Result',
                description: 'Job result description',
                creationDate: '2024-01-01',
                language: 'en',
                generationMethod: 'AI-assisted',
                variables: [],
            },
        }
        const jobResultSpy = vi.spyOn(Job.prototype, 'result').mockResolvedValue(jobResult)

        const result = await generateDataDictionary(client, sampleData, { awaitJobResult: true })
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
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        const jobResult: components['schemas']['DataDictionaryResponse'] = {
            requestId: 'req-789',
            profileVersion: '0.1',
            profileName: 'DDI Profile',
            codebook: {
                title: 'Default Job Result',
                description: 'Default job result description',
                creationDate: '2024-01-01',
                language: 'en',
                generationMethod: 'AI-assisted',
                variables: [],
            },
        }
        const jobResultSpy = vi.spyOn(Job.prototype, 'result').mockResolvedValue(jobResult)

        const result = await generateDataDictionary(client, sampleData)
        expect(jobResultSpy).toHaveBeenCalled()
        expect(result).toEqual(jobResult)

        jobResultSpy.mockRestore()
    })

    it('constructs proper request with correct endpoint and method', async () => {
        const fakeResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                requestId: 'r',
                profileVersion: '0.1',
                profileName: 'DDI Profile',
                codebook: { variables: [] },
            }),
        }
        ;(fetchWithRetry as Mock).mockResolvedValue(fakeResponse as unknown as Response)
        mockAuth.authFlow.mockImplementation((req: Request) => mockAuthFlow(req))

        await generateDataDictionary(client, sampleData, {})

        const requestArg = (fetchWithRetry as Mock).mock.calls[0][0] as Request
        const init = (fetchWithRetry as Mock).mock.calls[0][1]

        expect(requestArg.url).toBe(`${baseUrl}/data-dictionary`)
        expect(init.method).toBe('POST')
        expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    })
})
