import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { Analyzer } from '../src/analyzer'
import { ThemeAllocationResult } from '../src/results/ThemeAllocationResult'
import { SentimentResult } from '../src/results/SentimentResult'
import { ThemeGenerationResult } from '../src/results/ThemeGenerationResult'
import { DataDictionaryResult } from '../src/results/DataDictionaryResult'
import { CoreClient } from '../src/core/clients/CoreClient'
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'
import { ThemeGeneration } from '../src/processes/ThemeGeneration'
import { Sentiment } from '../src/processes/Sentiment'
import { ThemeAllocation } from '../src/processes/ThemeAllocation'
import { GenerateDataDictionary } from '../src/processes/GenerateDataDictionary'
import { processes } from '../src/processes/types'
import { smallDataset, mixedDataset } from './fixtures/dataDictionaryFixtures'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET
const tokenUrl = process.env.PULSE_TOKEN_URL
const baseUrl = process.env.PULSE_BASE_URL
if (!clientId || !clientSecret || !tokenUrl || !baseUrl) {
    describe.skip('Analyzer and processes (requires credentials)', () => {})
} else {
    const auth = new ClientCredentialsAuth({
        clientId,
        clientSecret,
        tokenUrl,
    })
    const client = new CoreClient({ baseUrl: baseUrl as string, auth })

    describe('Analyzer without processes', () => {
        setupPolly()
        it('returns empty result container', async () => {
            const az = new Analyzer({ datasets: { dataset: [] }, processes: [], client })
            const res = await az.run()
            expect(res).toBeInstanceOf(Object)
            expect((res as Record<string, unknown>).themeGeneration).toBeUndefined()
        })
    })

    describe('ThemeGeneration process', () => {
        setupPolly()
        it('generates between min and max themes', { timeout: 20_000 }, async () => {
            const reviews = ['Great food', 'Tasty food', 'Quick service']
            const az = new Analyzer({
                datasets: { dataset: reviews },
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
        it('analyzes sentiment for each text', { timeout: 25_000 }, async () => {
            const reviews = ['good', 'bad', 'meh']
            const az = new Analyzer({
                datasets: { dataset: reviews },
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

    describe('ThemeAllocation with static themes', { timeout: 25_000 }, () => {
        setupPolly()
        it('assigns themes for each text', async () => {
            const reviews = ['x', 'y']
            const staticThemes = ['A', 'B']
            const az = new Analyzer({
                datasets: { dataset: reviews },
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

    describe('GenerateDataDictionary process', () => {
        setupPolly()

        it('generates data dictionary via Analyzer', { timeout: 60_000 }, async () => {
            const az = new Analyzer({
                datasets: {},
                processes: processes(
                    new GenerateDataDictionary({
                        data: smallDataset,
                        title: 'Survey Data Dictionary',
                        description: 'Customer survey codebook',
                    }),
                ),
                client,
                fast: false,
            })

            const res = await az.run()

            expect(res.generateDataDictionary).toBeInstanceOf(DataDictionaryResult)
            const result = res.generateDataDictionary as DataDictionaryResult
            expect(result.title).toBe('Survey Data Dictionary')
            expect(result.description).toBe('Customer survey codebook')
            expect(result.getVariables().length).toBeGreaterThan(0)
        })

        it('generates data dictionary with multiple processes', { timeout: 60_000 }, async () => {
            const comments = ['Great service!', 'Could be better', 'Very satisfied']

            const az = new Analyzer({
                datasets: {
                    comments: comments,
                },
                processes: processes(
                    new GenerateDataDictionary({
                        name: 'codebook',
                        data: mixedDataset,
                        title: 'Product Survey',
                    }),
                    new Sentiment({ name: 'commentSentiment' }),
                ),
                client,
                fast: false,
            })

            const res = await az.run()

            // Verify data dictionary result
            expect(res.codebook).toBeInstanceOf(DataDictionaryResult)
            const codebook = res.codebook as DataDictionaryResult
            expect(codebook.title).toBe('Product Survey')
            expect(codebook.getVariables().length).toBeGreaterThan(0)

            // Verify sentiment result
            expect(res.commentSentiment).toBeInstanceOf(SentimentResult)
            const sentiment = res.commentSentiment as SentimentResult
            expect(sentiment.sentiments.length).toBe(comments.length)
        })

        it('makes result accessible via process name', { timeout: 60_000 }, async () => {
            const az = new Analyzer({
                datasets: {},
                processes: processes(
                    new GenerateDataDictionary({
                        name: 'myCustomCodebook',
                        data: smallDataset,
                        title: 'Custom Named Codebook',
                    }),
                ),
                client,
                fast: false,
            })

            const res = await az.run()

            // Verify result is accessible by custom name
            expect(res.myCustomCodebook).toBeInstanceOf(DataDictionaryResult)
            const result = res.myCustomCodebook as DataDictionaryResult
            expect(result.title).toBe('Custom Named Codebook')

            // Verify result methods work
            const variables = result.getVariables()
            expect(Array.isArray(variables)).toBe(true)
            expect(variables.length).toBeGreaterThan(0)

            const summary = result.getSummary()
            expect(summary.title).toBe('Custom Named Codebook')
            expect(summary.totalVariables).toBe(variables.length)
        })

        it(
            'generates data dictionary with all optional parameters',
            { timeout: 60_000 },
            async () => {
                const az = new Analyzer({
                    datasets: {},
                    processes: processes(
                        new GenerateDataDictionary({
                            data: mixedDataset,
                            title: 'Complete Metadata Test',
                            description: 'Testing all optional parameters',
                            context: 'E-commerce product catalog',
                            language: 'en',
                        }),
                    ),
                    client,
                    fast: false,
                })

                const res = await az.run()

                expect(res.generateDataDictionary).toBeInstanceOf(DataDictionaryResult)
                const result = res.generateDataDictionary as DataDictionaryResult

                expect(result.title).toBe('Complete Metadata Test')
                expect(result.description).toBe('Testing all optional parameters')
                expect(result.language).toBe('en')

                const metadata = result.getMetadata()
                expect(metadata.title).toBe('Complete Metadata Test')
                expect(metadata.description).toBe('Testing all optional parameters')
            },
        )
    })
}
