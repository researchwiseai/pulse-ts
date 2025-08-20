import { describe, it, expect } from 'vitest'
import { ClusterResult, ThemeExtractionResult } from '../src/results'
import { ThemeAllocationResult } from '../src/results/ThemeAllocationResult'
import { SentimentResult } from '../src/results/SentimentResult'
import { ThemeGenerationResult } from '../src/results/ThemeGenerationResult'
import type { components } from '../src/models'

describe('ThemeGenerationResult', () => {
    it('toArray returns expected metadata', () => {
        const response: components['schemas']['ThemesResponse'] = {
            requestId: 'id',
            themes: [
                {
                    shortLabel: 'A',
                    label: 'Label A',
                    description: 'Desc A',
                    representatives: ['rA1', 'rA2'],
                },
            ],
        }
        const r = new ThemeGenerationResult(response)
        expect(r.themes[0]?.shortLabel).toBe('A')
        const arr = r.toArray()
        expect(arr).toEqual([
            {
                shortLabel: 'A',
                label: 'Label A',
                description: 'Desc A',
                representative_1: 'rA1',
                representative_2: 'rA2',
            },
        ])
    })
})

describe('SentimentResult', () => {
    it('toArray and summary produce correct outputs', () => {
        const texts = ['I', 'am', 'ok']
        const coreResults: components['schemas']['SentimentResult'][] = [
            { sentiment: 'positive', confidence: 0.5 },
            { sentiment: 'negative', confidence: 0.4 },
            { sentiment: 'positive', confidence: 0.9 },
        ]
        const response: components['schemas']['SentimentResponse'] = {
            requestId: 'id',
            results: coreResults,
        }
        const r = new SentimentResult(response, texts)
        const arr = r.toArray()
        expect(arr).toEqual([
            { text: 'I', sentiment: 'positive', confidence: 0.5 },
            { text: 'am', sentiment: 'negative', confidence: 0.4 },
            { text: 'ok', sentiment: 'positive', confidence: 0.9 },
        ])
        const summary = r.summary()
        expect(summary).toEqual({ positive: 2, negative: 1 })
    })
})

describe('ThemeAllocationResult', () => {
    it('assignSingle and assignMulti work as expected', () => {
        const texts = ['d1', 'd2']
        const themes = ['A', 'B', 'C']
        const assignments = [0, 1]
        const similarity = [
            [0.1, 0.8, 0.3],
            [0.5, 0.2, 0.7],
        ]
        const r = new ThemeAllocationResult(texts, themes, assignments, true, 0.6, similarity)
        const single = r.assignSingle()
        expect(single).toEqual({ d1: 'B', d2: 'C' })
        const multi = r.assignMulti(2)
        expect(multi).toEqual([
            { theme_1: 'B', theme_2: 'C' },
            { theme_1: 'C', theme_2: 'A' },
        ])
    })
})

describe('ClusterResult', () => {
    it('returns the raw similarity matrix', () => {
        const matrix = [
            [1, 0.1],
            [0.1, 1],
        ]
        const texts = ['a', 'b']
        const r = new ClusterResult(matrix, texts)
        expect(r.similarityMatrix).toEqual(matrix)
    })
})

describe('ThemeExtractionResult', () => {
    it('toArray returns expected extraction rows', () => {
        const response: components['schemas']['ExtractionsResponse'] = {
            dictionary: ['service'],
            results: [
                [['service'], ['service was slow']],
                [[], []],
            ],
        }
        const texts = ['The service was slow.', 'All good']
        const r = new ThemeExtractionResult(response, texts)
        const arr = r.toArray()
        expect(arr).toEqual([
            { text: 'The service was slow.', canonical: 'service', span: 'service was slow' },
        ])
    })

    it('exposes dictionary and results from the response', () => {
        const resp: components['schemas']['ExtractionsResponse'] = {
            dictionary: ['X', 'Y'],
            results: [
                [['X'], ['x found']],
                [['Y'], ['y found']],
            ],
        }
        const r = new ThemeExtractionResult(resp, ['x', 'y'])
        expect(r.dictionary).toEqual(resp.dictionary)
        expect(r.results).toEqual(resp.results)
    })
})
