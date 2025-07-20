import { vectorize } from './vectorview'
import { NDView, viewOf } from './view'
import { describe, it, expect } from 'vitest'

describe('NDView', () => {
    // Static utility
    describe('.rowMajorStrides', () => {
        it('returns empty array for empty shape', () => {
            expect(NDView.rowMajorStrides([])).toEqual([])
        })
        it('computes correct strides for [2,3,4]', () => {
            expect(NDView.rowMajorStrides([2, 3, 4])).toEqual([12, 4, 1])
        })
        it('computes correct strides for single-dimension [5]', () => {
            expect(NDView.rowMajorStrides([5])).toEqual([1])
        })
    })

    // Constructor behavior
    describe('constructor', () => {
        it('sets rank based on shape length', () => {
            const v1 = new NDView([1, 2, 3], [3])
            expect(v1.rank).toBe(1)
            const v2 = new NDView([1, 2, 3, 4], [2, 2])
            expect(v2.rank).toBe(2)
        })
        it('accepts explicit strides array', () => {
            const raw = [0, 1, 2, 3]
            const strides = [1, 2, 3]
            const v = new NDView(raw as number[], [2, 2], 0, strides)
            expect(v.strides).toBe(strides)
        })
        it('defaults to row-major strides when not provided', () => {
            const raw = Array.from({ length: 12 }, (_, i) => i)
            const shape = [2, 2, 3]
            const v = new NDView(raw, shape)
            expect(v.strides).toEqual([6, 3, 1])
        })
    })

    // Element access
    describe('.get', () => {
        it('retrieves single element with full indices', () => {
            const raw = new Float32Array([1, 2, 3, 4])
            const v = new NDView(raw, [2, 2])
            expect(v.get(0, 1)).toBe(2)
            expect(v.get(1, 0)).toBe(3)
        })
        it('throws on coords length mismatch', () => {
            const v = new NDView([1, 2, 3], [3])
            expect(() => (v as unknown as { get: (...args: unknown[]) => unknown }).get()).toThrow(
                /coords length mismatch/,
            )
            expect(() =>
                (v as unknown as { get: (...args: unknown[]) => unknown }).get(0, 1),
            ).toThrow(/coords length mismatch/)
        })
        it('retrieves sub-array with wildcard in second dim', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const sub = v.get(1, '*')
            expect(sub).toEqual([4, 5, 6])
        })
    })

    // Mutation
    describe('.set', () => {
        it('updates underlying buffer value', () => {
            const raw = [1, 2, 3, 4]
            const v = new NDView(raw as number[], [2, 2])
            v.set(99, 0, 1)
            expect(v.get(0, 1)).toBe(99)
            expect(raw[1]).toBe(99)
        })
    })

    // Slicing
    describe('.slice', () => {
        it('defaults to full slice when only dim is given', () => {
            const raw = new Uint8Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const s = v.slice(0)
            expect(s.shape).toEqual([2, 3])
            expect(s.offset).toBe(0)
        })
        it('slices with start index', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const s = v.slice(0, 1)
            expect(s.shape).toEqual([1, 3])
            expect(s.get(0, 0)).toBe(4)
            expect(s.get(0, 2)).toBe(6)
        })
        it('handles negative end index', () => {
            const raw = [1, 2, 3, 4, 5, 6]
            const v = new NDView(raw, [2, 3])
            const s = v.slice(1, 0, -1)
            // slice columns 0..(3-1) => shape [2,2]
            expect(s.shape).toEqual([2, 2])
            expect(s.materialize()).toEqual([
                [1, 2],
                [4, 5],
            ])
        })
        it('throws when slicing with dim out-of-bounds', () => {
            const raw = [1, 2, 3, 4]
            const v = new NDView(raw, [2, 2])
            expect(() => v.slice(2)).toThrow(/dim out of bounds/)
            expect(() => v.slice(-1)).toThrow(/dim out of bounds/)
        })
    })

    // Transposition
    describe('.transpose', () => {
        it('swaps first two axes by default', () => {
            const raw = new Uint16Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const t = v.transpose()
            expect(t.shape).toEqual([3, 2])
            expect(t.get(2, 1)).toBe(6)
        })
        it('returns same view for identical axes or rank<2', () => {
            const v2 = new NDView([1, 2, 3], [3])
            expect(v2.transpose()).toBe(v2)
            const v3 = new NDView([1, 2, 3, 4], [2, 2])
            expect(v3.transpose(0, 0)).toBe(v3)
        })
    })

    // Reshaping
    describe('.reshape', () => {
        it('changes to a compatible shape', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const r = v.reshape([3, 2])
            expect(r.shape).toEqual([3, 2])
            expect(r.materialize()).toEqual([
                [1, 2],
                [3, 4],
                [5, 6],
            ])
        })
        it('throws on element count mismatch', () => {
            const v = new NDView([1, 2, 3, 4], [2, 2])
            expect(() => v.reshape([4, 2])).toThrow(/element count mismatch/)
        })
        it('reshapes to 1D vector', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const r = v.reshape([6])
            expect(r.shape).toEqual([6])
            expect(r.materialize()).toEqual([1, 2, 3, 4, 5, 6])
        })
        it('reshapes to 3D array', () => {
            const raw = [1, 2, 3, 4, 5, 6]
            const v = new NDView(raw, [2, 3])
            const r = v.reshape([2, 1, 3])
            expect(r.shape).toEqual([2, 1, 3])
            expect(r.materialize()).toEqual([[[1, 2, 3]], [[4, 5, 6]]])
        })
    })

    // Contiguity
    describe('.contiguous', () => {
        it('returns same view if already packed and type matches', () => {
            const raw = new Float64Array([1, 2, 3, 4])
            const v = new NDView(raw, [2, 2])
            const c = v.contiguous(Float64Array)
            expect(c).toBe(v)
        })
        it('creates new buffer for non-packed views', () => {
            const raw = new Float32Array([1, 2, 3, 4])
            const v = new NDView(raw, [2, 2])
            const s = v.slice(0, 1) // non-zero offset
            const c = s.contiguous(Float32Array)
            expect(c).not.toBe(s)
            expect(c.base).toBeInstanceOf(Float32Array)
            expect(c.materialize()).toEqual(s.materialize())
        })
        it('converts typed array view to different type', () => {
            const raw = new Uint8Array([10, 20, 30, 40])
            const v = new NDView(raw, [2, 2])
            const c = v.contiguous(Float32Array)
            expect(c).not.toBe(v)
            expect(c.base).toBeInstanceOf(Float32Array)
            expect(c.materialize()).toEqual(v.materialize())
        })
    })

    // Emptiness
    describe('.isEmpty', () => {
        it('detects empty view for no dimensions', () => {
            const v = new NDView([42], [])
            expect(v.isEmpty()).toBe(true)
        })
        it('detects empty view when any dimension is zero', () => {
            const v = new NDView([], [2, 0, 3])
            expect(v.isEmpty()).toBe(true)
        })
        it('returns false for non-empty shapes', () => {
            const v = new NDView([1, 2, 3], [3])
            expect(v.isEmpty()).toBe(false)
        })
    })

    // Materialization and iteration
    describe('materialize and iteration', () => {
        it('materializes a 2x3 view to nested array', () => {
            const raw = new Uint8Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            expect(v.materialize()).toEqual([
                [1, 2, 3],
                [4, 5, 6],
            ])
        })
        it('iterates in row-major order with coords and values', () => {
            const raw = [10, 20, 30, 40]
            const v = new NDView(raw, [2, 2])
            const out: Array<{ coords: number[]; value: number }> = []
            for (const item of v) {
                out.push(item)
            }
            expect(out).toEqual([
                { coords: [0, 0], value: 10 },
                { coords: [0, 1], value: 20 },
                { coords: [1, 0], value: 30 },
                { coords: [1, 1], value: 40 },
            ])
        })
        it('materializes a 1D view to flat array', () => {
            const raw = [7, 8, 9]
            const v = new NDView(raw, [3])
            expect(v.materialize()).toEqual([7, 8, 9])
        })
        it('materializes a scalar (0-dim) view', () => {
            const v = new NDView([99], [])
            expect(v.materialize()).toBe(99)
        })

        it('materializes a 1D view to flat array', () => {
            const raw = new Float32Array([1, 2, 3])
            const v = new NDView(raw, [3])
            expect(v.materialize()).toEqual([1, 2, 3])
        })
        it('materializes a 3D view to nested array', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8])
            const v = new NDView(raw, [2, 2, 2])
            expect(v.materialize()).toEqual([
                [
                    [1, 2],
                    [3, 4],
                ],
                [
                    [5, 6],
                    [7, 8],
                ],
            ])
        })
        it('materializes a 3D view to flat array', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            expect(v.materialize()).toEqual([
                [1, 2, 3],
                [4, 5, 6],
            ])
        })
    })

    // Factory
    describe('viewOf', () => {
        it('wraps nested numeric arrays into NDView', () => {
            const arr = [
                [1, 2],
                [3, 4],
            ]
            const v = viewOf(arr, Float32Array)
            expect(v.shape).toEqual([2, 2])
            expect(v.materialize()).toEqual(arr)
            expect(v.base).toBeInstanceOf(Float32Array)
        })
        it('accepts custom typed array constructor', () => {
            const arr = [1, 2, 3]
            const v = viewOf(arr, Int16Array)
            expect(v.shape).toEqual([3])
            expect(v.base).toBeInstanceOf(Int16Array)
        })
        it('returns empty NDView for empty array', () => {
            const v = viewOf([], Uint8Array)
            expect(v.shape).toEqual([0])
            expect(v.base).toEqual([])
            expect(v.isEmpty()).toBe(true)
        })
        it('wraps nested non-numeric arrays into NDView', () => {
            const arr = [['a']]
            const v = viewOf(arr)
            expect(v.shape).toEqual([1, 1])
            expect(v.materialize()).toEqual(arr)
            expect(v.base).toEqual(['a'])
        })
        it('wraps nested 3D numeric arrays into NDView', () => {
            const arr = [
                [
                    [1, 2],
                    [3, 4],
                ],
                [
                    [5, 6],
                    [7, 8],
                ],
            ]
            const v = viewOf(arr)
            expect(v.shape).toEqual([2, 2, 2])
            expect(v.materialize()).toEqual(arr)
            expect(v.base).toBeInstanceOf(Array)
        })
    })

    describe('vectorize', () => {
        it('vectorizes a 2D view into row vectors by default (last axis)', () => {
            const raw = new Float32Array([1, 2, 3, 4, 5, 6])
            const v = new NDView(raw, [2, 3])
            const rows = Array.from(vectorize(v))
            // Expect 2 rows of length 3
            expect(rows).toHaveLength(2)
            expect(rows[0].coords).toEqual([0])
            expect(rows[0].value).toBeInstanceOf(Float32Array)
            expect(Array.from(rows[0].value)).toEqual([1, 2, 3])
            expect(rows[1].coords).toEqual([1])
            expect(Array.from(rows[1].value)).toEqual([4, 5, 6])
        })

        it('vectorizes a 3D view into vectors along the last axis', () => {
            const raw = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])
            const v3 = new NDView(raw, [2, 2, 2])
            const result = Array.from(vectorize(v3))
            // newShape = [2,2], so 4 vectors of length 2
            expect(result).toHaveLength(4)
            expect(result.map(r => r.coords)).toEqual([
                [0, 0],
                [0, 1],
                [1, 0],
                [1, 1],
            ])
            const values = result.map(r => Array.from(r.value))
            expect(values).toEqual([
                [1, 2],
                [3, 4],
                [5, 6],
                [7, 8],
            ])
        })

        it('throws if dimension is out of bounds', () => {
            const v = new NDView([1, 2, 3, 4], [2, 2])
            expect(() => vectorize(v, { dim: -1 })).toThrow(/dim out of bounds/)
            expect(() => vectorize(v, { dim: 2 })).toThrow(/dim out of bounds/)
        })
    })

    describe('.traverse', () => {
        it('traverses a 3D view return vectors', () => {
            const view = new NDView([1, 2, 3, 4, 5, 6, 7, 8], [2, 2, 2])
            const result = Array.from(view.traverse(1))

            expect(result).toEqual([
                { coords: [0, 0], value: [1, 2] },
                { coords: [0, 1], value: [3, 4] },
                { coords: [1, 0], value: [5, 6] },
                { coords: [1, 1], value: [7, 8] },
            ])
        })

        it('traverses a 2D view producing full matrix as a single element', () => {
            const view = new NDView([1, 2, 3, 4, 5, 6], [2, 3])
            const result = Array.from(view.traverse(2))
            expect(result).toEqual([
                {
                    coords: [],
                    value: [
                        [1, 2, 3],
                        [4, 5, 6],
                    ],
                },
            ])
        })
    })
})
