import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { extractElements } from '../extractElements'
import type { CoreClient } from '../CoreClient'
import { fetchWithRetry } from '../../../http'
import { setupPolly } from '../../../../test/setupPolly'
import type { components } from '../../../models'

vi.mock('../../../http', () => ({
    fetchWithRetry: vi.fn(),
}))

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
            dictionary: ['service'],
            results: [[['service'], ['service was slow']]],
        }
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue(resp),
        })

        const result = await extractElements(client, {
            inputs: ['t'],
            category: 'service',
            dictionary: ['service'],
        })

        expect(result).toEqual(resp)
        const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)
        expect(body).toEqual({
            inputs: ['t'],
            category: 'service',
            dictionary: ['service'],
            expand_dictionary: false,
        })
    })
})
