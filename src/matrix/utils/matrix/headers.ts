export interface HeaderRecordBase {
    key: string
    type: 's' | 'n' | 'b' | 'd' | 'j'
    value: string | number | boolean | Date
}

export interface HeaderRecordString extends HeaderRecordBase {
    type: 's'
    value: string
}

export interface HeaderRecordNumber extends HeaderRecordBase {
    type: 'n'
    value: number
}

export interface HeaderRecordBoolean extends HeaderRecordBase {
    type: 'b'
    value: boolean
}
export interface HeaderRecordDate extends HeaderRecordBase {
    type: 'd'
    value: Date
}
export interface HeaderRecordJson extends HeaderRecordBase {
    type: 'j'
    value: string
}

export type HeaderRecord =
    | HeaderRecordString
    | HeaderRecordNumber
    | HeaderRecordBoolean
    | HeaderRecordDate
    | HeaderRecordJson

/**
 * Represents a two-dimensional collection of headers.
 *
 * @example Series header:
 * ```typescript
 *  const headers: Headers = [[
 *     [
 *       { key: "label", type: "s", value: "Spend ($)" },
 *       { key: "count", type: "n", value: 123 },
 *       { key: "locked", type: "b", value: true },
 *       { key: "updated_at", type: "d", value: 1747373911781 },
 *      ],
 *   ]];
 * ```
 *
 * @example One-dimension frequency header:
 * ```typescript
 * const headers: Headers = [[
 *    [
 *      { key: "label", type: "s", value: "Employment" },
 *     { key: "count", type: "n", value: 5 },
 *     { key: "locked", type: "b", value: true },
 *     { key: "updated_at", type: "d", value: 1747373911781 },
 *    ],
 *    [
 *      { key: "label", type: "s", value: "Count" },
 *     { key: "count", type: "n", value: 5 },
 *    { key: "locked", type: "b", value: false },
 *    { key: "updated_at", type: "d", value: 1747373911781 },
 *   ]],
 * ```
 *
 * @example Two-dimension similarity matrix header:
 * ```typescript
 * const headers: Headers = [
 *  [
 *    [
 *      { key: "label", type: "s", value: "Header Label One" },
 *    ],
 *    [
 *     { key: "label", type: "s", value: "Header Label Two" },
 *    ],
 *  ],
 *  [
 *   [
 *     { key: "label", type: "s", value: "Row Label One" },
 *   ],
 *   [
 *     { key: "label", type: "s", value: "Row Label Two" },
 *   ],
 * ],
 * ```
 *
 * @example Three-dimension similarity matrix header:
 * ```typescript
 * const headers: Headers = [
 * [
 *   [
 *    { key: "label", type: "s", value: "Header Label One" },
 *   ],
 *  [
 *   { key: "label", type: "s", value: "Header Label Two" },
 *  ],
 * ],
 * [
 *  [
 *   { key: "label", type: "s", value: "Row Label One" },
 *  ],
 *  [
 *    { key: "label", type: "s", value: "Row Label Two" },
 *  ],
 * ],
 * [
 *  [
 *   { key: "label", type: "s", value: "Column Label One" },
 *  ],
 * [
 *
 * The outer array corresponds to header rows, and each inner array is a group
 * of header definitions. Every header object must have a unique `key` string
 * and also includes all additional properties defined by `HeaderRecord`.
 */
export type Headers = Array<
    Array<
        Array<
            {
                key: string
            } & HeaderRecord
        >
    >
>

export function isHeaderRecord(
    record: HeaderRecord | undefined,
): record is
    | HeaderRecordString
    | HeaderRecordNumber
    | HeaderRecordBoolean
    | HeaderRecordDate
    | HeaderRecordJson {
    return (
        record?.type === 's' ||
        record?.type === 'n' ||
        record?.type === 'b' ||
        record?.type === 'd' ||
        record?.type === 'j'
    )
}

export function isHeaderRecordString(record: HeaderRecord): record is HeaderRecordString {
    return record.type === 's'
}
export function isHeaderRecordNumber(record: HeaderRecord): record is HeaderRecordNumber {
    return record.type === 'n'
}
export function isHeaderRecordBoolean(record: HeaderRecord): record is HeaderRecordBoolean {
    return record.type === 'b'
}
export function isHeaderRecordDate(record: HeaderRecord): record is HeaderRecordDate {
    return record.type === 'd'
}
export function isHeaderRecordJson(record: HeaderRecord): record is HeaderRecordJson {
    return record.type === 'j'
}
/**
 * A single header dimension: an array of header entry groups.
 * Each inner array represents a group of HeaderRecords for one label.
 */
export type Dimension = Array<Array<{ key: string } & HeaderRecord>>

