import { product, indexToCoords, flatten, unflatten, shape, firstScalar } from './helpers'
import { describe, it, expect } from 'vitest'

describe('helpers: product', () => {
    it('returns 1 for empty array', () => {
        expect(product([])).toBe(1)
    })
    it('multiplies array elements', () => {
        expect(product([2, 3, 4])).toBe(24)
    })
})

describe('helpers: indexToCoords', () => {
    it('maps linear indices to coordinates for 2x3 dimensions', () => {
        const dims = [2, 3]
        expect(indexToCoords(0, dims)).toEqual([0, 0])
        expect(indexToCoords(1, dims)).toEqual([0, 1])
        expect(indexToCoords(2, dims)).toEqual([0, 2])
        expect(indexToCoords(3, dims)).toEqual([1, 0])
        expect(indexToCoords(4, dims)).toEqual([1, 1])
        expect(indexToCoords(5, dims)).toEqual([1, 2])
    })
})

describe('helpers: flatten and unflatten', () => {
    it('flattens nested arrays deeply', () => {
        const nested = [1, [2, [3, 4], 5], 6] as const
        expect(flatten(nested)).toEqual([1, 2, 3, 4, 5, 6])
    })
    it('unflattens flat array into nested array based on dimensions', () => {
        const flat = [1, 2, 3, 4, 5, 6]
        expect(unflatten(flat, [2, 3])).toEqual([
            [1, 2, 3],
            [4, 5, 6],
        ])
    })
    it('throws on size mismatch in unflatten', () => {
        expect(() => unflatten([1, 2, 3], [2, 2])).toThrow('size mismatch')
    })
})

describe('helpers: shape', () => {
    it('returns empty shape for scalar', () => {
        expect(shape(42)).toEqual([])
    })
    it('returns correct shape for 1D arrays', () => {
        expect(shape([1, 2, 3])).toEqual([3])
    })
    it('returns correct shape for 2D arrays', () => {
        expect(
            shape([
                [1, 2, 3],
                [4, 5, 6],
            ]),
        ).toEqual([2, 3])
    })

    it('returns correct shape for 3D arrays', () => {
        expect(
            shape([
                [
                    [1, 2],
                    [3, 4],
                ],
                [
                    [5, 6],
                    [7, 8],
                ],
            ]),
        ).toEqual([2, 2, 2])
    })

    it('returns correct shape for 2D arrays of strings', () => {
        expect(
            shape([
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
            ]),
        ).toEqual([2, 3])
    })
})

describe('firstScalar', () => {
    it('retrieves the first scalar element', () => {
        const nested = [[[1], 2], 3] as const
        expect(firstScalar(nested)).toBe(1)
    })
})
