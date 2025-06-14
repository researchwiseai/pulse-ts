import { cosineSimilarity, typeofCellsMatrix } from './helpers'
import { Matrix } from './matrix'
import { describe, it, expect } from 'vitest'

describe('utils/helpers', () => {
    describe('typeofCellsMatrix', () => {
        it('typeofCells returns type of nested array elements', () => {
            expect(
                typeofCellsMatrix([
                    [1, 2],
                    [3, 4],
                ]),
            ).toBe('number')
            expect(typeofCellsMatrix([['a', 'b']])).toBe('string')
        })

        it('typeofCells returns type of Matrix elements', () => {
            const m = Matrix.from([
                [1, 2],
                [3, 4],
            ])
            expect(typeofCellsMatrix(m)).toBe('number')
        })

        describe('cosineSimilarity', () => {
            it('returns 1 for identical vectors', () => {
                const a = [1, 2, 3]
                const b = [1, 2, 3]
                expect(cosineSimilarity(a, b)).toBeCloseTo(1)
            })

            it('returns 0 for orthogonal vectors', () => {
                const a = [1, 0]
                const b = [0, 1]
                expect(cosineSimilarity(a, b)).toBeCloseTo(0)
            })

            it('returns -1 for opposite vectors', () => {
                const a = [1, 0]
                const b = [-1, 0]
                expect(cosineSimilarity(a, b)).toBeCloseTo(-1)
            })

            it('returns correct value for arbitrary vectors', () => {
                const a = [1, 2, 3]
                const b = [4, 5, 6]
                // dot = 1*4 + 2*5 + 3*6 = 32
                // normA = sqrt(1+4+9) = sqrt(14), normB = sqrt(16+25+36) = sqrt(77)
                const expected = 32 / (Math.sqrt(14) * Math.sqrt(77))
                expect(cosineSimilarity(a, b)).toBeCloseTo(expected)
            })

            it('returns 0 when one or both vectors are zero', () => {
                expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0)
                expect(cosineSimilarity([0, 0], [0, 0])).toBe(0)
            })
        })
    })
})
