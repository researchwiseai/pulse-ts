import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CoreClient } from '../src/core/client'
import * as http from '../src/http'
import { PulseAPIError } from '../src/errors'

const dummyAuth = {
    authFlow: async function* (req: Request) {
        yield req
    },
}

describe('CoreClient', () => {
    const baseUrl = 'http://api'
    let client: CoreClient

    beforeEach(() => {
        client = new CoreClient({ baseUrl, auth: dummyAuth })
        vi.restoreAllMocks()
    })

    it('create_embeddings returns data on success', async () => {
        const body = { requestId: 'r', embeddings: [{ vector: [0.1], text: 't' }] }
        const spy = vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => body,
        } as any)
        const resp = await client.create_embeddings(['a', 'b'], false)
        expect(spy).toHaveBeenCalled()
        expect(resp).toEqual(body)
    })

    it('create_embeddings throws PulseAPIError on failure', async () => {
        const errBody = { error: 'bad' }
        vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
            ok: false,
            status: 400,
            statusText: 'Bad',
            json: async () => errBody,
        } as any)
        await expect(client.create_embeddings(['x'], true)).rejects.toBeInstanceOf(PulseAPIError)
    })

    it('compare_similarity returns data when fast', async () => {
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
        } as any)
        const resp = await client.compare_similarity(['x'], true, false)
        expect(resp).toEqual(body)
    })

    it('generate_themes returns data when fast', async () => {
        const body = { requestId: 'r', themes: [] }
        vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => body,
        } as any)
        const resp = await client.generate_themes(['a'], 1, 2, true)
        expect(resp).toEqual(body)
    })

    it('analyze_sentiment returns data when fast', async () => {
        const body = { requestId: 'r', results: [] }
        vi.spyOn(http, 'fetchWithRetry').mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => body,
        } as any)
        const resp = await client.analyze_sentiment(['a'], true)
        expect(resp).toEqual(body)
    })
})
