import { toArrayBuffer, fromArrayBuffer } from './io'
import { describe, it, expect } from 'vitest'

describe('io: serialization and deserialization', () => {
    it('round-trips nested arrays with default dtype', () => {
        const nested = [
            [1, 2],
            [3, 4],
        ]
        const buf = toArrayBuffer(nested)
        const view = fromArrayBuffer(buf)
        expect(view.shape).toEqual([2, 2])
        expect(view.get(0, 0)).toBe(1)
        expect(view.get(1, 1)).toBe(4)
    })
    it('supports float64 dtype round-trip', () => {
        const nested = [
            [1.5, 2.5],
            [3.5, 4.5],
        ]
        const buf = toArrayBuffer(nested, 'float64')
        const view = fromArrayBuffer(buf, 'float64')
        expect(view.shape).toEqual([2, 2])
        expect(view.get(0, 1)).toBeCloseTo(2.5)
        expect(view.get(1, 0)).toBeCloseTo(3.5)
    })

    it('supports float32 dtype round-trip', () => {
        const nested = [
            [1.5, 2.5],
            [3.5, 4.5],
        ]
        const buf = toArrayBuffer(nested, 'float32')
        const view = fromArrayBuffer(buf, 'float32')
        expect(view.shape).toEqual([2, 2])
        expect(view.get(0, 1)).toBeCloseTo(2.5)
        expect(view.get(1, 0)).toBeCloseTo(3.5)
    })

    it('supports uint8 dtype round-trip', () => {
        const nested = [
            [1, 2],
            [3, 4],
        ]
        const buf = toArrayBuffer(nested, 'uint8')
        const view = fromArrayBuffer(buf, 'uint8')
        expect(view.shape).toEqual([2, 2])
        expect(view.get(0, 1)).toBeCloseTo(2)
        expect(view.get(1, 0)).toBeCloseTo(3)
    })
})
