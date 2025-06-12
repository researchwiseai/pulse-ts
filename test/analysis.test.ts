import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { Analyzer } from '../src/analyzer'
import { ThemeAllocationResult } from '../src/results/ThemeAllocationResult'
import { SentimentResult } from '../src/results/SentimentResult'
import { ThemeGenerationResult } from '../src/results/ThemeGenerationResult'
import { CoreClient } from '../src/core/clients/CoreClient'
import { ClientCredentialsAuth } from '../src/auth'
import { ThemeGeneration } from '../src/processes/ThemeGeneration'
import { Sentiment } from '../src/processes/Sentiment'
import { ThemeAllocation } from '../src/processes/ThemeAllocation'
import { processes } from '../src/processes/types'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET
const tokenUrl = process.env.PULSE_TOKEN_URL
const audience = process.env.PULSE_AUDIENCE
const baseUrl = audience ?? process.env.PULSE_BASE_URL
if (!clientId || !clientSecret || !tokenUrl || !audience) {
    describe.skip('Analyzer and processes (requires credentials)', () => {})
} else {
    const auth = new ClientCredentialsAuth({
        clientId,
        clientSecret,
        tokenUrl,
        audience,
    })
    const client = new CoreClient({ baseUrl: baseUrl as string, auth })

    describe('Analyzer without processes', () => {
        setupPolly()
        it('returns empty result container', async () => {
            const az = new Analyzer({ dataset: [], processes: [], client })
            const res = await az.run()
            expect(res).toBeInstanceOf(Object)
            expect((res as any).themeGeneration).toBeUndefined()
        })
    })

    describe('ThemeGeneration process', () => {
        setupPolly()
        it('generates between min and max themes', async () => {
            const reviews = ['a', 'b', 'c']
            const az = new Analyzer({
                dataset: reviews,
                processes: processes(new ThemeGeneration({ minThemes: 2, maxThemes: 3 })),
                client,
                fast: true,
            })
            const res = await az.run()
            expect(res.themeGeneration).toBeInstanceOf(ThemeGenerationResult)
            const tg = res.themeGeneration as ThemeGenerationResult
            expect(tg.themes.length).toBeGreaterThanOrEqual(2)
            expect(tg.themes.length).toBeLessThanOrEqual(3)
        })
    })

    describe('Sentiment', () => {
        setupPolly()
        it('analyzes sentiment for each text', async () => {
            const reviews = ['good', 'bad', 'meh']
            const az = new Analyzer({
                dataset: reviews,
                processes: processes(new Sentiment()),
                client,
                fast: true,
            })
            const res = await az.run()
            expect(res.sentiment).toBeInstanceOf(SentimentResult)
            const sent = res.sentiment as SentimentResult
            expect(sent.sentiments.length).toBe(reviews.length)
            expect(typeof sent.sentiments[0].sentiment).toBe('string')
            expect(typeof sent.sentiments[0].confidence).toBe('number')
        })
    })

    describe('ThemeAllocation with static themes', () => {
        setupPolly()
        it('assigns themes for each text', async () => {
            const reviews = ['x', 'y']
            const staticThemes = ['A', 'B']
            const az = new Analyzer({
                dataset: reviews,
                processes: processes(
                    new ThemeAllocation({ themes: staticThemes, singleLabel: true, threshold: 0 }),
                ),
                client,
                fast: true,
            })
            const res = await az.run()
            expect(res.themeAllocation).toBeInstanceOf(ThemeAllocationResult)
            const ta = res.themeAllocation as ThemeAllocationResult
            const single = ta.assignSingle()
            expect(Object.keys(single)).toHaveLength(reviews.length)
            const multi = ta.assignMulti(2)
            expect(multi).toHaveLength(reviews.length)
        })
    })
}
