/**
 * Calculates the distance between two clusters based on a specified linkage method.
 *
 * This function computes all pairwise distances between points in the first cluster (`cA`)
 * and points in the second cluster (`cB`), using the provided distance matrix (`dM`).
 * It then applies the chosen linkage method (`l`) to these pairwise distances
 * to determine the overall distance between the two clusters.
 *
 * @param clusterA - An array of point indices representing the first cluster. Each number is an
 *             index corresponding to a point in the dataset.
 * @param clusterB - An array of point indices representing the second cluster. Each number is an
 *             index corresponding to a point in the dataset.
 * @param matrix - A 2D array (distance matrix) where `dM[i][j]` stores the pre-calculated
 *             distance between point `i` and point `j`.
 * @param linkage - The linkage method to determine how cluster distance is calculated:
 *            - 'single': The distance is the minimum of all pairwise distances between
 *                        points in `cA` and points in `cB`. (Nearest neighbor)
 *            - 'complete': The distance is the maximum of all pairwise distances between
 *                          points in `cA` and points in `cB`. (Farthest neighbor)
 *            - 'average': The distance is the arithmetic mean of all pairwise distances
 *                         between points in `cA` and points in `cB`. (UPGMA-like)
 * @returns The calculated distance between the two clusters (`cA` and `cB`) according
 *          to the specified linkage method. Returns `Infinity` for 'single' linkage,
 *          `-Infinity` for 'complete' linkage, or `NaN` for 'average' linkage if
 *          either cluster is empty (resulting in no pairwise distances).
 */
export function calculateClusterDistance(
    clusterA: number[],
    clusterB: number[],
    matrix: number[][],
    linkage: 'single' | 'complete' | 'average',
): number {
    const ds = clusterA.flatMap(pA => clusterB.map(pB => matrix[pA][pB]))
    switch (linkage) {
        case 'single':
            return Math.min(...ds)
        case 'complete':
            return Math.max(...ds)
        default:
            return ds.reduce((s, d) => s + d, 0) / ds.length
    }
}
