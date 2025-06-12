/**
 * Constructs a tuple type of length `N`, where each element is of type `T`.
 *
 * @typeParam T - The type of each element in the resulting tuple.
 * @typeParam N - The desired length of the tuple.
 * @typeParam R - (Internal) Accumulator used during recursive construction.
 *
 * This recursive type builds up an intermediate tuple `R` by prepending
 * `T` until its length matches `N`, at which point the accumulated
 * tuple is returned.
 */
export type BuildTuple<T, N extends number, R extends T[] = T[]> = R['length'] extends N
    ? R
    : BuildTuple<T, N, [T, ...R]>

/**
 * A fixed-length tuple of elements of type T, with its length enforced at compile time.
 *
 * Combines a BuildTuple of T and N to create an N‐element tuple and adds a readonly
 * length property equal to N.
 *
 * @typeParam T - The type of each element in the vector.
 * @typeParam N - The exact number of elements in the vector.
 */
export type Vector<T, N extends number = number> = BuildTuple<T, N> & {
    readonly length: N
}

/**
 * A two-dimensional matrix type composed of R rows and C columns.
 * Each row is represented as a Vector of length C, and the matrix
 * consists of R such row vectors.
 *
 * @template T - The type of elements contained in the matrix.
 * @template R - The number of rows in the matrix.
 * @template C - The number of columns in the matrix.
 */
export type Matrix2D<T, R extends number = number, C extends number = number> = Vector<
    Vector<T, C>,
    R
>

/**
 * A three-dimensional matrix type composed of R rows, C columns,
 * and D depth. Each row is represented as a Vector of length C,
 * and the matrix consists of R such row vectors, each containing
 * D depth vectors.
 *
 * @template T - The type of elements contained in the matrix.
 * @template R - The number of rows in the matrix.
 * @template C - The number of columns in the matrix.
 * @template D - The depth of the matrix.
 */
export type Matrix3D<
    T,
    R extends number = number,
    C extends number = number,
    D extends number = number,
> = Vector<Vector<Vector<T, C>, D>, R>

/**
 * A three-dimensional matrix type composed of R rows, C columns,
 * and D depth. Each row is represented as a Vector of length C,
 * and the matrix consists of R such row vectors, each containing
 * D depth vectors.
 */

/**
 * Applies a binary numeric operation to two inputs using NumPy‐style broadcasting.
 *
 * @param a - A number or an array (possibly nested) of numbers.
 * @param b - A number or an array (possibly nested) of numbers.
 * @param op - A function that takes two numbers and returns a number.
 * @returns A number or nested array of numbers matching the broadcast shape of `a` and `b`.
 *
 * @throws Error if:
 *   - Both `a` and `b` are arrays whose lengths differ and neither has length 1.
 *   - Either `a` or `b` is not a number or an array of numbers.
 *
 * @remarks
 * - If both `a` and `b` are numbers, returns `op(a, b)`.
 * - If one of them is a number, applies `op` between that number and each element of the other.
 * - If both are arrays, aligns their lengths; if one length is 1, its single element is reused.
 * - Recursively applies the above rules for nested arrays.
 */
function _bin(a: unknown, b: unknown, op: (x: number, y: number) => number): unknown {
    if (typeof a === 'number' && typeof b === 'number') return op(a, b)
    if (typeof a === 'number') return (b as unknown[]).map(v => _bin(a, v, op))
    if (typeof b === 'number') return (a as unknown[]).map(v => _bin(v, b, op))
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length && a.length !== 1 && b.length !== 1)
            throw new Error('broadcast mismatch')
        const n = Math.max(a.length, b.length)
        return Array.from({ length: n }, (_, i) => _bin(a[i % a.length], b[i % b.length], op))
    }
    throw new Error('unsupported types')
}

