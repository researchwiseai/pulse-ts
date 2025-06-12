import type { NestedArray } from './basic'
import { product, indexToCoords, flatten, unflatten, shape, isEmpty, typeofCells } from './helpers'

/**
 * Represents all built‐in JavaScript typed array types we support.
 *
 * This union type covers:
 * - Int8Array
 * - Uint8Array
 * - Uint8ClampedArray
 * - Int16Array
 * - Uint16Array
 * - Int32Array
 * - Uint32Array
 * - Float32Array
 * - Float64Array
 *
 * Use this alias when a function or API should accept or work with
 * any standard typed array instance.
 */
export type TypedArray =
    | Int8Array
    | Uint8Array
    | Uint8ClampedArray
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

/**
 * A union of constructors for all built-in JavaScript TypedArray classes.
 *
 * This type can be used wherever you need to accept or work with any of the
 * standard typed array constructors, such as when creating views over an
 * ArrayBuffer or performing generic numeric operations.
 *
 * Included constructors:
 * - Int8ArrayConstructor
 * - Uint8ArrayConstructor
 * - Uint8ClampedArrayConstructor
 * - Int16ArrayConstructor
 * - Uint16ArrayConstructor
 * - Int32ArrayConstructor
 * - Uint32ArrayConstructor
 * - Float32ArrayConstructor
 * - Float64ArrayConstructor
 *
 * @public
 */
export type TypedArrayConstructor =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Uint8ClampedArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor

/**
 * A contiguous, flat buffer of elements of type `T`, represented as either a standard array or a built-in TypedArray.
 *
 * This alias is useful for handling raw binary or numeric data in performance-critical contexts,
 * such as WebGL, WebAssembly interoperability, or low-level computations.
 *
 * @template T - The element type contained in the buffer.
 */
export type FlatBuffer<T> = T[] | TypedArray

/**
 * A generic N-dimensional view over a flat buffer, enabling efficient slicing,
 * transposition, reshaping, and iteration without unnecessary data copies.
 *
 * @typeParam T - The type of elements stored in the underlying buffer.
 *
 * @remarks
 * Internally, the view maintains:
 * - `base`: the flat buffer of type `FlatBuffer<T>`,
 * - `shape`: the dimensions of the view,
 * - `offset`: the starting linear index within the buffer,
 * - `strides`: the step sizes for each dimension in row‐major order.
 *
 * The view supports:
 * - Accessing elements via `get(...)` and `set(...)` by multi-dimensional coordinates.
 * - Creating subviews via `slice(dim, start, end)`.
 * - Swapping dimensions via `transpose(a0, a1)`.
 * - Changing the shape (if total element count remains constant) via `reshape(newShape)`.
 * - Ensuring contiguous memory layout via `contiguous(TypedArrayConstructor)`.
 * - Materializing the view into a nested JavaScript array via `materialize()`.
 * - Iterating over all elements, yielding `{ coords, value }` pairs.
 *
 * @example
 * ```ts
 * const raw = new Float32Array([1, 2, 3, 4, 5, 6]);
 * const view = new NDView(raw, [2, 3]);       // 2×3 matrix
 * const sub = view.slice(1, 1);               // last row, from column 1 to end
 * sub.set(42, 0, 0);                           // sets raw[1*3 + 1] = 42
 *
 * for (const { coords, value } of view) {
 *   console.log(`at [${coords.join(",")}] = ${value}`);
 * }
 * ```
 *
 * @param base    - The underlying flat buffer that stores elements.
 * @param shape   - An array of positive integers specifying the size in each dimension.
 * @param offset  - The initial linear offset into the buffer (default: `0`).
 * @param strides - The stride lengths for each dimension. If omitted, computed in row-major order.
 */
export class NDView<
    T = number,
    BehaviorType = T,
    Typed extends BehaviorType & {
        [Symbol.hasInstance]: (instance: Typed) => boolean
    } extends number
        ? TypedArray
        : unknown[] = BehaviorType extends number ? TypedArray : Array<unknown>,
    TypedConstructor extends BehaviorType & {
        [Symbol.hasInstance]: (instance: Typed) => boolean
    } extends number
        ? TypedArrayConstructor
        : ArrayConstructor = BehaviorType extends number ? TypedArrayConstructor : ArrayConstructor,
