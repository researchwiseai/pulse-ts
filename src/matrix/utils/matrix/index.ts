import type { FlatBuffer, NestedArray, QInt, UQInt, DType } from '../../core'
import { vectorize } from '../../core/vectorview'
import type { Headers } from './headers'
import { NDView, viewOf } from '../../core/view'
import { asQInt, asUQInt } from '../../core/basic'
import { toArrayBuffer, fromArrayBuffer } from '../../core/io'
import { product, unflatten } from '../../core/helpers'
import { generateImpl, type GenerateOptions, type GenerateSelfOptions } from './generate'
import type {
    HasAxis,
    MapOptions,
    MaxOptions,
    MeanOptions,
    MedianOptions,
    MinOptions,
    ReduceOptions,
    RemoveMethod,
    SumOptions,
} from './types'
import { removeDim } from './remove'

/**
 * A generic N‐dimensional matrix wrapper over an `NDView` that provides
 * convenient factory methods, structural operations, materialization,
 * reduction and mapping utilities, and quantization support.
 *
 * @template T - The numeric element type of the matrix (defaults to `number`).
 *
 * @remarks
 * Internally, `Matrix` holds an `NDView<T>`, allowing efficient
 * slicing, reshaping, and transposition without copying data. Use
 * {@link Matrix.from} to construct from nested arrays or an existing
 * `NDView`, or {@link Matrix.decode} to interpret a raw `ArrayBuffer`.
 *
 * @example
 * ```ts
 * // Create a 2×3 matrix from nested arrays
 * const m = Matrix.from([[1, 2, 3], [4, 5, 6]]);
 *
 * // Transpose to shape [3, 2]
 * const mt = m.transpose();
 *
 * // Compute the sum and mean
 * const total = m.sum();     // 21
 * const avg   = m.mean();    // 3.5
 *
 * // Quantize and dequantize
 * const q = m.quantise();
 * const deq = q.dequantise();
 * ```
 *
 * @public
 */
export class Matrix<T> {
    private constructor(
        private readonly view: NDView<T>,
        /** Optional per-axis headers: headers[i] is an array of length shape[i] with metadata for that axis */
        private readonly _headers?: Headers,
    ) {}
    /* Factories */
    /**
     * Constructs a Matrix from nested arrays or an existing NDView, with optional per-axis headers.
     * @param data - Nested numeric array or NDView
     * @param headers - Optional array of header arrays, one per dimension. headers[i].length must equal shape[i].
     */
    static from<U>(data: NestedArray<U> | NDView<U>, headers?: Headers): Matrix<U> {
        const view = data instanceof NDView ? data : (viewOf(data) as NDView<U>)
        return new Matrix<U>(view, headers)
    }
    /**
     * Decodes a Matrix from a binary ArrayBuffer, with optional per-axis headers.
     * @param buf - ArrayBuffer produced by encode()
     * @param dtype - Data type string for decoding
     * @param headers - Optional array of header arrays, one per dimension.
     */
    static decode(buf: ArrayBuffer, dtype: DType = 'float32', headers?: Headers): Matrix<number> {
        const view = fromArrayBuffer(buf, dtype)
        return new Matrix<number>(view, headers)
    }

