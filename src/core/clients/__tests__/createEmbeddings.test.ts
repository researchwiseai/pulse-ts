import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { createEmbeddings } from '../createEmbeddings'
import { fetchWithRetry } from '../../../http'
import { PulseAPIError } from '../../../errors'
import { Job } from '../../job'
import type { Auth as AuthType } from '../../../auth/types'
import type { CoreClient } from '../CoreClient'
import { setupPolly } from '../../../../test/setupPolly'
import type { components } from '../../../models'

vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))

// Mock the Job class, including its constructor and methods
vi.mock('../../job', async importOriginal => {
    return {
        ...(await importOriginal<typeof import('../../job')>()),
        Job: vi.fn(function (
            this: Record<string, unknown>,
            options: { jobId: string; baseUrl: string; auth: AuthType },
        ) {
            this.jobId = options.jobId
            this.baseUrl = options.baseUrl
            this.auth = options.auth
            this.result = vi.fn(async () => ({
                embeddings: [{ id: '1', text: 'alpha', vector: [0.1, 0.2] }],
            }))
        }),
    }
})

describe('createEmbeddings', () => {
    setupPolly()

    let client: CoreClient

    beforeEach(() => {
        vi.resetAllMocks()
        client = {
            baseUrl: 'http://api',
            auth: {
                authFlow: vi.fn((req: Request) => ({
                    next: async () => ({ value: req }),
                })),
            },
        } as unknown as CoreClient
    })

    it('throws PulseAPIError on non-ok response', async () => {
        ;(fetchWithRetry as Mock).mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: 'bad' }),
        })
        await expect(createEmbeddings(client, ['input'])).rejects.toBeInstanceOf(PulseAPIError)
    })

    it('returns EmbeddingResponse on 200 ok', async () => {
        const responseBody: components['schemas']['EmbeddingsResponse'] = {
            requestId: 'req-123',
            embeddings: [{ id: '', text: '', vector: [0.3] }],
        }
        ;(fetchWithRetry as Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => responseBody,
        })
        const res = await createEmbeddings(client, ['a'], {})
        expect(res).toEqual(responseBody)
    })

    it('sends x-pulse-debug header when client.debug is true', async () => {
        ;(fetchWithRetry as Mock).mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ requestId: 'r', embeddings: [] }),
        })
        const clientWithDebug = { ...client, debug: true } as unknown as CoreClient
        await createEmbeddings(clientWithDebug, ['a'])
        const req = (fetchWithRetry as Mock).mock.calls[0][0] as Request
        expect(req.headers.get('x-pulse-debug')).toBe('true')
    })

    it('returns awaited job result on 202 when awaitJobResult is not false', async () => {
        const jobId = 'job-123'
        ;(fetchWithRetry as Mock)
            .mockResolvedValueOnce({
                ok: true,
                status: 202,
                json: async () => ({ jobId }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({ status: 'completed', resultUrl: 'http://result' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    embeddings: [{ id: '1', text: 'alpha', vector: [0.1, 0.2] }],
                }),
            })
        const res = await createEmbeddings(client, ['a', 'b'])
        expect(res).toEqual({ embeddings: [{ id: '1', text: 'alpha', vector: [0.1, 0.2] }] })
        expect(Job).toHaveBeenCalledWith({
            after: expect.any(Function),
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
    })

    it('returns Job instance on 202 when awaitJobResult is false', async () => {
        const jobId = 'job-xyz'
        ;(fetchWithRetry as Mock).mockResolvedValueOnce({
            ok: true,
            status: 202,
            json: async () => ({ jobId }),
        })
        const res = await createEmbeddings(client, ['x'], { awaitJobResult: false, fast: false })
        expect(res).toHaveProperty('jobId')
        expect(Job).toHaveBeenCalledWith({
            after: expect.any(Function),
            jobId,
            baseUrl: client.baseUrl,
            auth: client.auth,
        })
    })

    it('accepts snake_case job_id in 202 response', async () => {
        const jobId = 'job-snake'
        ;(fetchWithRetry as Mock).mockResolvedValueOnce({
            ok: true,
            status: 202,
            json: async () => ({ job_id: jobId }),
        })
        const res = await createEmbeddings(client, ['x'], { awaitJobResult: false, fast: false })
        expect(res).toHaveProperty('jobId', jobId)
        expect(Job).toHaveBeenCalledWith(expect.objectContaining({ jobId }))
    })
})