> implements Iterable<{ coords: number[]; value: T }>
{
    /**
     * The rank of this entity within its context.
     *
     * A numeric value used to determine ordering, where higher values
     * typically imply greater precedence. Must be a non-negative integer.
     *
     * @remarks
     * This property is immutable once initialized.
     */
    readonly rank: number

    /**
     * Initializes a new N-dimensional view over a flat buffer.
     *
     * @param base - The flat buffer containing the underlying data.
     * @param shape - An array of lengths for each dimension of the view.
     * @param offset - The starting index within the buffer where the view begins. Defaults to 0.
     * @param strides - The number of elements to skip to move one step along each axis.
     *                  Defaults to row-major strides computed from the given shape.
     */
    constructor(
        public readonly base: FlatBuffer<T>,
        public readonly shape: readonly number[],
        public readonly offset = 0,
        public readonly strides: readonly number[] = NDView.rowMajorStrides(shape),
    ) {
        this.rank = shape.length
    }

    /**
     * Computes the row‐major memory strides for a given tensor shape.
     *
     * Given an N-dimensional shape, this method returns an array of length N
     * where each entry represents the stride (in number of elements) you must
     * move in the flattened buffer to advance by one unit along that dimension
     * in row-major order.
     *
     * @param shape - A readonly array of positive integers representing the size of each dimension.
     * @returns An array of strides corresponding to the row-major layout of the tensor.
     */
    static rowMajorStrides(shape: readonly number[]): number[] {
        const s = new Array(shape.length)
        let step = 1
        for (let i = shape.length - 1; i >= 0; i--) {
            s[i] = step
            step *= shape[i]
        }
        return s
    }

    /**
     * Computes the flat (linear) index in the underlying buffer for a given set of coordinates.
     *
     * @param coords - A read-only array of indices for each dimension. Its length must equal the view's rank.
     * @returns The zero-based linear index corresponding to the provided multi-dimensional coordinates.
     * @throws Error if `coords.length` does not match the view’s rank.
     * @private
     */
    idx(coords: readonly number[]): number {
        if (coords.length !== this.rank) throw new Error('coords length mismatch')
        return coords.reduce((acc, c, i) => acc + c * this.strides[i], this.offset)
    }

    get(coords: number): T
    get(...coords: number[]): T
    get(...coords: (number | '*')[]): T[]
    /**
     * Retrieves the element at the specified multidimensional coordinates.
     *
     * @param coords - A sequence of indices specifying the position in each dimension.
     * @returns The value located at the given coordinates.
     * @throws RangeError if the computed index is out of bounds.
     */
    get(...coords: (number | '*')[]): T | T[] {
        if (coords.length !== this.rank) {
            throw new Error('coords length mismatch')
        }

        // Case A – full numeric indexing → scalar
        if (coords.every((c): c is number => typeof c === 'number')) {
            return this.base[this.idx(coords)] as T
        }

        // Case B – at least one "*" → sub‑view
        let offset = this.offset
        const newShape: number[] = []
        const newStrides: number[] = []

        for (let i = 0; i < this.rank; i++) {
            const c = coords[i]
            if (c === '*') {
                newShape.push(this.shape[i])
                newStrides.push(this.strides[i])
            } else {
                offset += c * this.strides[i]
            }
        }
        // Return the extracted sub-vector as a flat array
        return new NDView<T>(this.base, newShape, offset, newStrides).materialize()
    }

    /**
     * Sets the element at the specified multi-dimensional coordinates to the provided value.
     *
     * @param val - The value to assign at the given position.
     * @param coords - A sequence of dimension indices specifying the element’s location.
     */
    set(val: T, ...coords: number[]): void {
        this.base[this.idx(coords)] = val
    }

    /**
     * Creates a new NDView that represents a slice along the specified dimension.
     *
     * @typeParam T - The element type of the NDView.
     * @param dim - The zero-based dimension index to slice. Must be in [0, rank).
     * @param start - The starting index for the slice (inclusive). Defaults to 0.
     * @param end - The ending index for the slice (exclusive). Defaults to the size of the dimension.
     *              Negative values are treated as offsets from the end of the dimension.
     * @returns A new NDView<T> sharing the same base buffer, with updated shape, offset, and strides
     *          corresponding to the sliced region.
     * @throws Error if `dim` is out of bounds for the current view.
     */
    slice(dim: number, start = 0, end: number = this.shape[dim]): NDView<T> {
        if (dim < 0 || dim >= this.rank) throw new Error('dim out of bounds')
        if (end < 0) end = this.shape[dim] + end
        const newShape = [...this.shape]
        newShape[dim] = end - start
        const newOffset = this.offset + start * this.strides[dim]
        return new NDView(this.base, newShape, newOffset, this.strides)
    }
    /**
     * Transposes the view by swapping two axes.
     *
     * @remarks
     * This operation does not copy underlying data; it only permutes shape and stride metadata.
     * If the view has fewer than two dimensions or the specified axes are identical,
     * the original view is returned unchanged.
     *
     * @param a0 - The first axis to swap (default: 0).
     * @param a1 - The second axis to swap (default: 1).
     * @returns A new NDView instance with axes `a0` and `a1` swapped.
     */
    transpose(a0 = 0, a1 = 1): NDView<T, BehaviorType, Typed, TypedConstructor> {
        if (this.rank < 2 || a0 === a1) return this
        const s = [...this.shape]
        const r = [...this.strides]
        ;[s[a0], s[a1]] = [s[a1], s[a0]]
        ;[r[a0], r[a1]] = [r[a1], r[a0]]
        return new NDView(this.base, s, this.offset, r)
    }
    /**
     * Creates a new N-dimensional view with the specified shape, reusing the same underlying data buffer.
     *
     * @param newShape - An array of dimension sizes for the reshaped view. The product of these sizes
     *   must equal the product of the current view's shape (i.e., the total element count).
     * @returns A new NDView<T> over the same base buffer, with its offset preserved and row-major strides
     *   computed for the given shape.
     * @throws Error if the element count implied by `newShape` does not match the current view's element count.
     */
    reshape(newShape: readonly number[]): NDView<T> {
        if (product(newShape) !== product(this.shape)) throw new Error('element count mismatch')
        return new NDView(this.base, [...newShape], this.offset, NDView.rowMajorStrides(newShape))
    }
    /**
     * Returns a memory‐contiguous view of this NDView using the specified flat buffer constructor.
     *
     * @param Factory  - A constructor that takes a single number argument (length)
     *                   and returns a FlatBuffer<T> (e.g. Array, Float32Array, etc.)
     *                   Defaults to Array.
     */
    contiguous(Factory: TypedConstructor): NDView<T, BehaviorType, Typed, TypedConstructor> {
        const packed = (() => {
            let step = 1
            for (let i = this.rank - 1; i >= 0; i--) {
                if (this.strides[i] !== step) return false
                step *= this.shape[i]
            }
            return this.offset === 0
        })()
        if (packed && this.base instanceof Factory) return this

        // if already packed and same backing‐class, just return
        if (packed && this.base instanceof Factory) return this

        // allocate a new flat buffer of length = total elements
        const buf = new Factory(product(this.shape)) as FlatBuffer<T>
        let i = 0
        for (const { value } of this) {
            buf[i++] = value
        }
        return new NDView<T, BehaviorType, Typed, TypedConstructor>(buf, [...this.shape])
    }

    /**
     * Returns true or false depending on whether the view is empty.
     *
     * @returns `true` if the view has no elements (i.e., its shape is empty or contains zero dimensions).
     * @returns `false` if the view has at least one dimension with a positive size.
     */
    isEmpty(): boolean {
        return this.shape.length === 0 || this.shape.some(s => s === 0)
    }

    /**
     * Materializes the current view into a fully nested array structure.
     *
     * This method reads a contiguous segment of the underlying flat data buffer,
     * starting at the view's `offset` and spanning `product(this.shape)` elements,
     * then reshapes it into a multidimensional array with dimensions defined by
     * `this.shape`.
     *
     * @returns A nested array of type `T` with dimensions specified by `this.shape`.
     */
    materialize<R extends NestedArray<T> = NestedArray<T>>(): R {
        // Iterate over the view to respect strides and ordering
        const flat: T[] = []
        for (const { value } of this) {
            flat.push(value as T)
        }
        return unflatten(flat, this.shape) as R
    }

    compact() {
        // Move all of the undefined to the end of the array
        this.base.sort((a, b) => Number(b === undefined) - Number(a === undefined))
        // Find the first undefined value
        const n = this.base.findIndex(v => v == undefined)

        // Return the defined values
        return this.base.slice(0, n)
    }

    /**
     * Returns an iterator that traverses every element of the matrix in row-major order.
     *
     * @generator
     * @returns An iterable iterator which yields an object for each element containing:
     *  - `coords`: The multidimensional index (array of numbers) of the element.
     *  - `value`: The element stored at those coordinates.
     *
     * @example
     * ```ts
     * const view = new NDView(new Float32Array([1, 2, 3, 4]), [2, 2]);
     * for (const { coords, value } of view) {
     *   console.log(`Element at [${coords.join(",")}] = ${value}`);
     * }
     * ```
     */
    *[Symbol.iterator](): IterableIterator<{ coords: number[]; value: T }> {
        const total = product(this.shape)

        for (let i = 0; i < total; i++) {
            const coords = indexToCoords(i, this.shape)
            yield { coords, value: this.base[this.idx(coords)] as T }
        }
    }

    /**
     * Returns an iterator that traverses an matrix passing vector, 2D matrix, or 3D matrix
     *
     * If 1 is given and the shape of the matrix is (3, 4, 5), the iterator will
     * return 12 elements, each with two coordinates and an array of 5 values.
     * If 2 is given, the iterator will return 3 elements, each with one coordinate
     * and an array of 4 values.
     *
     *
     * @param {number} dim - The number of dimensions the iterator should return and therefore the
     *                      number of dimensions to ignore when selecting iteration level.
     */
    *traverse<Dim extends 1 | 2 | 3, Unit = Dim extends 1 ? T[] : Dim extends 2 ? T[][] : T[][][]>(
        dim: Dim,
    ): IterableIterator<{ coords: number[]; value: Unit }> {
        // guard against invalid dimensions
        if (dim < 1 || dim > this.rank) throw new Error('dim out of bounds')
        const subShape = this.shape.slice(0, this.rank - dim)
        const total = product(subShape)

        for (let i = 0; i < total; i++) {
            const coords: Array<number | '*'> = indexToCoords(i, subShape)
            for (let j = 0; j < dim; j++) {
                coords.push('*')
            }

            yield {
                value: this.get(...coords) as Unit,
                coords: indexToCoords(i, subShape),
            }
        }
    }
}