    /**
     * Constructs a Matrix from axis iterables and a mapping function.
     */
    static async generate<U, S extends string | string[] = string>(
        opts: GenerateOptions<U, S>,
    ): Promise<{
        matrix: Matrix<U>
        report: {
            cellsPerSecond: number
            cells: number
            timePerCell: string
            longestCellComputation: string
            preCellsDuration: string
            postCellsDuration: string
            cellReport: {
                start: number
                end: number
            }[]
            totalTimeTaken: string
        }
        timeline: () => string
    }> {
        return generateImpl<U, S>(Matrix, opts)
    }
    /**
     * Constructs a square matrix by self comparing a single iterable using a mapping function.
     */
    static async generateSelf<U, S extends string | string[] = string | string[]>({
        before,
        fn: pairFn,
        headers: headerFn,
        iterable,
        poolSize,
    }: GenerateSelfOptions<U, S>): Promise<{
        matrix: Matrix<U>
        report: {
            cellsPerSecond: number
            cells: number
            timePerCell: string
            longestCellComputation: string
            preCellsDuration: string
            postCellsDuration: string
            cellReport: {
                start: number
                end: number
            }[]
            totalTimeTaken: string
        }
        timeline: () => string
    }> {
        return Matrix.generate<U, S>({
            iterables: [iterable, iterable],
            fn: async coords => {
                if (coords[0] <= coords[1]) {
                    return { result: undefined as unknown as U }
                }

                return pairFn(coords[0], coords[1])
            },
            poolSize,
            headers: headerFn,
            before,
        })
    }
    /* Introspection */
    /** The shape of the matrix */
    get shape() {
        return this.view.shape
    }
    /** The rank (number of dimensions) of the matrix */
    get rank() {
        return this.view.rank
    }
    /**
     * Retrieves the per-axis headers, if provided.
     * headers[i] is an array with length = shape[i], containing metadata for axis i.
     */
    get headers(): Headers | undefined {
        return this._headers
    }
    /* Structural ops */
    /**
     * Transpose the matrix by swapping two axes.
     *
     * @param a0 - The first axis index to transpose. Defaults to 0.
     * @param a1 - The second axis index to transpose. Defaults to 1.
     * @returns A new Matrix instance whose underlying view has axes `a0` and `a1` swapped.
     *
     * @remarks
     * - If the matrix has headers and its rank is ≥ 2, the header arrays for the two specified axes
     *   will also be swapped.
     * - The original matrix is not modified; a new instance is returned.
     */
    transpose(a0 = 0, a1 = 1) {
        const newView = this.view.transpose(a0, a1)
        // Swap headers for the two axes
        if (this._headers && this.rank >= 2) {
            // Create a shallow copy of the headers array
            const newHeaders = [...this._headers] as Headers
            ;[newHeaders[a0], newHeaders[a1]] = [newHeaders[a1], newHeaders[a0]]
            return new Matrix(newView, newHeaders)
        } else {
            // No headers or rank < 2, return without modifying headers
            return new Matrix(newView)
        }
    }
    /**
     * Reshapes the current matrix to the specified dimensions and returns a new Matrix.
     *
     * Calls the underlying view's `reshape` method with the given shape array `s`.
     * If the new shape has the same number of axes and each dimension exactly
     * matches the original shape, any existing headers will be carried over;
     * otherwise the returned Matrix will have no headers.
     *
     * @param s - A readonly array of numbers representing the desired shape for each axis.
     * @returns A new Matrix instance with its data rearranged into the given shape.
     */
    reshape(s: readonly number[]) {
        const newView = this.view.reshape(s)
        // Preserve headers only if shapes match on each axis
        let newHeaders: Headers | undefined
        if (this._headers && s.length === this._headers.length) {
            const dims = this.shape
            const match = dims.every((d, i) => d === s[i])
            if (match) newHeaders = this._headers
        }
        return new Matrix(newView, newHeaders)
    }
    /**
     * Returns a new Matrix that is a view of this matrix sliced along the given axis.
     *
     * @param dim - Zero-based index of the dimension (axis) to slice.
     * @param start - Starting index (inclusive) for the slice along the specified axis. Defaults to 0.
     * @param end - Ending index (exclusive) for the slice along the specified axis.
     *              Defaults to the size of this matrix along `dim`.
     * @returns A new Matrix instance whose underlying view and headers (if any)
     *          are sliced from `start` to `end` along dimension `dim`.
     */
    slice(dim: number, start = 0, end: number = this.shape[dim]) {
        const newView = this.view.slice(dim, start, end)
        // Slice headers on the specified axis
        let newHeaders: Headers | undefined
        if (this._headers) {
            newHeaders = this._headers.map((hdr, i) => (i === dim ? hdr.slice(start, end) : hdr))
        }
        return new Matrix(newView, newHeaders)
    }
    /* Materialize */
    /**
     * Materializes and returns the nested array representation of the matrix.
     *
     * @returns A NestedArray<T> containing all elements of the matrix.
     */
    value<R extends NestedArray<T> = NestedArray<T>>(): R {
        return this.view.materialize<R>()
    }
    /**
     * Retrieves the internal n-dimensional view of this matrix.
     *
     * @returns The NDView<T> instance representing the underlying data.
     */
    asView(): NDView<T> {
        return this.view
    }
    /**
     * Encodes the underlying matrix data into an ArrayBuffer using the specified data type.
     *
     * @param dtype - The target data type for the buffer (e.g., "float32", "int32"). Defaults to "float32".
     * @returns An ArrayBuffer containing the serialized matrix elements in the chosen dtype.
     */
    encode(dtype: DType = 'float32') {
        return toArrayBuffer(this.view, dtype)
    }
    /**
     *
     */
    compact() {
        return this.view.compact()
    }

