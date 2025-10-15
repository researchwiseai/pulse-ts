import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { Workflow } from '../src/dsl'
import { CoreClient } from '../src/core/clients/CoreClient'
import { DataDictionaryResult } from '../src/results/DataDictionaryResult'
import { smallDataset, mixedDataset } from './fixtures/dataDictionaryFixtures'
// Unit tests for DSL id uniqueness and naming behavior
describe('DSL id uniqueness and naming', () => {
    it('assigns unique ids for duplicate processes', () => {
        const wf = new Workflow().themeGeneration().themeGeneration()
        const ids = (wf as unknown as { processes: Array<{ id: string }> }).processes.map(
            (p: { id: string }) => p.id,
        )
        expect(ids).toEqual(['themeGeneration', 'themeGeneration_2'])
    })
    it('throws when using duplicate custom name', () => {
        const wf = new Workflow().themeGeneration({ name: 'x' })
        expect(() => wf.themeGeneration({ name: 'x' })).toThrowError(
            "Process name 'x' already registered",
        )
    })
    it('throws when custom name collides with source alias', () => {
        const wf = new Workflow().source('foo', [])
        expect(() => wf.themeGeneration({ name: 'foo' })).toThrowError(
            "Process name 'foo' already registered",
        )
    })
    it('throws when inputs source unknown for themeAllocation', () => {
        const wf = new Workflow()
        expect(() => wf.themeAllocation({ inputs: 'unknown', themes: ['A'] })).toThrowError(
            "Unknown inputs source for themeAllocation: 'unknown'",
        )
    })
    it('throws when source unknown for createEmbeddings', () => {
        const wf = new Workflow()
        expect(() => wf.createEmbeddings({ source: 'x' })).toThrowError(
            "Unknown source for createEmbeddings: 'x'",
        )
    })
    it('throws when source unknown for compareSimilarity', () => {
        const wf = new Workflow()
        expect(() => wf.compareSimilarity({ source: 'y' })).toThrowError(
            "Unknown source for compareSimilarity: 'y'",
        )
    })
    it('throws when source unknown for generateSummary', () => {
        const wf = new Workflow()
        expect(() => wf.generateSummary({ question: 'q', source: 'z' })).toThrowError(
            "Unknown source for generateSummary: 'z'",
        )
    })
    it('throws when dataset not found for generateDataDictionary', () => {
        const wf = new Workflow()
        expect(() => wf.generateDataDictionary('nonexistent')).toThrowError(
            "Dataset 'nonexistent' not found",
        )
    })
    it('throws when dataset is not 2D array for generateDataDictionary', () => {
        const wf = new Workflow().source('data', ['not', 'a', '2d', 'array'])
        expect(() => wf.generateDataDictionary('data')).toThrowError(
            "Dataset 'data' must be a 2D array for data dictionary generation",
        )
    })
})
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'
import { Job } from '../src/core/job'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET
const tokenUrl = process.env.PULSE_TOKEN_URL
const audience = process.env.PULSE_AUDIENCE
const baseUrl = audience ?? process.env.PULSE_BASE_URL
if (!clientId || !clientSecret || !tokenUrl || !audience) {
    describe.skip('DSL workflow (requires credentials)', () => {})
} else {
    const auth = new ClientCredentialsAuth({ clientId, clientSecret, tokenUrl, audience })
    const client = new CoreClient({ baseUrl: baseUrl as string, auth })

    describe('DSL end-to-end', () => {
        setupPolly()
        it.skip('runs themeAllocation step', async () => {
            const comments = ['good', 'bad', 'meh']
            const existing = ['Pos', 'Neg']
            const wf = new Workflow()
                .source('comments', comments)
                .source('themes', existing)
                .themeAllocation({ inputs: 'comments', themesFrom: 'themes' })
            const results = await wf.run({ client, datasets: {} })
            expect(results).toHaveProperty('themeAllocation')
            const ta = results.themeAllocation
            expect(ta).not.toBeInstanceOf(Job)
            if ((ta as Record<string, unknown>).themes) {
                expect(Array.isArray((ta as Record<string, unknown>).themes)).toBe(true)
            }
            if ((ta as Record<string, unknown>).sentiments) {
                expect(Array.isArray((ta as Record<string, unknown>).sentiments)).toBe(true)
            }
        })
    })

    describe('DSL - Data Dictionary Integration', () => {
        setupPolly()

        it('generates data dictionary via workflow', { timeout: 60_000 }, async () => {
            const wf = new Workflow()
                .source('surveyData', smallDataset)
                .generateDataDictionary('surveyData', {
                    name: 'codebook',
                    title: 'Survey Codebook',
                })

            const results = await wf.run({ client, datasets: {} })

            expect(results).toHaveProperty('codebook')
            expect(results.codebook).toBeInstanceOf(DataDictionaryResult)

            const codebook = results.codebook as DataDictionaryResult
            expect(codebook.title).toBe('Survey Codebook')
            expect(codebook.getVariables().length).toBeGreaterThan(0)
        })

        it(
            'generates data dictionary in workflow with multiple steps',
            { timeout: 60_000 },
            async () => {
                const comments = ['Great service!', 'Could be better', 'Very satisfied']

                const wf = new Workflow()
                    .source('surveyData', mixedDataset)
                    .source('comments', comments)
                    .generateDataDictionary('surveyData', {
                        name: 'codebook',
                        title: 'Product Survey',
                    })
                    .sentiment({ source: 'comments', name: 'commentSentiment' })

                const results = await wf.run({ client, datasets: {} })

                // Verify data dictionary result
                expect(results).toHaveProperty('codebook')
                expect(results.codebook).toBeInstanceOf(DataDictionaryResult)

                const codebook = results.codebook as DataDictionaryResult
                expect(codebook.title).toBe('Product Survey')
                expect(codebook.getVariables().length).toBeGreaterThan(0)

                // Verify sentiment result
                expect(results).toHaveProperty('commentSentiment')
                expect(results.commentSentiment).toBeDefined()
            },
        )

        it('throws error when dataset not found', () => {
            const wf = new Workflow()

            expect(() => {
                wf.generateDataDictionary('nonexistent')
            }).toThrow("Dataset 'nonexistent' not found")
        })

        it('throws error when dataset is not 2D array', () => {
            const wf = new Workflow().source('invalidData', ['not', 'a', '2d', 'array'])

            expect(() => {
                wf.generateDataDictionary('invalidData')
            }).toThrow("Dataset 'invalidData' must be a 2D array")
        })

        it('makes result accessible in workflow results', { timeout: 60_000 }, async () => {
            const wf = new Workflow().source('data', smallDataset).generateDataDictionary('data', {
                name: 'myCodebook',
                title: 'My Codebook',
                description: 'Test codebook',
            })

            const results = await wf.run({ client, datasets: {} })

            // Verify result is accessible by custom name
            expect(results).toHaveProperty('myCodebook')
            expect(results.myCodebook).toBeInstanceOf(DataDictionaryResult)

            const result = results.myCodebook as DataDictionaryResult
            expect(result.title).toBe('My Codebook')
            expect(result.description).toBe('Test codebook')

            // Verify result methods work
            const variables = result.getVariables()
            expect(Array.isArray(variables)).toBe(true)
            expect(variables.length).toBeGreaterThan(0)

            const summary = result.getSummary()
            expect(summary.title).toBe('My Codebook')
            expect(summary.totalVariables).toBe(variables.length)
        })
    })
}
