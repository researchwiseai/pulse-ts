/**
 * Batching utilities for splitting large similarity requests and stitching results.
 */

/** Maximum total items allowed in a single request. */
export const MAX_ITEMS = 1000

/**
 * Split a single set of items into self-comparison chunks when too large.
 * Returns an array of subsets, each of size <= HALF_CHUNK if original length > MAX_ITEMS.
 */
export function makeSelfChunks<T>(items: T[]): T[][] {
    if (items.length < MAX_ITEMS) {
        return [items]
    }
    const chunks: T[][] = []
    for (let i = 0; i < items.length; i += MAX_ITEMS) {
        chunks.push(items.slice(i, i + MAX_ITEMS))
    }
    return chunks
}

/**
 * Represents the body for a cross-comparison chunk.
 */
export interface CrossBody<A, B> {
    /** Subset of items from set A for this chunk. */
    setA: A[]
    /** Subset of items from set B for this chunk. */
    setB: B[]
    /** Whether results should be returned in a flattened format. */
    flatten: boolean
}

/**
 * Split two sets into chunked request bodies when combined size exceeds MAX_ITEMS.
 * Chooses to chunk only one side if the other is small, or both if both are large.
 */
export function makeCrossBodies<A, B>(setA: A[], setB: B[], flatten: boolean): CrossBody<A, B>[] {
    const total = setA.length + setB.length
    if (total <= MAX_ITEMS * 2) {
        return [{ setA, setB, flatten }]
    }
    const chunksA = setA.length > MAX_ITEMS ? makeSelfChunks(setA) : [setA]
    const chunksB = setB.length > MAX_ITEMS ? makeSelfChunks(setB) : [setB]
    const bodies: CrossBody<A, B>[] = []
    for (const a of chunksA) {
        for (const b of chunksB) {
            bodies.push({ setA: a, setB: b, flatten })
        }
    }
    return bodies
}

/**
 * Stitch together an array of partial similarity result matrices into one full matrix.
 * Supports both self-comparison (square symmetric) and cross-comparison.
 */
function stitchSelf<A>(results: { matrix: number[][] }[], full: A[]): number[][] {
    const chunks = makeSelfChunks(full)
    const n = full.length
    const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0))
    const offsets: number[] = [0]
    for (const c of chunks) offsets.push(offsets[offsets.length - 1] + c.length)
    let idx = 0
    for (let i = 0; i < chunks.length; i++) {
        for (let j = i; j < chunks.length; j++) {
            const block = (results[idx++] as { matrix: number[][] }).matrix
            const r0 = offsets[i]
            const r1 = offsets[i + 1]
            const c0 = offsets[j]
            const c1 = offsets[j + 1]
            for (let r = r0; r < r1; r++) {
                for (let c = c0; c < c1; c++) {
                    matrix[r][c] = block[r - r0]?.[c - c0]
                    if (i !== j) matrix[c][r] = block[r - r0][c - c0]
                }
            }
        }
    }
    return matrix
}

function stitchCross<A, B>(results: { matrix: number[][] }[], fullA: A[], fullB: B[]): number[][] {
    const chunksA = makeSelfChunks(fullA)
    const chunksB = makeSelfChunks(fullB)
    const matrix: number[][] = Array.from({ length: fullA.length }, () =>
        Array(fullB.length).fill(0),
    )
    const offsetsA: number[] = [0]
    for (const c of chunksA) offsetsA.push(offsetsA[offsetsA.length - 1] + c.length)
    const offsetsB: number[] = [0]
    for (const c of chunksB) offsetsB.push(offsetsB[offsetsB.length - 1] + c.length)
    let idx = 0
    for (let i = 0; i < chunksA.length; i++) {
        for (let j = 0; j < chunksB.length; j++) {
            const block = results[idx++].matrix
            const r0 = offsetsA[i]
            const r1 = offsetsA[i + 1]
            const c0 = offsetsB[j]
            const c1 = offsetsB[j + 1]
            for (let r = r0; r < r1; r++) {
                for (let c = c0; c < c1; c++) {
                    matrix[r][c] = block[r - r0][c - c0]
                }
            }
        }
    }
    return matrix
}

/**
 * Stitch together partial similarity result matrices into a full matrix.
 *
 * @param results - Array of partial result objects with similarity matrices.
 * @param bodies - The corresponding CrossBody definitions for each result chunk.
 * @param fullA - The full array of items from set A used in comparison.
 * @param fullB - The full array of items from set B used in comparison.
 * @returns A complete similarity matrix of dimensions fullA.length × fullB.length.
 */
export function stitchResults<A, B>(
    results: { matrix: number[][] }[],
    bodies: CrossBody<A, B>[],
    fullA: A[],
    fullB: B[],
): number[][] {
    return (fullA as unknown) === (fullB as unknown)
        ? stitchSelf(results, fullA)
        : stitchCross(results, fullA, fullB)
}