// add
export function add(a: number, b: number): number
export function add<V extends number>(a: Vector<V>, b: number): Vector<V>
export function add<V extends number>(a: number, b: Vector<V>): Vector<V>
export function add<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: number,
): Matrix2D<number, R, C>
export function add<R extends number, C extends number>(
    a: number,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function add<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Vector<number, C>,
): Matrix2D<number, R, C>
export function add<R extends number, C extends number>(
    a: Vector<number, R>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function add<R extends number, C extends number>(
    a: Vector<number, R>,
    b: Vector<number, C>,
): Matrix2D<number, R, C>
export function add<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
/**
 * Computes the element-wise sum of two values, applying broadcasting rules if needed.
 *
 * @param a - The first operand, which can be a number or an array-like structure of numbers.
 * @param b - The second operand, which can be a number or an array-like structure, broadcast-compatible with `a`.
 * @returns The result of adding `a` and `b`, preserving the broadcasted shape, as an unknown-typed value.
 *
 * @remarks
 * Internally delegates to `_bin` with the addition callback `(x, y) => x + y`.
 *
 * @throws If `a` and `b` cannot be broadcast together or contain non-numeric elements.
 */
export function add(a: unknown, b: unknown): unknown {
    return _bin(a, b, (x: number, y: number) => x + y)
}

// subtract
export function sub(a: number, b: number): number
export function sub<V extends number>(a: Vector<V>, b: number): Vector<V>
export function sub<V extends number>(a: number, b: Vector<V>): Vector<V>
export function sub<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: number,
): Matrix2D<number, R, C>
export function sub<R extends number, C extends number>(
    a: number,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function sub<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Vector<number, C>,
): Matrix2D<number, R, C>
export function sub<R extends number, C extends number>(
    a: Vector<number, R>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function sub<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
/**
 * Subtracts `b` from `a`, supporting element-wise subtraction with broadcasting.
 *
 * @param a - The minuend, which can be a number or an array-like/nested structure.
 * @param b - The subtrahend, which must be compatible with `a` for broadcasting.
 * @returns The result of subtracting `b` from `a`, preserving the input structure.
 */
export function sub(a: unknown, b: unknown): unknown {
    return _bin(a, b, (x: number, y: number) => x - y)
}

// multiply
export function mul(a: number, b: number): number
export function mul<V extends number>(a: Vector<V>, b: number): Vector<V>
export function mul<V extends number>(a: number, b: Vector<V>): Vector<V>
export function mul<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: number,
): Matrix2D<number, R, C>
export function mul<R extends number, C extends number>(
    a: number,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function mul<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Vector<number, C>,
): Matrix2D<number, R, C>
export function mul<R extends number, C extends number>(
    a: Vector<number, R>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function mul<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
/**
 * Performs an element-wise multiplication of two inputs using broadcasting rules.
 *
 * This function accepts numbers or nested array/typed-array structures,
 * and applies the multiplication operation across corresponding elements.
 * If one operand is a scalar and the other is an array-like structure,
 * the scalar is broadcast to match the shape of the array.
 *
 * @param a - The left operand; can be a number or an array/typed-array (possibly nested).
 * @param b - The right operand; can be a number or an array/typed-array (possibly nested).
 * @returns The product of `a` and `b` with the same structure (shape) as the broadcasted inputs.
 * @throws If the inputs have incompatible shapes or contain non-numeric values.
 */
export function mul(a: unknown, b: unknown): unknown {
    return _bin(a, b, (x: number, y: number) => x * y)
}

// divide
export function div(a: number, b: number): number
export function div<V extends number>(a: Vector<V>, b: number): Vector<V>
export function div<V extends number>(a: number, b: Vector<V>): Vector<V>
export function div<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: number,
): Matrix2D<number, R, C>
export function div<R extends number, C extends number>(
    a: number,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function div<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Vector<number, C>,
): Matrix2D<number, R, C>
export function div<R extends number, C extends number>(
    a: Vector<number, R>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function div<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function div(a: unknown, b: unknown): unknown {
    return _bin(a, b, (x: number, y: number) => x / y)
}

// power
export function pow(a: number, b: number): number
export function pow<V extends number>(a: Vector<V>, b: number): Vector<V>
export function pow<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: number,
): Matrix2D<number, R, C>
export function pow<R extends number, C extends number>(
    a: number,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function pow<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Vector<number, C>,
): Matrix2D<number, R, C>
export function pow<R extends number, C extends number>(
    a: Vector<number, R>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
export function pow<R extends number, C extends number>(
    a: Matrix2D<number, R, C>,
    b: Matrix2D<number, R, C>,
): Matrix2D<number, R, C>
/**
 * Computes the element-wise exponentiation of two inputs, broadcasting their shapes if necessary.
 *
 * This function uses a binary operation helper to apply the power operator (`**`)
 * to numeric values. When provided with arrays or matrices, it broadcasts them to
 * compatible shapes before performing the computation.
 *
 * @param a - The base value or collection of values.
 * @param b - The exponent value or collection of values.
 * @returns The result of raising each element of `a` to the corresponding element of `b`,
 *          with the shape determined by broadcasting rules.
 */
export function pow(a: unknown, b: unknown): unknown {
    return _bin(a, b, (x: number, y: number) => x ** y)
}
