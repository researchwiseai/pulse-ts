import type { KModesConfig, KModesResult } from './types'

/**
 * Performs k-modes clustering using a precomputed distance matrix.
 * This algorithm partitions data points into 'k' clusters, where each cluster
 * is represented by a medoid (an actual data point from the cluster).
 * The medoid is chosen to minimize the sum of distances to other points
 * within its own cluster.
 *
 * The algorithm iteratively refines cluster assignments and medoids:
 * 1. Initialization: Randomly selects 'k' distinct data points as initial medoids.
 * 2. Assignment Step: Assigns each data point to the cluster whose medoid
 *    is closest to it (based on the provided distance matrix).
 * 3. Update Step: For each cluster, a new medoid is chosen from its members.
 *    The new medoid is the point that has the lowest total distance to all
 *    other points in that same cluster. If a cluster becomes empty, its
 *    previous medoid is retained.
 * The process repeats until cluster assignments no longer change or the
 * maximum number of iterations is reached.
 *
 * @param matrix A square 2D array (distance matrix) where `matrix[i][j]`
 *               represents the distance between data point `i` and data point `j`.
 *               Lower values indicate closer points. Values should be in [0, 1],
 *               and `matrix[i][i]` should be 0.0.
 * @param config Configuration object for the k-modes algorithm.
 * @param config.k The desired number of clusters. Must be greater than 0 and
 *                 less than or equal to the number of data points.
 * @param config.maxIterations Optional. The maximum number of iterations for the
 *                             algorithm to run. Defaults to 100.
 * @returns An object {@link KModesResult} containing the clustering result:
 *          - `assignments`: An array of length `n` (number of data points),
 *              where `assignments[i]` is the index (0 to `k-1`) of the cluster
 *              to which data point `i` is assigned.
 *          - `centers`: An array of `k` data point indices representing the
 *              final medoids for each cluster, sorted in ascending order.
 *          - `iterations`: The number of iterations the algorithm performed.
 *          If the input matrix is empty (i.e., `n === 0`), it returns
 *          `{ assignments: [], centers: [], iterations: 0 }`.
 * @throws Error if `k` is invalid (e.g., `k <= 0` or `k > n`).
 */
export function kModesFromDistance(matrix: number[][], config: KModesConfig): KModesResult {
    const { k, maxIterations = 100 } = config
    const n = matrix.length
    if (n === 0) return { assignments: [], centers: [], iterations: 0 }
    if (k > n || k <= 0) throw new Error('k must be > 0 and <= n')

    // Initialize k distinct medoids randomly
    const initialSet = new Set<number>()
    while (initialSet.size < k) {
        initialSet.add(Math.floor(Math.random() * n))
    }
    let centers = Array.from(initialSet).sort((a, b) => a - b)

    let assignments = new Array(n).fill(-1)
    let iterations = 0
    let changed = true

    while (iterations < maxIterations && changed) {
        // Assignment step: assign to nearest medoid (min distance)
        const newAssignments = new Array(n).fill(-1)
        for (let i = 0; i < n; i++) {
            let bestCluster = -1
            let minDist = Infinity
            for (let c = 0; c < k; c++) {
                const dist = matrix[i][centers[c]]
                if (dist < minDist) {
                    minDist = dist
                    bestCluster = c
                }
            }
            newAssignments[i] = bestCluster
        }

        // Check for changes
        changed = JSON.stringify(assignments) !== JSON.stringify(newAssignments)
        assignments = newAssignments

        // Update step: compute new medoids by minimizing total distance
        const newCenters: number[] = []
        for (let c = 0; c < k; c++) {
            const members = assignments
                .map((clusterIdx, idx) => (clusterIdx === c ? idx : -1))
                .filter(idx => idx !== -1)
            if (members.length === 0) {
                // Keep previous medoid if cluster is empty
                newCenters.push(centers[c])
                continue
            }
            let bestMedoid = -1
            let minTotalDist = Infinity
            for (const candidate of members) {
                const totalDist = members.reduce((sum, m) => sum + matrix[candidate][m], 0)
                if (totalDist < minTotalDist) {
                    minTotalDist = totalDist
                    bestMedoid = candidate
                }
            }
            newCenters.push(bestMedoid)
        }

        centers = newCenters.sort((a, b) => a - b)
        iterations++
    }

    return { assignments, centers, iterations }
}
