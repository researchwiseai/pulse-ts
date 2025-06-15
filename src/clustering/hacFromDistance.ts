import { calculateClusterDistance } from './helpers'
import type { HACConfig, HACResult } from './types'

/**
 * Performs Hierarchical Agglomerative Clustering (HAC) on a set of data points
 * using a precomputed distance matrix.
 *
 * The algorithm initializes each data point as its own cluster. It then
 * iteratively merges the two closest clusters until the desired number of
 * clusters, `k`, specified in the `config`, is reached. The distance
 * between clusters is calculated based on the linkage criterion provided
 * in the `config`.
 *
 * @param distMatrix A square 2D array (matrix) where `distMatrix[i][j]`
 *                   represents the precomputed distance between data point `i`
 *                   and data point `j`. The number of rows/columns `n`
 *                   corresponds to the total number of data points.
 * @param config An object `HACConfig` containing the configuration for the HAC algorithm.
 * @param config.k The target number of clusters to form. The algorithm will stop
 *                 merging clusters once this number is reached.
 * @param config.linkage The linkage criterion to use for calculating the distance
 *                       between clusters. Defaults to 'average' if not specified.
 *                       This criterion determines how the distance between two
 *                       clusters is defined (e.g., 'single' for minimum distance
 *                       between points, 'complete' for maximum, 'average' for
 *                       average distance). The actual calculation is handled by
 *                       the `calculateClusterDistance` function (not shown here).
 * @returns An object `HACResult` containing the cluster assignments for each
 *          data point.
 * @returns.assignments An array of length `n` (the original number of data points),
 *                      where `assignments[i]` is the integer ID of the cluster
 *                      to which the `i`-th data point has been assigned.
 *                      Cluster IDs are 0-indexed.
 */
export function hacFromDistance(distMatrix: number[][], config: HACConfig): HACResult {
    const { k, linkage = 'average' } = config
    const n = distMatrix.length
    let clusters: number[][] = Array.from({ length: n }, (_, i) => [i])
    while (clusters.length > k) {
        let closestA = -1,
            closestB = -1,
            minDistance = Infinity
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const distance = calculateClusterDistance(
                    clusters[i],
                    clusters[j],
                    distMatrix,
                    linkage,
                )
                if (distance < minDistance) {
                    minDistance = distance
                    closestA = i
                    closestB = j
                }
            }
        }
        if (closestA === -1) break
        clusters[closestA].push(...clusters[closestB])
        clusters.splice(closestB, 1)
    }
    const assignments = new Array(n).fill(-1)
    clusters.forEach((cluster, clusterId) => {
        cluster.forEach(pointIndex => {
            assignments[pointIndex] = clusterId
        })
    })
    return { assignments }
}
