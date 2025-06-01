import { describe, it, expect, vi } from 'vitest'
import { Job } from '../src/core/job'
import * as http from '../src/http'

describe('Job.result', () => {
    const dummyAuth = {
        authFlow: async function* (req: Request) {
            yield req
        },
    }

    it('resolves with result when job completes immediately', async () => {
        const info = { status: 'completed', resultUrl: 'http://result' }
        const infoRes = { ok: true, status: 200, json: async () => info } as any
        const resultBody = { foo: 'bar' }
        const resultRes = { ok: true, status: 200, json: async () => resultBody } as any
        const spy = vi.spyOn(http, 'fetchWithRetry')
        spy.mockResolvedValueOnce(infoRes).mockResolvedValueOnce(resultRes)
        const job = new Job('id', 'http://base', dummyAuth, 0)
        const result = await job.result()
        expect(result).toEqual(resultBody)
        expect(spy).toHaveBeenCalledTimes(2)
    })

    it('throws when job fails', async () => {
        const infoRes = { ok: true, status: 200, json: async () => ({ status: 'failed' }) } as any
        vi.spyOn(http, 'fetchWithRetry').mockResolvedValueOnce(infoRes)
        const job = new Job('failId', 'http://base', dummyAuth, 0)
        await expect(job.result()).rejects.toThrow('Job failId failed')
    })
})
