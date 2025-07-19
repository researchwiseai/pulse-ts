import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { generateSummary } from '../generateSummary'
import type { CoreClient } from '../CoreClient'
import { PulseAPIError } from '../../../errors'
import { fetchWithRetry } from '../../../http'
import { Job } from '../../job'
import { setupPolly } from '../../../../test/setupPolly'
import type { components } from '../../../models'

vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))

vi.mock('../../job', async importOriginal => {
    return {
        ...(await importOriginal<typeof import('../../job')>()),
        Job: vi.fn(function (
            this: Record<string, unknown>,
            options: { jobId: string; baseUrl: string; auth: unknown },
        ) {
            this.jobId = options.jobId
            this.baseUrl = options.baseUrl
            this.auth = options.auth
            this.result = vi.fn(
                async () =>
                    ({
                        summary: 'x',
                        requestId: 'req',
                    }) as components['schemas']['SummariesResponse'],
            )
        }),
    }
})

const fetchMock = fetchWithRetry as unknown as Mock

describe('generateSummary', () => {
    setupPolly()

    const baseClient: CoreClient = {
        baseUrl: 'http://api.test',
        auth: {
            authFlow: vi.fn(() => ({
                next: async () => ({ value: new Request('http://api.test/summaries') }),
            })),
        },
    } as unknown as CoreClient

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns SummariesResponse on 200', async () => {
        const resp: components['schemas']['SummariesResponse'] = {
            summary: 'ok',
            requestId: 'req-1',
        }
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(resp),
        })
        const result = await generateSummary(baseClient, ['text'], 'question', { fast: true })
        expect(result).toEqual(resp)
        const initArg = fetchMock.mock.calls[0][1]
        expect(JSON.parse(initArg.body as string)).toEqual({
            inputs: ['text'],
            question: 'question',
            fast: true,
        })
    })

    it('returns Job when status 202 and awaitJobResult is false', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId: 'job123' }),
        })
        const fakeJob = {}
        ;(Job as unknown as Mock).mockImplementation(() => fakeJob)
        const result = await generateSummary(baseClient, ['t'], 'q', { awaitJobResult: false })
        expect(result).toBe(fakeJob)
    })

    it('accepts snake_case job_id in 202 response', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ job_id: 'job_snake' }),
        })
        const fakeJob = {}
        ;(Job as unknown as Mock).mockImplementation(() => fakeJob)
        const result = await generateSummary(baseClient, ['t'], 'q', { awaitJobResult: false })
        expect(Job).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job_snake' }))
        expect(result).toBe(fakeJob)
    })

    it('awaits job.result when awaitJobResult is true', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId: 'job' }),
        })
        const jobObj = { result: vi.fn().mockResolvedValue({ summary: 'done', requestId: 'r' }) }
        ;(Job as unknown as Mock).mockImplementation(() => jobObj)
        const result = await generateSummary(baseClient, ['t'], 'q', { awaitJobResult: true })
        expect(jobObj.result).toHaveBeenCalled()
        expect(result).toEqual({ summary: 'done', requestId: 'r' })
    })

    it('throws PulseAPIError on non-ok', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 400,
            json: vi.fn().mockResolvedValue({ error: 'bad' }),
        })
        await expect(generateSummary(baseClient, ['bad'], 'q')).rejects.toBeInstanceOf(
            PulseAPIError,
        )
    })
})
