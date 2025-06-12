import { describe, it, expect } from 'vitest'
import { Matrix } from '.'
import { type Matrix2D } from '../broadcast'
import { UQInt } from '../../core'

describe('Matrix', () => {
    it('constructs and materializes with from/value', () => {
        const arr = [
            [1, 2],
            [3, 4],
        ]
        const m = Matrix.from(arr)
        expect(m.shape).toEqual([2, 2])
        expect(m.value()).toEqual(arr)
    })

    it('sum and mean', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        expect(m.sum()).toBe(10)
        expect(m.mean()).toBe(2.5)
    })

    it('maps and reduces', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        const m2 = m.map(v => v * 2)
        expect(m2.value()).toEqual([
            [2, 4],
            [6, 8],
        ])
        const red = m.reduce((acc, v) => acc + v, 0)
        expect(red).toBe(10)
    })

    it('quantise and dequantise', () => {
        const m = Matrix.from([
            [0.1, -0.2],
            [0.5, 1],
        ])
        const q = m.quantise()
        const dq = q.dequantise()
        const vals = dq.value<Matrix2D<number>>()
        expect(vals[0][0]).toBeCloseTo(0.1, 2)
        expect(vals[0][1]).toBeCloseTo(-0.2, 2)
        expect(vals[1][0]).toBeCloseTo(0.5, 2)
        expect(vals[1][1]).toBeCloseTo(1, 5)
    })
    it('quantise and dequantise with unsigned option', () => {
        const m = Matrix.from([
            [0, 1, 0.5],
            [0.2, 0, 0.4],
        ])
        const q = m.quantise({ unsigned: true })
        // Raw quantized values should span [0, 255] for [-1, 1].
        const qVals = q.value<Matrix2D<UQInt>>()
        expect(qVals[0][0]).toBe(0)
        expect(qVals[0][1]).toBe(255)
        expect(qVals[0][2]).toBe(128)

        expect(qVals[1][0]).toBe(51)
        expect(qVals[1][1]).toBe(0)
        expect(qVals[1][2]).toBe(102)

        const dq = q.dequantise({ unsigned: true })
        const vals = dq.value<Matrix2D<number>>()
        expect(vals[0][0]).toBeCloseTo(0, 5)
        expect(vals[0][1]).toBeCloseTo(1, 5)
        expect(vals[0][2]).toBeCloseTo(0.5, 2)

        expect(vals[1][0]).toBeCloseTo(0.2, 2)
        expect(vals[1][1]).toBeCloseTo(0, 5)
        expect(vals[1][2]).toBeCloseTo(0.4, 2)
    })

    it('transposes, reshapes, and slices', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        expect(m.transpose().value()).toEqual([
            [1, 3],
            [2, 4],
        ])
        expect(m.reshape([4]).value()).toEqual([1, 2, 3, 4])
        expect(m.slice(0, 1).value()).toEqual([[3, 4]])
    })

    it('add adds innermost dimension', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        const mAdd = m.add(v => [v, v + 1])
        expect(mAdd.shape).toEqual([2, 2, 2])
        expect(mAdd.value()).toEqual([
            [
                [1, 2],
                [2, 3],
            ],
            [
                [3, 4],
                [4, 5],
            ],
        ])
    })

    it('wrap adds outermost dimension', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        const mWrap = m.wrap(v => [v, v + 1])
        expect(mWrap.shape).toEqual([2, 2, 2])
        expect(mWrap.value()).toEqual([
            [
                [1, 2],
                [3, 4],
            ],
            [
                [2, 3],
                [4, 5],
            ],
        ])
    })

    it('remove collapses a dimension', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        const sum0 = m.remove(0, 'sum')
        expect(sum0.shape).toEqual([2])
        expect(sum0.value()).toEqual([4, 6])
        const sum1 = m.remove(1, 'sum')
        expect(sum1.shape).toEqual([2])
        expect(sum1.value()).toEqual([3, 7])
    })

    it('encode/decode roundtrip', () => {
        const m = Matrix.from([
            [1, 2],
            [3, 4],
        ])
        const buf = m.encode('float32')
        const m2 = Matrix.decode(buf, 'float32')
        expect(m2.value()).toEqual([
            [1, 2],
            [3, 4],
        ])
    })

    it('static generate', async () => {
        const { matrix } = await Matrix.generate({
            iterables: [
                ['a', 'b'],
                ['x', 'y'],
            ],
            fn: coords => Promise.resolve({ result: coords.join('-') }),
        })
        expect(matrix.shape).toEqual([2, 2])
        expect(matrix.value()).toEqual([
            ['a-x', 'a-y'],
            ['b-x', 'b-y'],
        ])
    })
})

describe('Matrix axis options', () => {
    it('sum axis reduces correctly', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        const r = m.sum({ axis: 1 })
        expect(r.shape).toEqual([2])
        expect(r.value()).toEqual([6, 15])
    })
    it('mean axis reduces correctly', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        const r = m.mean({ axis: 1 })
        expect(r.shape).toEqual([2])
        expect(r.value()).toEqual([2, 5])
    })
    it('vectorize returns sub-vector matrix', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        const v = m.vectorize(1)
        expect(v.shape).toEqual([2])
        const vals = v.value<Matrix2D<number>>()
        expect(vals[0]).toBeInstanceOf(Array)
        expect(Array.from(vals[0])).toEqual([1, 2, 3])
        expect(Array.from(vals[1])).toEqual([4, 5, 6])
    })
    it('max axis reduces correctly', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        const r = m.max({ axis: 1 })
        expect(r.shape).toEqual([2])
        expect(r.value()).toEqual([3, 6])
    })
    it('min axis reduces correctly', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        const r = m.min({ axis: 1 })
        expect(r.shape).toEqual([2])
        expect(r.value()).toEqual([1, 4])
    })
    it('median axis reduces correctly', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        const r = m.median({ axis: 1 })
        expect(r.shape).toEqual([2])
        expect(r.value()).toEqual([2, 5])
    })
    it('global max, min, and median', () => {
        const m = Matrix.from([
            [1, 2, 3],
            [4, 5, 6],
        ])
        expect(m.max()).toBe(6)
        expect(m.min()).toBe(1)
        expect(m.median()).toBe(3.5)
    })
})
