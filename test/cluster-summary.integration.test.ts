import { describe, it, expect, beforeAll } from 'vitest'
import { CoreClient } from '../src/core/clients/CoreClient'
import { Auth } from '../src/auth'
import { setupPolly } from './setupPolly'

const skip = !process.env.PULSE_CLIENT_SECRET || true

describe('CoreClient clusterTexts and generateSummary integration', { skip }, () => {
    setupPolly()

    let client: CoreClient

    beforeAll(() => {
        client = new CoreClient({
            baseUrl: process.env.PULSE_BASE_URL ?? 'https://staging.pulse.researchwiseai.com/v1',
            auth: new Auth.ClientCredentialsAuth({
                clientId: process.env.PULSE_CLIENT_ID ?? '',
                clientSecret: process.env.PULSE_CLIENT_SECRET ?? '',
                tokenUrl: process.env.PULSE_TOKEN_URL ?? '',
                audience: process.env.PULSE_AUDIENCE ?? '',
            }),
        })
    })

    it('clusterTexts returns clusters when fast', async () => {
        const resp = await client.clusterTexts(
            { inputs: ['apple', 'banana', 'car', 'truck'], k: 2 },
            { fast: true },
        )
        expect(resp).toBeDefined()
        expect(Array.isArray(resp.clusters)).toBe(true)
        expect(resp.clusters.length).toBeGreaterThan(0)
    })

    it('clusterTexts polls job when async', { timeout: 30000 }, async () => {
        const resp = await client.clusterTexts(
            { inputs: ['red apple', 'green apple', 'blue truck', 'yellow truck'], k: 2 },
            { fast: false },
        )
        expect(resp).toBeDefined()
        expect(Array.isArray(resp.clusters)).toBe(true)
        expect(resp.clusters.length).toBeGreaterThan(0)
    })

    it('generateSummary returns summary when fast', async () => {
        const resp = await client.generateSummary(['this is great', 'really great'], 'why?', {
            fast: true,
        })
        expect(resp.summary).toBeTypeOf('string')
        expect(resp.summary.length).toBeGreaterThan(0)
    })

    it('generateSummary polls job when async', { timeout: 30000 }, async () => {
        const resp = await client.generateSummary(['good stuff', 'bad stuff'], 'summary?', {
            fast: false,
        })
        expect(resp.summary).toBeTypeOf('string')
        expect(resp.summary.length).toBeGreaterThan(0)
    })
})