    /* Simple reductions */
    sum(this: Matrix<number>): number
    sum(this: Matrix<number>, opts?: { axis?: undefined }): number
    sum(this: Matrix<number>, opts: { axis: number }): Matrix<number>
    /**
     * Calculates the sum of elements globally or along an axis.
     * @param opts.axis - If set, sums each sub-vector along the axis, returning a matrix of sums.
     */
    sum(this: Matrix<number>, opts: SumOptions = {}): number | Matrix<number> {
        return this.reduce((a, v) => a + (v as unknown as number), 0 as number, opts)
    }

    mean(this: Matrix<number>): number
    mean(this: Matrix<number>, opts?: { axis?: undefined }): number
    mean(this: Matrix<number>, opts: { axis: number }): Matrix<number>
    /**
     * Calculates the arithmetic mean globally or along an axis.
     * @param opts.axis - If set, computes mean of each sub-vector along the axis, returning a matrix of means.
     */
    mean(this: Matrix<number>, opts: MeanOptions = {}): number | Matrix<number> {
        if (opts.axis !== undefined) {
            const axis = opts.axis
            const size = this.shape[axis]
            const summed = this.sum({ axis }) as Matrix<number>
            return summed.map(v => v / size)
        }
        return (this.sum() as number) / product(this.shape)
    }

    max(this: Matrix<number>): number
    max(this: Matrix<number>, opts?: { axis?: undefined }): number
    max(this: Matrix<number>, opts: { axis: number }): Matrix<number>
    /**
     * Computes the maximum value globally or along an axis.
     * @param opts.axis - If set, computes max of each sub-vector along the axis, returning a matrix of maxima.
     */
    max(this: Matrix<number>, opts: MaxOptions = {}): number | Matrix<number> {
        return this.reduce(
            (a, v) => (a > (v as unknown as number) ? a : (v as unknown as number)),
            -Infinity as number,
            opts,
        )
    }

    min(this: Matrix<number>): number
    min(this: Matrix<number>, opts?: { axis?: undefined }): number
    min(this: Matrix<number>, opts: { axis: number }): Matrix<number>
    /**
     * Computes the minimum value globally or along an axis.
     * @param opts.axis - If set, computes min of each sub-vector along the axis, returning a matrix of minima.
     */
    min(this: Matrix<number>, opts: MinOptions = {}): number | Matrix<number> {
        return this.reduce(
            (a, v) => (a < (v as unknown as number) ? a : (v as unknown as number)),
            Infinity as number,
            opts,
        )
    }

