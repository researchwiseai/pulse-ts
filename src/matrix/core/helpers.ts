import type { NestedArray } from './basic'

/**
 * Calculates the product of all numbers in the provided array.
 *
 * @param dims - A readonly array of numbers to multiply together.
 * @returns The cumulative product of the array's entries, or 1 if the array is empty.
 */
export const product = (dims: readonly number[]) => dims.reduce((a, b) => a * b, 1)

/**
 * Converts a zero-based linear index into its multi-dimensional coordinates.
 *
 * @remarks
 * Treats the dimensions in `dims` as specifying a row-major layout.
 * Starting from the last dimension, it computes each coordinate
 * by taking the remainder and dividing the index by the dimension size.
 *
 * @param idx - The zero-based linear index to convert.
 * @param dims - A readonly array of positive integers representing the size of each dimension.
 * @returns A new array of length `dims.length`, where each element is the coordinate
 *          in the corresponding dimension.
 *
 * @example
 * ```ts
 * // For a 2×3 matrix (2 rows, 3 columns), row-major:
 * // Linear indices: 0→[0,0], 1→[0,1], 2→[0,2],
 * //                 3→[1,0], 4→[1,1], 5→[1,2]
 * indexToCoords(4, [2, 3]); // returns [1, 1]
 * ```
 */
export function indexToCoords(idx: number, dims: readonly number[]): number[] {
    const c = new Array(dims.length)
    for (let k = dims.length - 1; k >= 0; k--) {
        c[k] = idx % dims[k]
        idx = Math.floor(idx / dims[k])
    }
    return c
}

/**
 * Recursively flattens a nested array into a one-dimensional array.
 *
 * @typeParam T - The type of elements contained in the nested array.
 * @param arr - The nested array to be flattened.
 * @returns A new array containing all elements from the nested input, in depth-first order.
 *
 * @remarks This function handles arrays of arbitrary depth, converting structures like
 *         `T`, `T[]`, `T[][]`, etc., into a single array of type `T[]`. It is different
 *        from `Array.prototype.flat()` in that it does not take a depth argument.
 *
 * @example
 * ```ts
 * const nested = [1, [2, [3, 4], 5], 6];
 * const flat = flatten(nested);
 * // flat => [1, 2, 3, 4, 5, 6]
 * ```
 */
export function flatten<T>(arr: NestedArray<T>): T[] {
    const out: T[] = []
    ;(function walk(n: NestedArray<T>) {
        if (Array.isArray(n)) {
            n.forEach(walk)
        } else {
            out.push(n)
        }
    })(arr)
    return out
}

/**
 * Converts a one-dimensional array into a nested (multidimensional) array structure
 * according to the provided dimensions.
 *
 * @typeParam T - The type of elements in the input flat array.
 * @param flat - A readonly array of elements to be reorganized into nested arrays.
 * @param dims - A readonly array of positive integers specifying the size of each dimension
 *               in the resulting nested structure.
 * @returns A `NestedArray<T>` whose depth matches `dims.length`, with each level's length
 *          corresponding to the respective dimension in `dims`.
 * @throws {Error} If the product of all entries in `dims` does not equal `flat.length`.
 */
export function unflatten<T>(flat: readonly T[], dims: readonly number[]): NestedArray<T> {
    if (product(dims) !== flat.length) throw new Error('size mismatch')
    const build = (lvl: number, off: number): NestedArray<T> =>
        lvl === dims.length
            ? (flat[off] as T)
            : Array.from({ length: dims[lvl] }, (_, i) =>
                  build(lvl + 1, off + i * product(dims.slice(lvl + 1))),
              )
    return build(0, 0)
}

/**
 * Computes the shape (dimensions) of a nested array.
 *
 * Iteratively traverses the array levels, recording the length at each depth
 * until a non-array element is encountered.
 *
 * @param arr - A nested array of arbitrary depth.
 * @returns An array of numbers where each entry represents the length
 *          of the array at that particular dimension.
 */
export const shape = (arr: NestedArray<unknown>): number[] => {
    const d: number[] = []
    let cur: unknown = arr
    while (Array.isArray(cur)) {
        d.push(cur.length)
        cur = cur[0]
    }
    return d
}

/**
 * Recursively checks if a (potentially nested) array is empty.
 *
 * An array is considered empty if:
 * 1. It has a length of 0.
 * 2. Or, all of its elements are themselves considered empty by this function.
 *
 * If the input `arr` is not an array, it is considered non-empty (the function returns `false`).
 * This means that any non-array element encountered within the nested structure is treated as content,
 * making its containing array (and any arrays above it in the hierarchy) non-empty.
 *
 * @param arr - The value to check. While typed as `NestedArray<unknown>`, the function
 *              will return `false` if a non-array is passed directly.
 * @returns `true` if `arr` represents an empty nested array structure, `false` otherwise.
 *
 * @example
 * ```typescript
 * isEmpty([]); // true
 * isEmpty([[]]); // true
 * isEmpty([[], [[], []]]); // true
 *
 * isEmpty([1]); // false (because 1 is not an array, isEmpty(1) is false, so [1] is not all empty arrays)
 * isEmpty([[], [1]]); // false (due to the presence of 1)
 *
 * // Behavior for direct non-array inputs:
 * isEmpty(1); // false
 * isEmpty(null); // false
 * isEmpty(undefined); // false
 * ```
 */
export const isEmpty = (arr: NestedArray<unknown>) => {
    if (Array.isArray(arr)) {
        return arr.length === 0 || arr.every(isEmpty)
    }
    return false
}

/**
 * Retrieves the first non-array (scalar) element from a nested array structure.
 *
 * @typeParam T - The type of the elements contained in the nested array.
 * @param m - A potentially nested array of values of type T.
 * @returns The first scalar value of type T encountered by recursively drilling into the nested array.
 */
export function firstScalar<T>(m: NestedArray<T>): T {
    let cur: NestedArray<T> | T = m
    while (Array.isArray(cur)) cur = cur[0] // keep drilling
    return cur as T
}

/**
 * Determines the JavaScript type of the first scalar element in a matrix or nested array.
 *
 * @typeParam T - The element type contained within the matrix or nested arrays.
 * @param x - A `Matrix<T>` instance or a nested array of type `T`.
 * @returns The result of applying JavaScript's `typeof` operator to the first scalar value found in `x`.
 */
export function typeofCells<T>(x: NestedArray<T>) {
    return typeof firstScalar(x)
}
