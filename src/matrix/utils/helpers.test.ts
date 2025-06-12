import { typeofCellsMatrix } from './helpers'
import { Matrix } from './matrix'
import { describe, it, expect } from 'vitest'

describe('utils/helpers', () => {
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
})
