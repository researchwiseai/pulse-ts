import { NOISE } from '../config'
import { type ClusteringResult, isKModesResult, type KModesResult } from '../types'

/**
 * Calculates the total cost of a clustering result.
 * The cost is defined as the sum of distances from each point to its assigned cluster center.
 *
 * This cost metric is only applicable if the clustering result includes cluster centers.
 * If `result.centers` is not provided, the function returns 0.
 *
 * Points assigned to a special `NOISE` cluster are excluded from the cost calculation.
 * The function includes checks for invalid cluster assignments and center indices,
 * logging warnings to the console if such inconsistencies are found.
 *
 * @param distMatrix - A 2D array representing the distance matrix where `distMatrix[i][j]`
 *                     is the distance between point `i` and point `j`.
 * @param result - An object of type `KModesResult` containing the clustering assignments
 *                 and the indices of the cluster centers.
 *                 `result.assignments[i]` is the cluster ID for point `i`.
 *                 `result.centers[clusterId]` is the index of the point that acts as the center for `clusterId`.
 * @returns The total clustering cost. Returns 0 if `result.centers` is undefined.
 *
 * @example
 * ```typescript
 * const distances = [
 *   [0, 1, 5],
 *   [1, 0, 4],
 *   [5, 4, 0]
 * ];
 * const clusteringResult = {
 *   assignments: [0, 0, 1], // Point 0 and 1 in cluster 0, Point 2 in cluster 1
 *   centers: [0, 2],        // Point 0 is center of cluster 0, Point 2 is center of cluster 1
 *   k: 2
 * };
 * const cost = calculateClusteringCost(distances, clusteringResult);
 * // cost would be distMatrix[0][0] + distMatrix[1][0] + distMatrix[2][2]
 * // = 0 + 1 + 0 = 1
 *
 * const resultWithoutCenters = {
 *   assignments: [0, 0, 1],
 *   k: 2
 *   // centers is missing
 * };
 * const costNoCenters = calculateClusteringCost(distances, resultWithoutCenters);
 * // costNoCenters would be 0
 * ```
 */
export function calculateClusteringCost(
    distMatrix: number[][],
    result: KModesResult | ClusteringResult,
): number {
    // This cost metric is only applicable if the clustering result includes cluster centers.
    if (!isKModesResult(result)) {
        return 0
    }

    let totalCost = 0
    const n = distMatrix.length

    for (let i = 0; i < n; i++) {
        const clusterId = result.assignments[i]

        // Do not include noise points in the cost calculation.
        if (clusterId === NOISE) {
            continue
        }

        // Ensure the cluster and center indices are valid.
        if (clusterId < 0 || clusterId >= result.centers.length) {
            console.warn(`Point ${i} has an invalid cluster assignment: ${clusterId}`)
            continue
        }

        const centerIndex = result.centers[clusterId]

        if (centerIndex === undefined || centerIndex < 0 || centerIndex >= n) {
            console.warn(`Cluster ${clusterId} has an invalid center: ${centerIndex}`)
            continue
        }

        // Add the distance from the point to its cluster center to the total cost.
        totalCost += distMatrix[i][centerIndex]
    }

    return totalCost
}
