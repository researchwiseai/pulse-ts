import { describe, it, expect, vi } from 'vitest'
import { GenerateDataDictionary } from '../../src/processes/GenerateDataDictionary'
import { DataDictionaryResult } from '../../src/results/DataDictionaryResult'
import type { ContextBase } from '../../src/processes/types'
import type { CoreClient } from '../../src/core/clients/CoreClient'
import type { components } from '../../src/models'

type DataDictionaryResponse = components['schemas']['DataDictionaryResponse']

// Create a minimal mock response for testing
const createMockResponse = (): DataDictionaryResponse => ({
    codebook: {
        title: 'Test Codebook',
        description: 'Test description',
        creationDate: '2024-01-01T00:00:00Z',
        language: 'en',
        generationMethod: 'AI-assisted analysis',
        variables: [
            {
                variableName: 'age',
                variableLabel: 'Age',
                universeRef: 'u.AllRespondents',
                type: 'numeric',
                scaleLevel: 'ratio',
                isDerived: false,
                sourceColumns: 'age',
                valueDomainRef: 'vd1',
            },
        ],
        valueDomains: [
            {
                valueDomainId: 'vd1',
                domainType: 'range',
                dataType: 'numeric',
                label: 'Age Range',
                minValue: 18,
                maxValue: 100,
            },
        ],
    },
    profileVersion: '0.1',
    profileName: 'DDI Profile',
    requestId: 'test-request-id',
})

describe('GenerateDataDictionary', () => {
    const sampleData = [
        ['Name', 'Age', 'City'],
        ['John', '25', 'New York'],
        ['Jane', '30', 'Los Angeles'],
    ]

    describe('instantiation', () => {
        it('creates instance with required parameters only', () => {
            const process = new GenerateDataDictionary({
                data: sampleData,
            })

            expect(process).toBeInstanceOf(GenerateDataDictionary)
            expect(process.id).toBe('generateDataDictionary')
            expect(process.name).toBe('generateDataDictionary')
            expect(process.data).toBe(sampleData)
            expect(process.dependsOn).toEqual([])
            expect(process.title).toBeUndefined()
            expect(process.description).toBeUndefined()
            expect(process.context).toBeUndefined()
            expect(process.language).toBeUndefined()
        })

        it('creates instance with all optional parameters', () => {
            const process = new GenerateDataDictionary({
                name: 'customCodebook',
                data: sampleData,
                title: 'Survey Data',
                description: 'Customer satisfaction survey',
                context: 'Annual survey results',
                language: 'en',
            })

            expect(process).toBeInstanceOf(GenerateDataDictionary)
            expect(process.id).toBe('generateDataDictionary')
            expect(process.name).toBe('customCodebook')
            expect(process.data).toBe(sampleData)
            expect(process.title).toBe('Survey Data')
            expect(process.description).toBe('Customer satisfaction survey')
            expect(process.context).toBe('Annual survey results')
            expect(process.language).toBe('en')
        })

        it('has static id property', () => {
            expect(GenerateDataDictionary.id).toBe('generateDataDictionary')
        })
    })

    describe('run', () => {
        it('calls client method with correct parameters', async () => {
            const mockResponse = createMockResponse()
            const mockClient = {
                generateDataDictionary: vi.fn().mockResolvedValue(mockResponse),
            } as unknown as CoreClient

            const mockContext: ContextBase = {
                datasets: {},
                client: mockClient,
                fast: false,
                processes: [],
            }

            const process = new GenerateDataDictionary({
                data: sampleData,
                title: 'Test Title',
                description: 'Test Description',
                context: 'Test Context',
                language: 'en',
            })

            await process.run(mockContext)

            expect(mockClient.generateDataDictionary).toHaveBeenCalledTimes(1)
            expect(mockClient.generateDataDictionary).toHaveBeenCalledWith(sampleData, {
                title: 'Test Title',
                description: 'Test Description',
                context: 'Test Context',
                language: 'en',
                fast: false,
                awaitJobResult: true,
            })
        })

        it('calls client method with minimal parameters', async () => {
            const mockResponse = createMockResponse()
            const mockClient = {
                generateDataDictionary: vi.fn().mockResolvedValue(mockResponse),
            } as unknown as CoreClient

            const mockContext: ContextBase = {
                datasets: {},
                client: mockClient,
                fast: false,
                processes: [],
            }

            const process = new GenerateDataDictionary({
                data: sampleData,
            })

            await process.run(mockContext)

            expect(mockClient.generateDataDictionary).toHaveBeenCalledTimes(1)
            expect(mockClient.generateDataDictionary).toHaveBeenCalledWith(sampleData, {
                title: undefined,
                description: undefined,
                context: undefined,
                language: undefined,
                fast: false,
                awaitJobResult: true,
            })
        })

        it('returns DataDictionaryResult instance', async () => {
            const mockResponse = createMockResponse()
            const mockClient = {
                generateDataDictionary: vi.fn().mockResolvedValue(mockResponse),
            } as unknown as CoreClient

            const mockContext: ContextBase = {
                datasets: {},
                client: mockClient,
                fast: false,
                processes: [],
            }

            const process = new GenerateDataDictionary({
                data: sampleData,
            })

            const result = await process.run(mockContext)

            expect(result).toBeInstanceOf(DataDictionaryResult)
            expect(result.codebook).toBe(mockResponse.codebook)
            expect(result.profileVersion).toBe('0.1')
            expect(result.profileName).toBe('DDI Profile')
        })

        it('always passes fast=false to client method', async () => {
            const mockResponse = createMockResponse()
            const mockClient = {
                generateDataDictionary: vi.fn().mockResolvedValue(mockResponse),
            } as unknown as CoreClient

            // Context has fast=true, but process should override to false
            const mockContext: ContextBase = {
                datasets: {},
                client: mockClient,
                fast: true,
                processes: [],
            }

            const process = new GenerateDataDictionary({
                data: sampleData,
            })

            await process.run(mockContext)

            expect(mockClient.generateDataDictionary).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    fast: false,
                }),
            )
        })

        it('handles client errors appropriately', async () => {
            const mockError = new Error('API Error')
            const mockClient = {
                generateDataDictionary: vi.fn().mockRejectedValue(mockError),
            } as unknown as CoreClient

            const mockContext: ContextBase = {
                datasets: {},
                client: mockClient,
                fast: false,
                processes: [],
            }

            const process = new GenerateDataDictionary({
                data: sampleData,
            })

            await expect(process.run(mockContext)).rejects.toThrow('API Error')
        })
    })
})
