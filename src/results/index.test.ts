import { describe, it, expect } from 'vitest'
import { ClusterResult } from './index'
import { ThemeExtractionResult } from './index'

describe('ClusterResult', () => {
    const texts = ['apple', 'banana', 'cherry']
    const matrix = [
        [1, 0.5, 0.2],
        [0.5, 1, 0.3],
        [0.2, 0.3, 1],
    ]
    const clusterResult = new ClusterResult(matrix, texts)

    it('returns the correct similarity score for two texts', () => {
        expect(clusterResult.score('apple', 'banana')).toBe(0.5)
        expect(clusterResult.score('banana', 'cherry')).toBe(0.3)
        expect(clusterResult.score('cherry', 'apple')).toBe(0.2)
        expect(clusterResult.score('apple', 'apple')).toBe(1)
    })

    it('throws an error if the first text is not found', () => {
        expect(() => clusterResult.score('orange', 'banana')).toThrowError(
            'Text not found in the provided texts list',
        )
    })

    it('throws an error if the second text is not found', () => {
        expect(() => clusterResult.score('apple', 'orange')).toThrowError(
            'Text not found in the provided texts list',
        )
    })

    it('throws an error if both texts are not found', () => {
        expect(() => clusterResult.score('orange', 'grape')).toThrowError(
            'Text not found in the provided texts list',
        )
    })
})

describe('ThemeExtractionResult', () => {
    const texts = ['text1', 'text2']
    const themes = ['themeA', 'themeB']
    const extractions = [
        [
            ['ex1a', 'ex1b'], // text1, themeA
            ['ex1c'], // text1, themeB
        ],
        [
            [], // text2, themeA
            ['ex2a', 'ex2b'], // text2, themeB
        ],
    ]
    const response = { extractions }
    const result = new ThemeExtractionResult(response as any, texts, themes)

    it('returns the correct extractions getter', () => {
        expect(result.extractions).toBe(extractions)
    })

    it('toArray flattens extractions correctly', () => {
        expect(result.toArray()).toEqual([
            { text: 'text1', theme: 'themeA', extraction: 'ex1a' },
            { text: 'text1', theme: 'themeA', extraction: 'ex1b' },
            { text: 'text1', theme: 'themeB', extraction: 'ex1c' },
            { text: 'text2', theme: 'themeB', extraction: 'ex2a' },
            { text: 'text2', theme: 'themeB', extraction: 'ex2b' },
        ])
    })

    it('handles missing or empty extractions gracefully', () => {
        const emptyResponse = { extractions: [[], []] }
        const emptyResult = new ThemeExtractionResult(emptyResponse as any, texts, themes)
        expect(emptyResult.toArray()).toEqual([])
    })

    it('handles missing extraction rows for some texts', () => {
        const partialResponse = { extractions: [[['a']], undefined as any] }
        const partialResult = new ThemeExtractionResult(partialResponse as any, texts, themes)
        expect(partialResult.toArray()).toEqual([
            { text: 'text1', theme: 'themeA', extraction: 'a' },
        ])
    })
})
