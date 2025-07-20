import { EPS } from '../config'

/**
 * Estimates the optimal epsilon (eps) value for DBSCAN clustering using the k-distance graph elbow method.
 *
 * This function first converts the input similarity matrix into a distance matrix by calculating
 * `distance = 1 - similarity`. Then, for each point, it determines the distance to its
 * `(minPts - 1)`-th nearest neighbor. These distances, known as k-distances (where k = `minPts - 1`),
 * are sorted in ascending order.
 *
 * The function then identifies an "elbow" point in the plot of these sorted k-distances.
 * This elbow is the point of the largest increase in distance between consecutive points in the sorted list.
 * The k-distance value at this elbow point is considered the optimal `eps`. This value typically
 * represents a threshold where distances start to increase significantly, differentiating dense regions
 * from sparser regions or noise.
 *
 * @param distMatrix - A 2D array where `distanceMatrix[i][j]` represents the distance between point `i` and point `j`.
 *                    This matrix should be square and symmetric, with `distanceMatrix[i][i]` being `0`.
 * @param minPts - The minimum number of points required to form a dense region (a core point in DBSCAN).
 *                 For the k-distance calculation, this function considers k = `minPts - 1`.
 *                 For example, if `minPts` is 4, the function finds the distance to the 3rd nearest neighbor.
 * @returns The estimated optimal `eps` value. If the list of k-distances is empty or too short to find an
 *          elbow, it defaults to `0.5`. The returned `eps` is a distance measure.
 */
export function findOptimalEps(distMatrix: number[][], minPts: number): number {
    const kDistances: number[] = []
    for (let i = 0; i < distMatrix.length; i++) {
        const dists = distMatrix[i].filter((_, j) => i !== j).sort((a, b) => a - b)

        if (dists.length >= minPts - 1) {
            kDistances.push(dists[minPts - 2]) // k = minPts - 1
        }
    }

    // 2. elbow detection ----------------------------------------------------
    kDistances.sort((a, b) => a - b)
    let maxDiff = -Infinity
    let elbowIndex = 0

    for (let i = 1; i < kDistances.length; i++) {
        const diff = kDistances[i] - kDistances[i - 1]
        /* use strict greater *after* adding EPS tolerance           *
         * -> keeps the first index when diffs are "effectively equal" */
        if (diff - maxDiff > EPS) {
            maxDiff = diff
            elbowIndex = i
        }
    }

    return kDistances[elbowIndex] ?? 0.5
}