    median(this: Matrix<number>): number
    median(this: Matrix<number>, opts?: { axis?: undefined }): number
    median(this: Matrix<number>, opts: { axis: number }): Matrix<number>
    /**
     * Computes the median value globally or along an axis.
     * @param opts.axis - If set, computes median of each sub-vector along the axis, returning a matrix of medians.
     */
    median(this: Matrix<number>, opts: MedianOptions = {}): number | Matrix<number> {
        if (opts.axis !== undefined) {
            return this.remove(opts.axis, 'median')
        }
        const flat: number[] = []
        for (const { value } of this.view) {
            flat.push(value as unknown as number)
        }
        flat.sort((a, b) => a - b)
        const m = flat.length
        const mid = Math.floor(m / 2)
        if (m % 2 === 1) {
            return flat[mid]
        } else {
            return (flat[mid - 1] + flat[mid]) / 2
        }
    }
    /* Map & reduce */
    map<U>(fn: (v: T, c: readonly number[]) => U): Matrix<U>
    /**
     * Applies a transformation function to each element or sub-vector in the matrix.
     * @typeParam U - The type of elements in the resulting matrix.
     * @param fn - A callback invoked for each value (number or TypedArray) and its coordinates.
     * @param opts.axis - If set, applies `vectorize` on the given axis, mapping each sub-vector; shape is reduced by one.
     */
    map<U>(
        fn: ((v: FlatBuffer<T>, c: readonly number[]) => U) | ((v: T, c: readonly number[]) => U),
        opts?: MapOptions,
    ): Matrix<U> {
        function hasAxis(opts: MapOptions | undefined): opts is HasAxis<MapOptions> {
            return typeof opts?.axis === 'number'
        }

        if (hasAxis(opts)) {
            const axis = opts.axis
            const sub = this.vectorize(axis)
            return sub.map(fn as (v: FlatBuffer<T>, c: readonly number[]) => U)
        }

        const flat: U[] = new Array(product(this.shape))
        let idx = 0
        for (const { coords, value } of this.view) {
            flat[idx++] = (fn as (v: T, c: readonly number[]) => U)(value, coords)
        }
        const nested = unflatten(flat, this.shape) as NestedArray<U>
        return Matrix.from<U>(nested, this._headers)
    }
    /**
     * Reduces all elements of the matrix to a single value by invoking a reducer
     * callback on each entry.
     *
     * @typeParam U - The type of the accumulated result.
     * @param fn  - A reducer function called for each element, receiving the
     *              current accumulator, the element's value, and its coordinates
     *              as a readonly array of indices.
     * @param init - The initial value for the accumulator.
     * @returns The final accumulated value after processing all matrix entries.
     */
    /**
     * Reduces elements of the matrix either globally or along a given axis.
     * @typeParam U - The type of the accumulated result.
     * @param fn - Reducer function called for each element with accumulator and coordinates.
     * @param init - Initial accumulator value.
     * @param opts.axis - If set, applies reduction over sub-vectors along the axis, returning a matrix of results.
     */
    reduce<U>(
        fn: (acc: U, v: T, c: readonly number[]) => U,
        init: U,
        opts: ReduceOptions = {},
    ): U | Matrix<U> {
        if (opts.axis !== undefined) {
            const axis = opts.axis
            const sub = this.vectorize(axis)
            const newShape = this.shape.filter((_, i) => i !== axis)
            const flat: U[] = []
            for (const { coords, value } of sub.asView()) {
                let acc2 = init
                for (const v of value as unknown as Iterable<T>) {
                    acc2 = fn(acc2, v, coords)
                }
                flat.push(acc2)
            }
            const nested = unflatten(flat, newShape) as NestedArray<U>
            const headers = this._headers ? this._headers.filter((_, i) => i !== axis) : undefined
            return Matrix.from<U>(nested, headers)
        }
        let acc = init
        for (const { coords, value } of this.view) {
            acc = fn(acc, value, coords)
        }
        return acc
    }
    /* Quantisation */
    /**
     * Quantizes each element of the matrix.
     *
     * By default (signed), each value in the matrix (assumed in [-1, 1]) is
     * multiplied by 127, rounded to the nearest integer, and converted into a QInt.
     * If `opts.unsigned` is true, values are mapped from [0, 1] to [0, 255] by
     * multiplying by 255, rounding, and converted into a UQInt.
     *
     * @param opts.unsigned - Whether to use unsigned 8-bit quantization (default: false).
     * @returns A new Matrix of QInt or UQInt values representing the quantized data.
     */

