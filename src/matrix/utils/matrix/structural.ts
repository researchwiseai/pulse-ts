/**
 * structural.ts
 *
 * Provides pure functions to compute new NDView and header arrays for
 * common structural operations: transpose, reshape, and slice.
 */
import type { NDView } from '../../core/view'
import type { Headers } from './headers'

/**
 * Transpose two axes of the given view and swap corresponding headers.
 * @param view - Original NDView to transpose.
 * @param headers - Optional per-axis headers.
 * @param a0 - First axis index (default 0).
 * @param a1 - Second axis index (default 1).
 * @returns New view and adjusted headers.
 */
export function transposeView<T>(
    view: NDView<T>,
    headers: Headers | undefined,
    a0 = 0,
    a1 = 1,
): { view: NDView<T>; headers?: Headers } {
    const newView = view.transpose(a0, a1)
    if (headers && view.rank >= 2) {
        const newHeaders = [...headers] as Headers
        ;[newHeaders[a0], newHeaders[a1]] = [newHeaders[a1], newHeaders[a0]]
        return { view: newView, headers: newHeaders }
    }
    return { view: newView, headers }
}

/**
 * Reshape the given view; preserve headers only if the shape matches exactly.
 * @param view - Original NDView to reshape.
 * @param headers - Optional per-axis headers.
 * @param newShape - Desired shape array.
 * @returns New view and optionally preserved headers.
 */
export function reshapeView<T>(
    view: NDView<T>,
    headers: Headers | undefined,
    newShape: readonly number[],
): { view: NDView<T>; headers?: Headers } {
    const newView = view.reshape(newShape)
    let newHeaders: Headers | undefined
    if (headers && newShape.length === headers.length) {
        const oldShape = view.shape
        const match = oldShape.every((d, i) => d === newShape[i])
        if (match) {
            newHeaders = headers
        }
    }
    return { view: newView, headers: newHeaders }
}

/**
 * Slice the given view along one axis and adjust headers accordingly.
 * @param view - Original NDView to slice.
 * @param headers - Optional per-axis headers.
 * @param dim - Axis index to slice.
 * @param start - Start index (inclusive, default 0).
 * @param end - End index (exclusive, defaults to full size).
 * @returns New view and sliced headers.
 */
export function sliceView<T>(
    view: NDView<T>,
    headers: Headers | undefined,
    dim: number,
    start = 0,
    endArg?: number,
): { view: NDView<T>; headers?: Headers } {
    const size = view.shape[dim]
    const end = endArg === undefined ? size : endArg
    const newView = view.slice(dim, start, end)
    let newHeaders: Headers | undefined
    if (headers) {
        newHeaders = headers.map((hdr, i) => (i === dim ? hdr.slice(start, end) : hdr)) as Headers
    }
    return { view: newView, headers: newHeaders }
}
