import { describe, it, expect } from 'vitest'
import { makeSelfChunks, makeCrossBodies, stitchResults, MAX_ITEMS } from '../src/core/batching'

describe('makeSelfChunks', () => {
    it('returns a single chunk when length <= MAX_ITEMS', () => {
        const items = [1, 2, 3]
        const chunks = makeSelfChunks(items)
        expect(chunks).toEqual([items])
    })

    it('splits into chunks of size <= HALF_CHUNK when length > MAX_ITEMS', () => {
        const total = MAX_ITEMS + 1
        const items = Array.from({ length: total }, (_, i) => i)
        const chunks = makeSelfChunks(items)
        expect(chunks.length).toBe(2)

        expect(chunks[0]?.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(chunks[1]?.length).toBeLessThanOrEqual(MAX_ITEMS)
    })
})

describe('makeCrossBodies', () => {
    it('returns a single body when combined length <= MAX_ITEMS', () => {
        const setA = [1, 2, 3]
        const setB = [4, 5, 6]
        const bodies = makeCrossBodies(setA, setB, true)
        expect(bodies).toEqual([{ setA, setB, flatten: true }])
    })

    it('chunks only larger side when combined > MAX_ITEMS', () => {
        const small = Math.floor(MAX_ITEMS / 4)
        const large = Math.round(MAX_ITEMS * 2)
        const setA = Array.from({ length: small }, (_, i) => i)
        const setB = Array.from({ length: large }, (_, i) => i)
        const bodies = makeCrossBodies(setA, setB, false)
        expect(bodies.length).toBe(2)
        expect(bodies[0]?.setA.length).toBe(small)
        expect((bodies[0]?.setB.length ?? 0) + (bodies[1]?.setB.length ?? 0)).toBe(large)
    })

    it('chunks both sides when both sets are large', () => {
        const sizeA = MAX_ITEMS * 2
        const sizeB = MAX_ITEMS * 2
        const setA = Array.from({ length: sizeA }, (_, i) => i)
        const setB = Array.from({ length: sizeB }, (_, i) => i)
        const bodies = makeCrossBodies(setA, setB, true)

        expect(bodies.length).toBe(4)

        expect(bodies[0]?.setA.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[0]?.setB.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[1]?.setA.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[1]?.setB.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[2]?.setA.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[2]?.setB.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[3]?.setA.length).toBeLessThanOrEqual(MAX_ITEMS)
        expect(bodies[3]?.setB.length).toBeLessThanOrEqual(MAX_ITEMS)
    })
})

describe('stitchResults', () => {
    it('returns the original matrix for a single self-comparison chunk', () => {
        const full = [0, 1, 2]
        const matrix = [
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ]
        const result = stitchResults([{ matrix }], [], full, full)
        expect(result).toEqual(matrix)
    })

    it('returns the block matrix for a single cross-comparison chunk', () => {
        const fullA = [0, 1]
        const fullB = [2, 3, 4]
        const block = [
            [10, 11, 12],
            [20, 21, 22],
        ]
        const result = stitchResults([{ matrix: block }], [], fullA, fullB)
        expect(result).toEqual(block)
    })
})
