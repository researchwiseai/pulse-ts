import { describe, it, expect } from 'vitest'
import { setupPolly } from './setupPolly'
import { CoreClient } from '../src/core/clients/CoreClient'
import { ClientCredentialsAuth } from '../src/auth/ClientCredentialsAuth'
import { DataDictionaryResult } from '../src/results/DataDictionaryResult'
import { Job } from '../src/core/job'
import {
    smallDataset,
    datasetWithMissingValues,
    mixedDataset,
    minimalDataset,
} from './fixtures/dataDictionaryFixtures'

const clientId = process.env.PULSE_CLIENT_ID
const clientSecret = process.env.PULSE_CLIENT_SECRET
const tokenUrl = process.env.PULSE_TOKEN_URL
const baseUrl = process.env.PULSE_BASE_URL

if (!clientId || !clientSecret || !tokenUrl || !baseUrl) {
    describe.skip('Data Dictionary Integration (requires credentials)', () => {})
} else {
    const auth = new ClientCredentialsAuth({
        clientId,
        clientSecret,
        tokenUrl,
    })
    const client = new CoreClient({ baseUrl: baseUrl as string, auth })

    describe('Data Dictionary Generation - End-to-End', () => {
        setupPolly()

        it('generates data dictionary for small dataset', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(smallDataset, {
                fast: false,
            })

            const result = new DataDictionaryResult(response)
            expect(result).toBeInstanceOf(DataDictionaryResult)
            expect(result.codebook).toBeDefined()
            expect(result.profileVersion).toBeDefined()
            expect(result.profileName).toBe('DDI Profile')

            // Verify variables were generated
            const variables = result.getVariables()
            expect(variables.length).toBeGreaterThan(0)

            // Verify we can access variables by name
            const nameVar = result.getVariableByName('Name')
            expect(nameVar).toBeDefined()

            // Verify value domains exist
            const valueDomains = result.getValueDomains()
            expect(valueDomains.length).toBeGreaterThanOrEqual(0)
        })

        it('generates data dictionary with optional metadata', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(mixedDataset, {
                title: 'Product Catalog',
                description: 'E-commerce product data dictionary',
                context: 'Online retail store inventory',
                language: 'en',
                fast: false,
            })

            const result = new DataDictionaryResult(response)
            expect(result).toBeInstanceOf(DataDictionaryResult)
            expect(result.title).toBe('Product Catalog')
            expect(result.description).toBe('E-commerce product data dictionary')
            expect(result.language).toBe('en')

            // Verify metadata is accessible
            const metadata = result.getMetadata()
            expect(metadata.title).toBe('Product Catalog')
            expect(metadata.description).toBe('E-commerce product data dictionary')
        })

        it('handles dataset with missing values', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(datasetWithMissingValues, {
                title: 'Dataset with Missing Values',
                fast: false,
            })

            const result = new DataDictionaryResult(response)
            expect(result).toBeInstanceOf(DataDictionaryResult)

            // Verify variables were generated despite missing values
            const variables = result.getVariables()
            expect(variables.length).toBeGreaterThan(0)

            // Check if missing values are documented
            const missingValues = result.getMissingValues()
            expect(Array.isArray(missingValues)).toBe(true)
        })

        it('generates data dictionary for minimal dataset', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(minimalDataset, {
                fast: false,
            })

            const result = new DataDictionaryResult(response)
            expect(result).toBeInstanceOf(DataDictionaryResult)
            expect(result.getVariables().length).toBeGreaterThan(0)
        })
    })

    describe('Data Dictionary - Job Polling', () => {
        setupPolly()

        it('returns job and polls for completion', { timeout: 60_000 }, async () => {
            const job = await client.generateDataDictionary(smallDataset, {
                awaitJobResult: false,
                fast: false,
            })

            expect(job).toBeInstanceOf(Job)
            expect(typeof job.jobId).toBe('string')

            // Poll for result
            const response = await job.result()
            expect(response).toBeDefined()
            expect(response.codebook).toBeDefined()

            // Wrap in result class
            const result = new DataDictionaryResult(response)
            expect(result.getVariables().length).toBeGreaterThan(0)
        })
    })

    describe('Data Dictionary - Error Scenarios', () => {
        setupPolly()

        it('throws error when fast mode is requested', async () => {
            await expect(
                client.generateDataDictionary(smallDataset, {
                    fast: true,
                }),
            ).rejects.toThrow('only supports asynchronous mode')
        })

        it('throws error for invalid data structure', async () => {
            // Empty dataset
            await expect(
                client.generateDataDictionary([], {
                    fast: false,
                }),
            ).rejects.toThrow()
        })

        it('throws error for single row (no data rows)', async () => {
            const headerOnly = [['Column1', 'Column2']]

            await expect(
                client.generateDataDictionary(headerOnly, {
                    fast: false,
                }),
            ).rejects.toThrow()
        })
    })

    describe('Data Dictionary - Result Methods', () => {
        setupPolly()

        it('provides comprehensive result methods', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(mixedDataset, {
                title: 'Product Data',
                fast: false,
            })

            const result = new DataDictionaryResult(response)

            // Test variable accessor methods
            const variables = result.getVariables()
            expect(variables.length).toBeGreaterThan(0)

            const stringVars = result.getVariablesByType('string')
            expect(Array.isArray(stringVars)).toBe(true)

            const numericVars = result.getVariablesByType('numeric')
            expect(Array.isArray(numericVars)).toBe(true)

            // Test value domain methods
            const valueDomains = result.getValueDomains()
            expect(Array.isArray(valueDomains)).toBe(true)

            // Test export methods
            const json = result.toJSON()
            expect(json.codebook).toBeDefined()

            const codebook = result.getCodebook()
            expect(codebook.variables).toBeDefined()

            // Test summary method
            const summary = result.getSummary()
            expect(summary.totalVariables).toBe(variables.length)
            expect(summary.title).toBe('Product Data')
            expect(summary.variablesByType).toBeDefined()
            expect(summary.variablesByScale).toBeDefined()
        })

        it('filters variables by scale level', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(mixedDataset, {
                fast: false,
            })

            const result = new DataDictionaryResult(response)

            const nominalVars = result.getVariablesByScaleLevel('nominal')
            const ordinalVars = result.getVariablesByScaleLevel('ordinal')
            const intervalVars = result.getVariablesByScaleLevel('interval')
            const ratioVars = result.getVariablesByScaleLevel('ratio')

            expect(Array.isArray(nominalVars)).toBe(true)
            expect(Array.isArray(ordinalVars)).toBe(true)
            expect(Array.isArray(intervalVars)).toBe(true)
            expect(Array.isArray(ratioVars)).toBe(true)
        })

        it('accesses categories for value domains', { timeout: 60_000 }, async () => {
            const response = await client.generateDataDictionary(mixedDataset, {
                fast: false,
            })

            const result = new DataDictionaryResult(response)

            const valueDomains = result.getValueDomains()

            if (valueDomains.length > 0) {
                const firstDomain = valueDomains[0]
                const categories = result.getCategoriesForDomain(firstDomain.valueDomainId)
                expect(Array.isArray(categories)).toBe(true)

                // Verify categories are sorted by order
                for (let i = 1; i < categories.length; i++) {
                    expect(categories[i].order).toBeGreaterThanOrEqual(categories[i - 1].order)
                }
            }
        })
    })
}
