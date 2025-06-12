// Import NestedArray type directly from core/basic to avoid circular re-exports
import { firstScalar } from '../core/helpers'
import type { NestedArray } from '../core/basic'
import { Matrix } from './matrix/index'
import type { FlatBuffer } from '../core/view'

/**
 * Determines the JavaScript type of the first scalar element in a matrix or nested array.
 *
 * @typeParam T - The element type contained within the matrix or nested arrays.
 * @param x - A `Matrix<T>` instance or a nested array of type `T`.
 * @returns The result of applying JavaScript's `typeof` operator to the first scalar value found in `x`.
 */
export function typeofCellsMatrix<T>(x: Matrix<T> | NestedArray<T>): string {
    const scalar = x instanceof Matrix ? x.asView().base[x.asView().offset] : firstScalar(x)
    return typeof scalar
}

// Compute cosine similarity between two vectors
export function cosineSimilarity(a: FlatBuffer<number>, b: FlatBuffer<number>): number {
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}
