import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { extractElements } from '../extractElements'
import type { CoreClient } from '../CoreClient'
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
            this.result = vi.fn()
        }),
    }
})

const fetchMock = fetchWithRetry as unknown as Mock

function makeClient(): CoreClient {
    return {
        baseUrl: 'http://api.test',
        auth: {
            authFlow: vi.fn(() => ({
                next: async () => ({ value: new Request('http://api.test/extractions') }),
            })),
        },
    } as unknown as CoreClient
}

describe('extractElements', () => {
    setupPolly()

    let client: CoreClient

    beforeEach(() => {
        vi.clearAllMocks()
        client = makeClient()
    })

    it('returns ExtractionsResponse on 200', async () => {
        const resp: components['schemas']['ExtractionsResponse'] = {
            dictionary: ['term1'],
            results: [[['match1']]],
            requestId: 'req',
        }
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(resp),
        })

        const result = await extractElements(
            client,
            { texts: ['t'], dictionary: ['term1'] },
            { fast: true },
        )

        expect(result).toEqual(resp)
        const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
        expect(body.fast).toBe(true)
    })

    it('returns Job when 202 and awaitJobResult is false', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            status: 202,
            json: vi.fn().mockResolvedValue({ jobId: 'job123' }),
        })
        const fakeJob = {
            jobId: 'job123',
            baseUrl: client.baseUrl,
            auth: client.auth,
            result: vi.fn(),
        }
        ;(Job as unknown as Mock).mockImplementation(() => fakeJob)

        const result = await extractElements(
            client,
            { texts: ['a'], dictionary: ['term1'] },
            { fast: false, awaitJobResult: false },
        )

        expect(result).toBe(fakeJob)
        expect(Job).toHaveBeenCalledWith({
            after: expect.any(Function),
            jobId: 'job123',
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
    })
})