function viewOf<T extends number>(arr: NestedArray<T>, Typed: TypedArrayConstructor): NDView<number>

function viewOf<T>(arr: NestedArray<T>): NDView<T>
/**
 * Creates an n-dimensional view of a nested numeric array by flattening its contents
 * into a typed array buffer and preserving its original shape.
 *
 * @typeParam T - The element type contained within the nested array.
 * @param arr - A nested array of numbers (e.g., number[][][]).
 * @param Typed - The constructor for the typed array to use for buffering (default: Float32Array).
 * @returns An {@link NDView<number>} that wraps the flattened buffer and retains the dimensions of `arr`.
 * @throws Error if any element in `arr` is not a number.
 */
function viewOf<T>(arr: NestedArray<T>, Typed?: TypedArrayConstructor): NDView<T> {
    if (isEmpty(arr)) {
        return new NDView([], [0])
    }

    const cellType = typeofCells(arr)
    if (cellType === 'number' && Typed) {
        const buf = new Typed(flatten(arr) as ArrayLike<number>)
        return new NDView(buf, shape(arr))
    } else {
        // support non-numeric arrays (e.g. strings), use plain array buffer
        const buf = flatten(arr) as T[]
        return new NDView(buf as FlatBuffer<T>, shape(arr))
    }
}

export { viewOf }