    quantise(this: Matrix<number>, opts: { unsigned: true }): Matrix<UQInt>
    quantise(this: Matrix<number>, opts?: { unsigned?: false | undefined }): Matrix<QInt>
    quantise(this: Matrix<number>, opts?: { unsigned?: boolean }): Matrix<QInt> | Matrix<UQInt> {
        const multiplier = opts?.unsigned ? 255 : 127
        return multiplier === 127
            ? this.map(v => asQInt(Math.round(v * multiplier)))
            : this.map(v => asUQInt(Math.round(v * multiplier)))
    }
    /**
     * Dequantises the matrix by converting its integer entries into normalized floats.
     *
     * Signed quantized values (QInt) are divided by 127 to map into the range [-1, 1].
     * Unsigned quantized values (UQInt) are divided by 255 to map into the range [0, 1].
     * If `opts.unsigned` is not provided, the method will inspect the first cell to infer
     * whether the data is signed or unsigned.
     *
     * @param opts - Configuration options for dequantisation.
     * @param opts.unsigned -
     *   - `true`: treat entries as unsigned (divide by 255).
     *   - `false`: treat entries as signed (divide by 127).
     *   - `undefined`: infer type from the first element.
     * @returns A new matrix of `number` values representing the dequantised data.
     * @throws {Error} If `opts.unsigned` is `undefined` and the quantization type
     *         cannot be determined from the first element.
     */
    dequantise(this: Matrix<QInt | UQInt>, opts?: { unsigned?: boolean }) {
        function doSigned(matrix: Matrix<QInt>) {
            return matrix.map(q => (q as number) / 127)
        }

        function doUnsigned(matrix: Matrix<UQInt>) {
            return matrix.map(q => (q as number) / 255)
        }

        if (opts?.unsigned === true) {
            return doUnsigned(this)
        } else if (opts?.unsigned === false) {
            return doSigned(this)
        } else {
            return doSigned(this)
            // Attempt to determine if QInt or UQInt
            // const firstCell = this.view.get(
            //     ...Array.from({ length: this.view.rank }, () => 0),
            // );
            // if (isQInt(firstCell)) {
            //     doSigned(this as Matrix<QInt>);
            // } else if (isUQInt(firstCell)) {
            //     doUnsigned(this as Matrix<UQInt>);
            // }
            // throw new Error(
            //     "Matrix.dequantise: unable to determine quantization type",
            // );
        }
    }
    /**
     * Vectorizes the matrix along a given axis, returning sub-vectors as matrix cells.
     * @param axis - Axis to vectorize (default: last axis)
     * @param opts.contiguous - Optional TypedArray constructor for contiguous buffers
     */
    vectorize(
        axis: number = this.rank - 1,
        opts?: { contiguous?: boolean },
    ): Matrix<FlatBuffer<T>> {
        if (axis < 0 || axis >= this.rank) throw new Error('Matrix.vectorize: axis out of range')
        // always produce contiguous nested vectors by default (override contiguous flag)
        const newView = vectorize(this.view, {
            dim: axis,
            contiguous: opts?.contiguous ?? true,
        })
        const newHeaders = this._headers ? this._headers.filter((_, i) => i !== axis) : undefined
        return new Matrix<FlatBuffer<T>>(newView, newHeaders)
    }
    /**
     * Expands this matrix by adding a new innermost dimension.
     * For each element, applies `fn` to produce an array of values of length K.
     * The resulting matrix has one more dimension: [...shape, K].
     * Optional headers may be provided for the new axis; if omitted, empty objects are used.
     * @param fn Function mapping each value and its coords to an array of U values (all arrays must have same length K).
     * @param newDimHeaders Optional header array for the new dimension (length K).
     */
    add<U>(
        fn: (v: T, coords: readonly number[]) => U[],
        newDimHeaders?: Array<Record<string, unknown>>,
    ): Matrix<U> {
        const dims = this.shape
        const flatNew: U[] = []
        let K: number | undefined
        for (const { coords, value } of this.view) {
            const arr = fn(value, coords)
            if (K === undefined) {
                K = arr.length
            } else if (arr.length !== K) {
                throw new Error('Matrix.add: inconsistent output length')
            }
            flatNew.push(...arr)
        }
        if (K === undefined) throw new Error('Matrix.add: source is empty')
        const newShape = [...dims, K]
        const nested = unflatten(flatNew, newShape) as NestedArray<U>
        // build headers: propagate existing or default, then new axis
        const oldHeaders = this._headers ? [...this._headers] : dims.map(d => Array(d).fill({}))
        const hdrs = newDimHeaders && newDimHeaders.length === K ? newDimHeaders : Array(K).fill({})
        const headers = [...oldHeaders, hdrs]
        return Matrix.from(nested, headers)
    }
    /**
     * Expands this matrix by adding a new outermost dimension.
     * For each element, applies `fn` to produce an array of values of length K.
     * The resulting matrix has one more dimension: [K, ...shape].
     * Optional headers may be provided for the new axis; if omitted, empty objects are used.
     * @param fn Function mapping each value and its coords to an array of U values (all arrays must have same length K).
     * @param newDimHeaders Optional header array for the new dimension (length K).
     */
    wrap<U>(
        fn: (v: T, coords: readonly number[]) => U[],
        newDimHeaders?: Array<Record<string, unknown>>,
    ): Matrix<U> {
        const dims = this.shape
        const M = product(dims)
        const arrs: U[][] = []
        let K: number | undefined
        for (const { coords, value } of this.view) {
            const arr = fn(value as T, coords)
            if (K === undefined) {
                K = arr.length
            } else if (arr.length !== K) {
                throw new Error('Matrix.wrap: inconsistent output length')
            }
            arrs.push(arr)
        }
        if (K === undefined) throw new Error('Matrix.wrap: source is empty')
        const flatNew: U[] = new Array(K * M)
        for (let k = 0; k < K; ++k) {
            for (let i = 0; i < M; ++i) {
                flatNew[k * M + i] = arrs[i][k]
            }
        }
        const newShape = [K, ...dims]
        const nested = unflatten(flatNew, newShape) as NestedArray<U>
        const oldHeaders = this._headers ? [...this._headers] : dims.map(d => Array(d).fill({}))
        const hdrs = newDimHeaders && newDimHeaders.length === K ? newDimHeaders : Array(K).fill({})
        const headers = [hdrs, ...oldHeaders]
        return Matrix.from(nested, headers)
    }
    /**
     * Collapses the specified dimension by applying an aggregation method.
     * Supported methods: 'sum', 'mean', 'max', 'min', 'median'.
     * The resulting matrix has one fewer dimension.
     *
     * @param dim Zero-based axis to remove.
     * @param method Aggregation method.
     */
    remove(dim: number, method: RemoveMethod<T>): Matrix<T> {
        return removeDim(this, dim, method)
    }