/**
 * Build a header Dimension from an array of string labels.
 *
 * @param labels - Array of strings to use as header values.
 * @param key - Optional key name for each header record (default: 'label').
 * @returns A Dimension where each label is wrapped in a HeaderRecordString.
 *
 * @example
 * const dim = labelsToDimension(['A', 'B', 'C']);
 * // dim => [ [{ key: 'label', type: 's', value: 'A' }], [{ key: 'label', type: 's', value: 'B' }], [{ key: 'label', type: 's', value: 'C' }] ]
 */
export function labelsToDimension(labels: string[], key: string = 'label'): Dimension {
    return labels.map(label => [{ key, type: 's', value: label }])
}

/**
 * Build a one-dimensional Headers array from string labels.
 *
 * @param labels - Array of strings to use as header values.
 * @param key - Optional key name for each header record (default: 'label').
 * @returns Headers representing a single header row.
 *
 * @example
 * const headers = headersFromLabels(['X', 'Y']);
 * // headers => [ [ [{ key: 'label', type: 's', value: 'X' }], [{ key: 'label', type: 's', value: 'Y' }] ] ]
 */
export function headersFromLabels(labels: string[], key: string = 'label'): Headers {
    return [labelsToDimension(labels, key)]
}
/**
 * Swap two axes (dimensions) in the given Headers, returning a new Headers array.
 *
 * @param headers - The original Headers.
 * @param a0 - The first axis index to swap (default: 0).
 * @param a1 - The second axis index to swap (default: 1).
 * @returns A new Headers with axes a0 and a1 swapped.
 * @throws If either axis index is out of range.
 */
export function transposeHeaders(headers: Headers, a0: number = 0, a1: number = 1): Headers {
    const R = headers.length
    if (a0 < 0 || a0 >= R || a1 < 0 || a1 >= R) {
        throw new Error(`transposeHeaders: axis index out of range (0 <= a < ${R})`)
    }
    const out = [...headers]
    ;[out[a0], out[a1]] = [out[a1], out[a0]]
    return out
}

/**
 * Attempt to reshape headers to a new shape. Headers are preserved only if
 * the number of axes and their lengths exactly match the new shape.
 *
 * @param headers - The original Headers.
 * @param newShape - Array of desired axis lengths.
 * @returns The same Headers if shapes match, otherwise undefined.
 */
export function reshapeHeaders(headers: Headers, newShape: readonly number[]): Headers | undefined {
    if (headers.length !== newShape.length) {
        return undefined
    }
    for (let i = 0; i < newShape.length; ++i) {
        if (headers[i].length !== newShape[i]) {
            return undefined
        }
    }
    return headers
}

/**
 * Slice the headers along the given axis.
 *
 * @param headers - The original Headers.
 * @param dim - Axis index to slice.
 * @param start - Starting index (inclusive).
 * @param end - Ending index (exclusive).
 * @returns A new Headers with the specified axis sliced.
 * @throws If dim is out of range.
 */
export function sliceHeaders(
    headers: Headers,
    dim: number,
    start: number = 0,
    end?: number,
): Headers {
    const R = headers.length
    if (dim < 0 || dim >= R) {
        throw new Error(`sliceHeaders: axis index out of range (0 <= dim < ${R})`)
    }
    const axis = headers[dim]
    const e = end === undefined ? axis.length : end
    return headers.map((h, i) => (i === dim ? h.slice(start, e) : h))
}

/**
 * Append a new dimension (innermost axis) to the given Headers.
 * If headers is undefined or empty, returns a single-axis Headers.
 *
 * @param headers - The original Headers, or undefined.
 * @param newDim - The Dimension array for the new axis.
 * @returns A new Headers with newDim appended.
 */
export function appendDimension(headers: Headers | undefined, newDim: Dimension): Headers {
    if (!headers || headers.length === 0) {
        return [newDim]
    }
    return [...headers, newDim]
}

/**
 * Prepend a new dimension (outermost axis) to the given Headers.
 * If headers is undefined or empty, returns a single-axis Headers.
 *
 * @param headers - The original Headers, or undefined.
 * @param newDim - The Dimension array for the new axis.
 * @returns A new Headers with newDim prepended.
 */
export function prependDimension(headers: Headers | undefined, newDim: Dimension): Headers {
    if (!headers || headers.length === 0) {
        return [newDim]
    }
    return [newDim, ...headers]
}

/**
 * Remove the specified dimension (axis) from the Headers.
 *
 * @param headers - The original Headers.
 * @param dim - Axis index to remove.
 * @returns A new Headers with the axis removed, or undefined if no axes remain.
 * @throws If dim is out of range.
 */
export function removeDimension(headers: Headers, dim: number): Headers | undefined {
    const R = headers.length
    if (dim < 0 || dim >= R) {
        throw new Error(`removeDimension: axis index out of range (0 <= dim < ${R})`)
    }
    const out = headers.filter((_, i) => i !== dim)
    return out.length > 0 ? out : undefined
}
