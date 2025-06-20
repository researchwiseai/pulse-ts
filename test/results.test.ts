import { describe, it, expect } from 'vitest'
import { ThemeExtractionResult } from '../src/results/ThemeExtractionResult'
import { ClusterResult } from '../src/results/ClusterResult'
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

    it('manual DBSCAN via cluster()', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const raw = r.cluster({ mode: 'dbscan', eps: 1, minPts: 1 })
        expect(raw.assignments).toEqual([0, 0])
    })

    it('manual K-Means via cluster()', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const raw = r.cluster({ mode: 'mean', k: 1 })
        expect(raw.assignments).toEqual([0, 0])
    })

    it('manual K-Medoids via cluster()', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const raw = r.cluster({ mode: 'medoid', k: 1 })
        expect(raw.assignments).toEqual([0, 0])
    })

    it('manual HAC via cluster()', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const raw = r.cluster({ mode: 'hac', k: 1 })
        expect(raw.assignments).toEqual([0, 0])
    })

    it('kMeans(k=1) returns metrics', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const res = r.kMeans({ k: 1 })
        expect(res.assignments).toEqual([0, 0])
        expect(res.k).toBe(1)
        expect(typeof res.cost).toBe('number')
        expect(typeof res.silhouetteScore).toBe('number')
    })

    it('kMedoids(k=1) returns metrics', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const res = r.kMedoids({ k: 1 })
        expect(res.assignments).toEqual([0, 0])
        expect(res.k).toBe(1)
        expect(typeof res.cost).toBe('number')
        expect(typeof res.silhouetteScore).toBe('number')
    })

    it('hac(k=1) returns metrics', () => {
        const matrix = [
            [1, 1],
            [1, 1],
        ]
        const r = new ClusterResult(matrix, ['a', 'b'])
        const res = r.hac({ k: 1 })
        expect(res.assignments).toEqual([0, 0])
        expect(res.k).toBe(1)
        expect(typeof res.cost).toBe('number')
        expect(typeof res.silhouetteScore).toBe('number')
    })
})

describe('ThemeExtractionResult', () => {
    it('toArray returns expected extraction rows', () => {
        const response: components['schemas']['ExtractionsResponse'] = {
            requestId: 'id',
            extractions: [
                [['A1', 'A2'], []],
                [[], ['B1']],
            ],
        }
        const texts = ['A1 A2', 'B1']
        const themes = ['A', 'B']
        const r = new ThemeExtractionResult(response, texts, themes)
        const arr = r.toArray()
        expect(arr).toEqual([
            { text: 'A1 A2', theme: 'A', extraction: 'A1' },
            { text: 'A1 A2', theme: 'A', extraction: 'A2' },
            { text: 'B1', theme: 'B', extraction: 'B1' },
        ])
    })
})