    /**
     * Pretty prints the matrix for debugging.
     * - For 1D matrices, prints values with optional headers.
     * - For 2D matrices, prints a table with row and column headers.
     * - For higher dimensions, logs the nested array.
     */
    public prettyPrint(): void {
        const data = this.value()
        const rank = this.rank
        if (rank === 1) {
            const arr = data as T[]
            const dims = this.headers?.[0]
            const rowLabels = dims
                ? dims.map(group => group.map(r => String(r.value)).join(', '))
                : undefined
            const table: Record<string, T> = {}
            arr.forEach((val, i) => {
                const key = rowLabels?.[i] ?? String(i)
                table[key.slice(0, 40)] = val
            })
            console.table(table)
        } else if (rank === 2) {
            const mat = data as T[][]
            const rowDim = this.headers?.[0]
            const colDim = this.headers?.[1]
            const rowLabels = rowDim
                ? rowDim.map(group => group.map(r => String(r.value)).join(', '))
                : undefined
            const colLabels = colDim
                ? colDim.map(group => group.map(r => String(r.value)).join(', '))
                : undefined
            const table: Record<string, Record<string, T>> = {}
            mat.forEach((row, i) => {
                const rowKey = rowLabels?.[i] ?? String(i)
                const rowObj: Record<string, T> = {}
                row.forEach((val, j) => {
                    const colKey = colLabels?.[j] ?? String(j)
                    rowObj[colKey.slice(0, 30)] = val
                })
                table[rowKey.slice(0, 30)] = rowObj
            })
            console.table(table)
        } else {
            console.log(data)
        }
    }
}
