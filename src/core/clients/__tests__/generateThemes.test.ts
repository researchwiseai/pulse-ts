import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { generateThemes } from '../generateThemes'
import type { CoreClient } from '../CoreClient'
import { PulseAPIError } from '../../../errors'
import { fetchWithRetry } from '../../../http'
import { Job } from '../../job'
import { setupPolly } from '../../../../test/setupPolly'
import type { ThemesResponse } from '../../../models'

vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))
vi.mock('../../job', () => ({
    Job: vi.fn(),
}))

// Mock the Job class, including its constructor and methods
vi.mock('../../job', async importOriginal => {
    return {
        ...(await importOriginal<typeof import('../../job')>()),
        Job: vi.fn(function (this: any, options: any) {
            this.jobId = options.jobId
            this.baseUrl = options.baseUrl
            this.auth = options.auth
            this.result = vi.fn(
                async () =>
                    ({
                        themes: [],
                        requestId: 'req-123',
                    }) satisfies ThemesResponse,
            )
        }),
    }
})

describe('generateThemes', () => {
    setupPolly()

    const fakeReq = {} as Request
    const fakeAuthFlow = vi.fn().mockReturnValue({
        next: () => Promise.resolve({ value: fakeReq }),
    })

    const baseClient: CoreClient = {
        baseUrl: 'http://api.test',
        auth: {
            authFlow: fakeAuthFlow,
        },
    } as any

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns ThemesResponse on 200 OK', async () => {
        const mockJson = { themes: ['theme1', 'theme2'] }
        ;(fetchWithRetry as Mock).mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(mockJson),
        })

        const result = await generateThemes(baseClient, ['inputA', 'inputB'], {
            fast: true,
            minThemes: 1,
            maxThemes: 5,
        })

        expect(result).toEqual(mockJson)
        // Verify payload
        const initArg = (fetchWithRetry as Mock).mock.calls[0][1]
        expect(JSON.parse(initArg.body as string)).toEqual({
            inputs: ['inputA', 'inputB'],
            fast: true,
            minThemes: 1,
            maxThemes: 5,
        })
        expect(initArg.method).toBe('POST')
        expect(initArg.headers).toEqual({ 'Content-Type': 'application/json' })
    })

    it('returns a Job when status is 202 and awaitJobResult is false', async () => {
        const fakeJobInstance = {}
        ;(fetchWithRetry as Mock).mockResolvedValue({
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId: 'job-123' }),
        })
        ;(Job as unknown as Mock).mockImplementation(() => fakeJobInstance)

        const result = await generateThemes(baseClient, ['input'], { awaitJobResult: false })
        expect(result).toBe(fakeJobInstance)
        expect(Job).toHaveBeenCalledWith({
            after: expect.any(Function),
            jobId: 'job-123',
            baseUrl: baseClient.baseUrl,
            auth: baseClient.auth,
        })
    })

    it('awaits job.result() when awaitJobResult is true', async () => {
        const fakeResult = { themes: ['x'] }
        const fakeJob = { result: vi.fn().mockResolvedValue(fakeResult) }
        ;(fetchWithRetry as Mock).mockResolvedValue({
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId: 'job-xyz' }),
        })
        ;(Job as unknown as Mock).mockImplementation(() => fakeJob)

        const result = await generateThemes(baseClient, ['foo'], { awaitJobResult: true })
        expect(result).toEqual(fakeResult)
        expect(fakeJob.result).toHaveBeenCalled()
    })

    it('throws PulseAPIError on non-ok response', async () => {
        const errorPayload = { message: 'Bad request' }
        ;(fetchWithRetry as Mock).mockResolvedValue({
            ok: false,
            status: 400,
            json: vi.fn().mockResolvedValue(errorPayload),
        })

        await expect(generateThemes(baseClient, ['bad'])).rejects.toBeInstanceOf(PulseAPIError)
    })
})
