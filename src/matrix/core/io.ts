import { NDView, viewOf } from './view'
import type { NestedArray } from './basic'
import { typeofCellsMatrix } from '../utils'

/**
 * Defines the supported numeric data types for matrix and tensor operations.
 *
 * @remarks
 * - "float64": 64-bit double-precision floating-point numbers
 * - "float32": 32-bit single-precision floating-point numbers
 * - "uint8":   8-bit unsigned integers
 *
 * @public
 */
export type DType = 'float64' | 'float32' | 'uint8'

/**
 * A read-only mapping of numeric data type identifiers to their corresponding TypedArray constructors.
 *
 * @remarks
 * This can be used to dynamically create typed arrays based on a string key.
 *
 * @property float64 - Constructor for 64-bit floating point arrays (Float64Array).
 * @property float32 - Constructor for 32-bit floating point arrays (Float32Array).
 * @property uint8   - Constructor for 8-bit unsigned integer arrays (Uint8Array).
 */
const ctor = {
    float64: Float64Array,
    float32: Float32Array,
    uint8: Uint8Array,
} as const

/**
 * Serializes a multidimensional numeric array or view into a single ArrayBuffer,
 * prefixing the binary payload with a header that describes the array's rank and shape.
 *
 * @param data - The source data, either an NDView<number> (already contiguous) or a nested
 *               JavaScript array of numbers. If `data` is not an NDView, it will be
 *               flattened and laid out contiguously in memory.
 * @param dtype - The desired data type for the numeric payload (e.g., "float32", "int32").
 *                Defaults to "float32". This determines which TypedArray constructor
 *                is used for the payload.
 * @returns A single ArrayBuffer containing:
 *          1. A header as a Uint32Array: `[rank, ...shape]`
 *          2. The raw binary contents of the contiguous numeric payload.
 *
 * @remarks
 * - The header length is (1 + rank) * 4 bytes.
 * - The payload follows immediately after the header.
 * - To reconstruct, read the first Uint32 values to retrieve rank and shape,
 *   then interpret the remaining bytes as the specified TypedArray.
 *
 * @example
 * ```ts
 * const buffer = toArrayBuffer([[1, 2], [3, 4]], "float32");
 * // header: [2, 2, 2], payload: Float32Array [1, 2, 3, 4]
 * ```
 */
export function toArrayBuffer<T>(
    data: NDView<T> | NestedArray<T>,
    dtype: DType = 'float32',
): ArrayBuffer {
    const view =
        data instanceof NDView
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data.contiguous(ctor[dtype] as any)
            : typeofCellsMatrix(data) === 'number'
              ? viewOf(data as NestedArray<number>, ctor[dtype])
              : viewOf(data)
    const payload = view.base as InstanceType<(typeof ctor)[typeof dtype]>
    const headerArr = new Uint32Array([view.rank, ...view.shape])
    const headerBytes = headerArr.byteLength
    const align = ctor[dtype].BYTES_PER_ELEMENT
    const pad = (align - (headerBytes % align)) % align
    const out = new Uint8Array(headerBytes + pad + payload.byteLength)
    out.set(new Uint8Array(headerArr.buffer), 0)
    out.set(new Uint8Array(payload.buffer), headerBytes + pad)
    return out.buffer
}

/**
 * Constructs an NDView from a binary buffer.
 *
 * @param buf - The ArrayBuffer containing the tensor data.
 *   The first 32-bit unsigned integer specifies the rank (number of dimensions).
 *   The next `rank` 32-bit unsigned integers specify the size of each dimension.
 *   The remaining bytes represent the tensor elements.
 * @param dtype - The element data type (default: "float32"). Determines which TypedArray
 *   constructor is used to interpret the payload.
 * @returns An NDView<number> that wraps the extracted payload with the inferred dimensions.
 *
 * @example
 * ```ts
 * // Create an NDView from a buffer containing a 2×3 float32 tensor
 * const view = fromArrayBuffer(buffer, "float32");
 * console.log(view.dims);      // [2, 3]
 * console.log(view.get(1, 2)); // element at row 1, column 2
 * ```
 */
export function fromArrayBuffer(buf: ArrayBuffer, dtype: DType = 'float32'): NDView<number> {
    const header = new Uint32Array(buf, 0, 1)
    const rank = header[0]
    const dims = Array.from(new Uint32Array(buf, 4, rank))
    const headerBytes = 4 * (rank + 1)
    const align = ctor[dtype].BYTES_PER_ELEMENT
    const pad = (align - (headerBytes % align)) % align
    const payload = new ctor[dtype](buf, headerBytes + pad)
    return new NDView<number>(payload, dims)
}
