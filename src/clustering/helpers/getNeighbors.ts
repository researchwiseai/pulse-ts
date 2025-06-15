/**
 * Finds the neighbors of a given point within a specified distance (epsilon)
 * using a precomputed distance matrix.
 *
 * A point `i` is considered a neighbor of `pIdx` if the distance between them
 * (`dM[pIdx][i]`) is less than or equal to `eps`, and `i` is not `pIdx` itself.
 *
 * @param pIdx - The index of the point for which to find neighbors.
 * @param eps - The maximum distance (epsilon) for another point to be considered a neighbor.
 * @param matrix - A 2D array representing the distance matrix, where `dM[i][j]`
 *             is the distance between point `i` and point `j`.
 * @returns An array of indices representing the neighbors of the point `pIdx`.
 *          Returns an empty array if no neighbors are found.
 */
export function getNeighbors(pIdx: number, eps: number, matrix: number[][]): number[] {
    const n: number[] = []
    for (let i = 0; i < matrix.length; i++) {
        if (pIdx !== i && matrix[pIdx][i] <= eps) {
            n.push(i)
        }
    }
    return n
}
