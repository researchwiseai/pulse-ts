import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import {
    getStrings,
    themeAllocation,
    clusterAnalysis,
    summarize,
    createEmbeddings,
    compareSimilarity,
    generateDataDictionary,
} from '../src/starters'
import { ClusterResult } from '../src/results'
import { ThemeAllocationResult } from '../src/results/ThemeAllocationResult'
import { DataDictionaryResult } from '../src/results/DataDictionaryResult'
import { CoreClient } from '../src/core/clients/CoreClient'
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'
import { smallDataset, mixedDataset } from './fixtures/dataDictionaryFixtures'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET

const skip = !clientId || !clientSecret

describe('getStrings', () => {
    it('returns array as-is', () => {
        const input = ['a', 'b']
        expect(getStrings(input)).toEqual(input)
    })
    it('throws on invalid input', () => {
        expect(() => getStrings('nonexistent.txt')).toThrow()
    })
})

describe('starters', { skip }, () => {
    describe('themeAllocation', () => {
        setupPolly()
        it('allocates themes implicitly', { timeout: 30_000 }, async () => {
            const reviews = ['good', 'bad']
            const res = await themeAllocation(reviews)
            expect(res).toBeInstanceOf(ThemeAllocationResult)
            const single = res.assignSingle()
            expect(Object.keys(single)).toHaveLength(reviews.length)
            const multi = res.assignMulti(2)
            expect(multi).toHaveLength(reviews.length)
        })

        it('allocates themes explicitly', { timeout: 30_000 }, async () => {
            const reviews = ['good', 'bad']
            const themes = ['positive', 'negative']
            const res = await themeAllocation(reviews, { themes })
            expect(res).toBeInstanceOf(ThemeAllocationResult)
            const single = res.assignSingle()
            expect(Object.keys(single)).toHaveLength(reviews.length)
            const multi = res.assignMulti(2)
            expect(multi).toHaveLength(reviews.length)
        })
    })

    describe('clusterAnalysis starter', { timeout: 30_000 }, () => {
        setupPolly()
        it('returns ClusterResult instance', async () => {
            const reviews = ['x', 'y']
            const res = await clusterAnalysis(reviews)
            expect(res).toBeInstanceOf(ClusterResult)
        })
    })

    describe('summarize starter', { timeout: 30_000 }, () => {
        setupPolly()
        it('returns a summary', async () => {
            const reviews = ['this is great']
            const res = await summarize(reviews, 'what?')
            expect(res.summary).toBeTypeOf('string')
        })
    })

    describe('createEmbeddings starter', { timeout: 30_000 }, () => {
        setupPolly()
        it('returns embeddings', async () => {
            const reviews = ['hello world']
            const res = await createEmbeddings(reviews)
            expect(Array.isArray(res.embeddings)).toBe(true)
        })
    })

    describe('compareSimilarity starter', { timeout: 30_000 }, () => {
        setupPolly()
        it('returns flattened similarity matrix', async () => {
            const reviews = ['a', 'b']
            const res = await compareSimilarity(reviews)
            expect(Array.isArray(res.flattened)).toBe(true)
        })
    })

    describe('generateDataDictionary starter', () => {
        setupPolly()

        it('generates data dictionary with minimal parameters', { timeout: 60_000 }, async () => {
            const result = await generateDataDictionary(smallDataset)

            expect(result).toBeInstanceOf(DataDictionaryResult)
            expect(result.codebook).toBeDefined()
            expect(result.getVariables().length).toBeGreaterThan(0)
        })

        it(
            'generates data dictionary with all optional metadata',
            { timeout: 60_000 },
            async () => {
                const result = await generateDataDictionary(mixedDataset, {
                    title: 'Product Catalog',
                    description: 'E-commerce product data',
                    context: 'Online retail store',
                    language: 'en',
                })

                expect(result).toBeInstanceOf(DataDictionaryResult)
                expect(result.title).toBe('Product Catalog')
                expect(result.description).toBe('E-commerce product data')
                expect(result.language).toBe('en')

                const metadata = result.getMetadata()
                expect(metadata.title).toBe('Product Catalog')
                expect(metadata.description).toBe('E-commerce product data')
            },
        )

        it('generates data dictionary with custom client', { timeout: 60_000 }, async () => {
            const auth = new ClientCredentialsAuth({
                clientId: process.env.PULSE_CLIENT_ID!,
                clientSecret: process.env.PULSE_CLIENT_SECRET!,
                tokenUrl: process.env.PULSE_TOKEN_URL!,
            })
            const customClient = new CoreClient({
                baseUrl: process.env.PULSE_BASE_URL!,
                auth,
            })

            const result = await generateDataDictionary(smallDataset, {
                client: customClient,
                title: 'Custom Client Test',
            })

            expect(result).toBeInstanceOf(DataDictionaryResult)
            expect(result.title).toBe('Custom Client Test')
            expect(result.getVariables().length).toBeGreaterThan(0)
        })

        it('returns DataDictionaryResult with helper methods', { timeout: 60_000 }, async () => {
            const result = await generateDataDictionary(mixedDataset, {
                title: 'Helper Methods Test',
            })

            // Verify result is DataDictionaryResult
            expect(result).toBeInstanceOf(DataDictionaryResult)

            // Verify helper methods are available
            expect(typeof result.getVariables).toBe('function')
            expect(typeof result.getVariableByName).toBe('function')
            expect(typeof result.getVariablesByType).toBe('function')
            expect(typeof result.getValueDomains).toBe('function')
            expect(typeof result.getSummary).toBe('function')

            // Verify methods return expected types
            const variables = result.getVariables()
            expect(Array.isArray(variables)).toBe(true)

            const summary = result.getSummary()
            expect(summary.totalVariables).toBeDefined()
            expect(summary.variablesByType).toBeDefined()
        })
    })
})
