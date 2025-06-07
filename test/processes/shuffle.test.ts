import { describe, it, expect, vi, afterEach } from 'vitest'
import { shuffle } from '../../src/processes/shuffle'

describe('shuffle', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('returns a new empty array when input is empty', () => {
        const arr: number[] = []
        const result = shuffle(arr)
        expect(result).toEqual([])
        expect(result).not.toBe(arr)
    })

    it('returns a new array with the single element', () => {
        const arr = [42]
        const result = shuffle(arr)
        expect(result).toEqual([42])
        expect(result).not.toBe(arr)
    })

    it('does not mutate the original array', () => {
        const original = [1, 2, 3, 4, 5]
        const copy = [...original]
        shuffle(original)
        expect(original).toEqual(copy)
    })

    it('returns an array with the same elements (permutation)', () => {
        const arr = ['a', 'b', 'c', 'd']
        const result = shuffle(arr)
        expect(result).toHaveLength(arr.length)
        expect(result).toEqual(expect.arrayContaining(arr))
    })

    it('produces a deterministic shuffle when Math.random is mocked', () => {
        // For arr = [1,2,3], and Math.random() always returning 0.5:
        // i=2 -> j = floor(0.5 * 3) = 1  => swap positions 2 and 1: [1,3,2]
        // i=1 -> j = floor(0.5 * 2) = 1  => swap positions 1 and 1: [1,3,2]
        vi.spyOn(Math, 'random').mockReturnValue(0.5)
        const original = [1, 2, 3]
        const result = shuffle(original)
        expect(result).toEqual([1, 3, 2])
        // original stays intact
        expect(original).toEqual([1, 2, 3])
    })
})