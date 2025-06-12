import { Matrix } from '.'
import { product } from '../../core/helpers'
import { NDView, type TypedArray, type TypedArrayConstructor } from '../../core/view'
import { typeofCellsMatrix } from '../helpers'
import { type RemoveMethod } from './types'
import type { Headers } from './headers'

export function removeDim<T>(matrix: Matrix<T>, dim: number, method: RemoveMethod<T>): Matrix<T> {
    const dims = matrix.shape
    const R = dims.length
    if (dim < 0 || dim >= R) throw new Error('Matrix.remove: dim out of range')
    // bring dim to last axis
    let view = matrix.asView()
    for (let k = dim; k < R - 1; k++) {
        view = view.transpose(k, k + 1)
    }

    const N = dims[dim]
    const newDims = dims.filter((_, i) => i !== dim)

    // ensure contiguous float64 for numeric ops
    if (typeofCellsMatrix(matrix) === 'number') {
        return removeDimNumeric<T>(
            view,
            newDims,
            N,
            method,
            matrix.headers ? matrix.headers.filter((_, i) => i !== dim) : undefined,
        )
    } else if (typeofCellsMatrix(matrix) === 'string') {
        return removeDimString<T>(
            view,
            newDims,
            N,
            method,
            matrix.headers ? matrix.headers.filter((_, i) => i !== dim) : undefined,
        )
    } else if (typeofCellsMatrix(matrix) === 'boolean') {
        return removeDimBoolean<T>(
            view,
            newDims,
            N,
            method,
            matrix.headers ? matrix.headers.filter((_, i) => i !== dim) : undefined,
        )
    } else {
        throw new Error('Matrix.remove: unsupported type')
    }
}

function removeDimBoolean<T>(
    view: NDView<
        T,
        T,
        T extends number ? TypedArray : unknown[],
        T extends number ? TypedArrayConstructor : ArrayConstructor
    >,
    newDims: readonly number[],
    N: number,
    method: RemoveMethod<T>,
    newHeaders?: Headers,
) {
    const cview = (view as NDView<boolean>).contiguous(Array) as NDView<boolean>
    const flat = cview.base
    const M = product(newDims)

    const out = new Array<boolean>(M)
    for (let i = 0; i < M; i++) {
        const start = i * N
        const slice = flat.slice(start, start + N) as Array<boolean>
        let agg: boolean
        switch (method) {
            case 'and':
                agg = slice.reduce((a, b) => a && b, true)
                break
            case 'or':
                agg = slice.reduce((a, b) => a || b, false)
                break
            case 'first':
                agg = slice[0]
                break
            case 'last':
                agg = slice[N - 1]
                break
            default:
                throw new Error(`Matrix.remove: unknown method ${method}`)
        }
        out[i] = agg
    }

    const newView = new NDView<boolean>(out, newDims)
    return Matrix.from(newView, newHeaders) as Matrix<T>
}

function removeDimString<T>(
    view: NDView<
        T,
        T,
        T extends number ? TypedArray : unknown[],
        T extends number ? TypedArrayConstructor : ArrayConstructor
    >,
    newDims: readonly number[],
    N: number,
    method: RemoveMethod<T>,
    newHeaders?: Headers,
) {
    const cview = (view as NDView<string>).contiguous(Array) as NDView<string>
    const flat = cview.base

    const M = product(newDims)
    const out = new Array<string>(M)
    for (let i = 0; i < M; i++) {
        const start = i * N
        const slice = flat.slice(start, start + N) as Array<string>
        let agg: string
        switch (method) {
            case 'concat':
                agg = slice.join('')
                break
            case 'first':
                agg = slice[0]
                break
            case 'last':
                agg = slice[N - 1]
                break
            default:
                throw new Error(`Matrix.remove: unknown method ${method}`)
        }
        out[i] = agg
    }

    const newView = new NDView<string>(out, newDims)
    return Matrix.from(newView, newHeaders) as Matrix<T>
}

