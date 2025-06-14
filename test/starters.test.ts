import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { getStrings, themeAllocation, clusterAnalysis } from '../src/starters'
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'
import { CoreClient } from '../src/core/clients/CoreClient'
import { ClusterResult } from '../src/results'
import { ThemeAllocationResult } from '../src/results/ThemeAllocationResult'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET
const tokenUrl = process.env.PULSE_TOKEN_URL
const audience = process.env.PULSE_AUDIENCE
const baseUrl = audience ?? process.env.PULSE_BASE_URL

// Skip tests if credentials not set
if (!clientId || !clientSecret || !tokenUrl || !audience) {
    describe.skip('starters (requires credentials)', () => {})
} else {
    const auth = new ClientCredentialsAuth({ clientId, clientSecret, tokenUrl, audience })
    const client = new CoreClient({ baseUrl: baseUrl as string, auth })

    describe('getStrings', () => {
        it('returns array as-is', () => {
            const input = ['a', 'b']
            expect(getStrings(input)).toEqual(input)
        })
        it('throws on invalid input', () => {
            expect(() => getStrings('nonexistent.txt')).toThrow()
        })
    })

    describe('themeAllocation starter', () => {
        setupPolly()
        it('allocates themes implicitly', { timeout: 30_000 }, async () => {
            const reviews = ['good', 'bad']
            const res = await themeAllocation(reviews, client)
            expect(res).toBeInstanceOf(ThemeAllocationResult)
            const single = res.assignSingle()
            expect(Object.keys(single)).toHaveLength(reviews.length)
            const multi = res.assignMulti(2)
            expect(multi).toHaveLength(reviews.length)
        })
    })

    describe('clusterAnalysis starter', () => {
        setupPolly()
        it('returns ClusterResult instance', async () => {
            const reviews = ['x', 'y']
            const res = await clusterAnalysis(reviews, client)
            expect(res).toBeInstanceOf(ClusterResult)
        })
    })
}