function removeDimNumeric<T>(
    view: NDView<
        T,
        T,
        T extends number ? TypedArray : unknown[],
        T extends number ? TypedArrayConstructor : ArrayConstructor
    >,
    newDims: readonly number[],
    N: number,
    method: RemoveMethod<T>,
    newHeaders?: Headers,
) {
    const cview = (view as NDView<number>).contiguous(Float64Array) as NDView<number>
    const flat = cview.base as Float64Array

    const M = product(newDims)
    const out = new Float64Array(M)
    for (let i = 0; i < M; i++) {
        const start = i * N
        const slice = flat.subarray(start, start + N)
        let agg: number
        switch (method) {
            case 'sum':
                agg = slice.reduce((a, b) => a + b, 0)
                break
            case 'mean':
                agg = slice.reduce((a, b) => a + b, 0) / N
                break
            case 'max':
                agg = Math.max(...slice)
                break
            case 'min':
                agg = Math.min(...slice)
                break
            case 'median': {
                const arr = Array.from(slice).sort((a, b) => a - b)
                const mid = Math.floor(N / 2)
                agg = N % 2 === 1 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2
                break
            }
            case 'first':
                agg = slice[0]
                break
            case 'last':
                agg = slice[N - 1]
                break
            default:
                throw new Error(`Matrix.remove: unknown method ${method}`)
        }
        out[i] = agg
    }

    const newView = new NDView<number>(out, newDims)
    return Matrix.from(newView, newHeaders) as Matrix<T>
}

// In-source schema tests
// qlty-ignore: qlty:similar-code
if (import.meta.vitest) {
    const { describe, it, expect } = import.meta.vitest

    describe('removeDimBoolean', () => {
        it('should remove a dimension with "and" method', () => {
            const matrix = Matrix.from([
                [true, false, true],
                [false, false, true],
                [true, true, true],
            ])
            const result = removeDimBoolean(matrix.asView(), [3], 3, 'and', matrix.headers)
            expect(result.asView().materialize()).toEqual([false, false, true])
        })

        it('should remove a dimension with "or" method', () => {
            const matrix = Matrix.from([
                [true, false, true],
                [false, false, true],
                [true, true, true],
            ])
            const result = removeDimBoolean(matrix.asView(), [3], 3, 'or', matrix.headers)
            expect(result.asView().materialize()).toEqual([true, true, true])
        })

        it('should remove a dimension with "first" method', () => {
            const matrix = Matrix.from([
                [true, false, false],
                [false, false, true],
                [true, true, true],
            ])
            const result = removeDimBoolean(matrix.asView(), [3], 3, 'first', matrix.headers)
            expect(result.asView().materialize()).toEqual([true, false, true])
        })

        it('should remove a dimension with "last" method', () => {
            const matrix = Matrix.from([
                [true, false, false],
                [false, false, true],
                [true, true, false],
            ])
            const result = removeDimBoolean(matrix.asView(), [3], 3, 'last', matrix.headers)
            expect(result.asView().materialize()).toEqual([false, true, false])
        })
    })

    describe('removeDimString', () => {
        it('should remove a dimension with "concat" method', () => {
            const matrix = Matrix.from([
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i'],
            ])
            const result = removeDimString(matrix.asView(), [3], 3, 'concat', matrix.headers)
            expect(result.asView().materialize()).toEqual(['abc', 'def', 'ghi'])
        })

        it('should remove a dimension with "first" method', () => {
            const matrix = Matrix.from([
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i'],
            ])
            const result = removeDimString(matrix.asView(), [3], 3, 'first', matrix.headers)
            expect(result.asView().materialize()).toEqual(['a', 'd', 'g'])
        })

        it('should remove a dimension with "last" method', () => {
            const matrix = Matrix.from([
                ['a', 'b', 'c'],
                ['d', 'e', 'f'],
                ['g', 'h', 'i'],
            ])
            const result = removeDimString(matrix.asView(), [3], 3, 'last', matrix.headers)
            expect(result.asView().materialize()).toEqual(['c', 'f', 'i'])
        })
    })

    describe('removeDimNumeric', () => {
        it('should remove a dimension with "sum" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'sum', matrix.headers)
            expect(result.asView().materialize()).toEqual([6, 15, 24])
        })

        it('should remove a dimension with "mean" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'mean', matrix.headers)
            expect(result.asView().materialize()).toEqual([2, 5, 8])
        })

        it('should remove a dimension with "max" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'max', matrix.headers)
            expect(result.asView().materialize()).toEqual([3, 6, 9])
        })

        it('should remove a dimension with "min" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'min', matrix.headers)
            expect(result.asView().materialize()).toEqual([1, 4, 7])
        })

        it('should remove a dimension with "median" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'median', matrix.headers)
            expect(result.asView().materialize()).toEqual([2, 5, 8])
        })
        it('should remove a dimension with "first" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'first', matrix.headers)
            expect(result.asView().materialize()).toEqual([1, 4, 7])
        })
        it('should remove a dimension with "last" method', () => {
            const matrix = Matrix.from([
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9],
            ])
            const result = removeDimNumeric(matrix.asView(), [3], 3, 'last', matrix.headers)
            expect(result.asView().materialize()).toEqual([3, 6, 9])
        })
    })
}
