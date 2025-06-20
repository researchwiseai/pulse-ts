import { NOISE } from '../config'
import type { ClusteringResult } from '../types'

/**
 * Gathers indices of members belonging to a specific cluster.
 *
 * @param targetClusterIndex - The cluster index to find members for.
 * @param assignments - Array of cluster assignments for all data points.
 * @param excludePointIndex - Optional. An index of a point to exclude from the members list.
 * @returns An array of indices of points belonging to the target cluster.
 */
function _getClusterMembersIndices(
    targetClusterIndex: number,
    assignments: number[],
    excludePointIndex: number = -1,
): number[] {
    const members: number[] = []
    for (let i = 0; i < assignments.length; i++) {
        if (assignments[i] === targetClusterIndex && i !== excludePointIndex) {
            members.push(i)
        }
    }
    return members
}

if (import.meta.vitest) {
    const { describe, expect, it } = import.meta.vitest

    describe('_getClusterMembersIndices', () => {
        it('should return indices of members belonging to the target cluster', () => {
            const assignments = [0, 1, 0, 2, 0, 1]
            const targetClusterIndex = 0
            const expectedMembers = [0, 2, 4]
            expect(_getClusterMembersIndices(targetClusterIndex, assignments)).toEqual(
                expectedMembers,
            )
        })

        it('should return an empty array if the target cluster has no members', () => {
            const assignments = [0, 1, 0, 2, 0, 1]
            const targetClusterIndex = 3 // Cluster 3 has no members
            expect(_getClusterMembersIndices(targetClusterIndex, assignments)).toEqual([])
        })

        it('should return an empty array for an empty assignments array', () => {
            const assignments: number[] = []
            const targetClusterIndex = 0
            expect(_getClusterMembersIndices(targetClusterIndex, assignments)).toEqual([])
        })

        it('should exclude the specified point index if it belongs to the target cluster', () => {
            const assignments = [0, 1, 0, 2, 0, 1]
            const targetClusterIndex = 0
            const excludePointIndex = 2 // Point 2 is in cluster 0
            const expectedMembers = [0, 4]
            expect(
                _getClusterMembersIndices(targetClusterIndex, assignments, excludePointIndex),
            ).toEqual(expectedMembers)
        })

        it('should not affect the result if the excluded point index does not belong to the target cluster', () => {
            const assignments = [0, 1, 0, 2, 0, 1]
            const targetClusterIndex = 0
            const excludePointIndex = 1 // Point 1 is in cluster 1, not cluster 0
            const expectedMembers = [0, 2, 4]
            expect(
                _getClusterMembersIndices(targetClusterIndex, assignments, excludePointIndex),
            ).toEqual(expectedMembers)
        })

        it('should return an empty array if the only member of the target cluster is excluded', () => {
            const assignments = [0, 1, 2] // Point 0 is the only member of cluster 0
            const targetClusterIndex = 0
            const excludePointIndex = 0
            expect(
                _getClusterMembersIndices(targetClusterIndex, assignments, excludePointIndex),
            ).toEqual([])
        })

        it('should handle a cluster with a single member correctly when no exclusion', () => {
            const assignments = [0, 1, 1]
            const targetClusterIndex = 0
            const expectedMembers = [0]
            expect(_getClusterMembersIndices(targetClusterIndex, assignments)).toEqual(
                expectedMembers,
            )
        })

        it('should handle a cluster with a single member correctly when excluding a different point', () => {
            const assignments = [0, 1, 1]
            const targetClusterIndex = 0
            const excludePointIndex = 1
            const expectedMembers = [0]
            expect(
                _getClusterMembersIndices(targetClusterIndex, assignments, excludePointIndex),
            ).toEqual(expectedMembers)
        })
    })
}

/**
 * Calculates the average distance from a given point to a list of other points (members).
 *
 * @param pointIndex - The index of the point from which distances are calculated.
 * @param memberIndices - An array of indices of points to calculate distance against.
 * @param distanceMatrix - The distance matrix.
 * @returns The average distance. Returns Infinity if memberIndices is empty.
 */
function _calculateAverageDissimilarityToMembers(
    pointIndex: number,
    memberIndices: number[],
    distanceMatrix: number[][],
): number {
    if (memberIndices.length === 0) {
        return Infinity // Should be handled by callers to avoid division by zero
    }
    const totalDistance = memberIndices.reduce(
        (sum, memberIdx) => sum + distanceMatrix[pointIndex][memberIdx],
        0,
    )
    return totalDistance / memberIndices.length
}

if (import.meta.vitest) {
    const { describe, expect, it } = import.meta.vitest

    describe('_calculateAverageDissimilarityToMembers', () => {
        it('should return Infinity for empty memberIndices', () => {
            const similarityMatrix = [
                [0, 0.2],
                [0.2, 0],
            ]
            expect(_calculateAverageDissimilarityToMembers(0, [], similarityMatrix)).toBe(Infinity)
        })

        it('should calculate average dissimilarity correctly', () => {
            const distanceMatrix = [
                [0, 0.2, 0.5],
                [0.2, 0, 0.4],
                [0.5, 0.4, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [1, 2], distanceMatrix)
            expect(result).toBeCloseTo((1 - 0.8 + 1 - 0.5) / 2)
        })

        it('should handle a single member correctly', () => {
            const similarityMatrix = [
                [0, 0.2],
                [0.2, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [1], similarityMatrix)
            expect(result).toBe(0.2) // Should be 0.2
        })
        it('should handle a point with itself in memberIndices', () => {
            const similarityMatrix = [
                [0, 0.2],
                [0.2, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [0], similarityMatrix)
            expect(result).toBe(0) // Dissimilarity to itself should be 0
        })
        it('should handle a point with itself and another point in memberIndices', () => {
            const similarityMatrix = [
                [0, 0.2],
                [0.2, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [0, 1], similarityMatrix)
            expect(result).toBe(0.1) // Should be (0 + 0.2) / 2 = 0.1
        })
        it('should handle a point with multiple members', () => {
            const similarityMatrix = [
                [0, 0.2, 0.5, 0.7],
                [0.2, 0, 0.4, 0.6],
                [0.5, 0.4, 0, 0.8],
                [0.7, 0.6, 0.8, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [1, 2, 3], similarityMatrix)
            expect(result).toBeCloseTo((1 - 0.8 + 1 - 0.5 + 1 - 0.3) / 3)
        })
        it('should handle a point with all members in a single cluster', () => {
            const similarityMatrix = [
                [0, 0.1, 0.2],
                [0.1, 0, 0.3],
                [0.2, 0.3, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [1, 2], similarityMatrix)
            expect(result).toBeCloseTo((1 - 0.9 + 1 - 0.8) / 2)
        })
        it('should handle a point with itself and multiple members', () => {
            const similarityMatrix = [
                [0, 0.1, 0.2, 0.3],
                [0.1, 0, 0.4, 0.5],
                [0.2, 0.4, 0, 0.6],
                [0.3, 0.5, 0.6, 0],
            ]
            const result = _calculateAverageDissimilarityToMembers(0, [0, 1, 2], similarityMatrix)
            expect(result).toBeCloseTo((1 - 1 + 1 - 0.9 + 1 - 0.8) / 3)
        })
    })
}

/**
 * Calculates a(i) - the average dissimilarity of point i to all other points in its own cluster.
 *
 * This function computes the average dissimilarity of a point to all other members of its cluster.
 * Dissimilarity is defined as 1 - similarity, so higher similarity results in lower dissimilarity.
 * If the point is the only member of its cluster, it returns Infinity, indicating that
 * the intra-cluster dissimilarity cannot be computed (as there are no other members to compare against).
 *
 * @param pointIndex - The index of the data point.
 * @param clusterIndex - The cluster index to which the point belongs.
 * @param assignments - Array of cluster assignments for all data points.
 * @param similarityMatrix - The similarity matrix.
 * @returns The value of a(i). Returns Infinity if the point is the only member of its cluster.
 */
function _calculateAi(
    pointIndex: number,
    clusterIndex: number,
    assignments: number[],
    similarityMatrix: number[][],
): number {
    const myClusterMembers = _getClusterMembersIndices(clusterIndex, assignments, pointIndex)
    if (myClusterMembers.length === 0) {
        return Infinity // Point is in a singleton cluster (or only noise points besides itself)
    }
    return _calculateAverageDissimilarityToMembers(pointIndex, myClusterMembers, similarityMatrix)
}

if (import.meta.vitest) {
    const { describe, expect, it } = import.meta.vitest
    describe('_calculateAi', () => {
        it('should return Infinity for a singleton cluster', () => {
            const distanceMatrix = [
                [1, 0.8],
                [0.8, 1],
            ]
            const assignments = [0, 1] // Point 0 in cluster 0, point 1 in cluster 1
            const result = _calculateAi(0, 0, assignments, distanceMatrix)
            expect(result).toBe(Infinity) // Point 0 is the only member of its cluster
        })
        it('should calculate average dissimilarity correctly for a non-singleton cluster', () => {
            const distanceMatrix = [
                [0, 0.2, 0.5],
                [0.2, 0, 0.4],
                [0.5, 0.4, 0],
            ]
            const assignments = [0, 0, 1] // Points 0 and 1 in cluster 0, point 2 in cluster 1
            const result = _calculateAi(0, 0, assignments, distanceMatrix)
            expect(result).toBeCloseTo(0.2) // Average dissimilarity to other members in cluster 0
        })
        it('should handle a point with itself in its own cluster', () => {
            const similarityMatrix = [
                [0, 0.2, 0.5],
                [0.2, 0, 0.4],
                [0.5, 0.4, 0],
            ]
            const assignments = [0, 0, 1] // Points 0 and 1 in cluster 0, point 2 in cluster 1
            const result = _calculateAi(0, 0, assignments, similarityMatrix)
            expect(result).toBeCloseTo(0.2) // Average dissimilarity excluding self in cluster 0
        })
        it('should return Infinity for a point in a cluster with no other members', () => {
            const similarityMatrix = [
                [0, 0.2],
                [0.2, 0],
            ]
            const assignments = [0, 1] // Point 0 in cluster 0, point 1 in cluster 1
            const result = _calculateAi(1, 1, assignments, similarityMatrix)
            expect(result).toBe(Infinity) // Point 1 is the only member of its cluster
        })
        it('should handle a point with multiple members in its cluster', () => {
            const similarityMatrix = [
                [0, 0.1, 0.2, 0.3],
                [0.1, 0, 0.4, 0.5],
                [0.2, 0.4, 0, 0.6],
                [0.3, 0.5, 0.6, 0],
            ]
            const assignments = [0, 0, 1, 1] // Points 0 and 1 in cluster 0, points 2 and 3 in cluster 1
            const result = _calculateAi(0, 0, assignments, similarityMatrix)
            expect(result).toBeCloseTo(0.1) // Average dissimilarity to other members in cluster 0
        })
        it('should handle a point with itself and multiple members in its cluster', () => {
            const similarityMatrix = [
                [0, 0.1, 0.2, 0.3],
                [0.1, 0, 0.4, 0.5],
                [0.2, 0.4, 0, 0.6],
                [0.3, 0.5, 0.6, 0],
            ]
            const assignments = [0, 0, 1, 1] // Points 0 and 1 in cluster 0, points 2 and 3 in cluster 1
            const result = _calculateAi(0, 0, assignments, similarityMatrix)
            expect(result).toBeCloseTo(0.1) // Average dissimilarity excluding self in cluster 0
        })
    })
}

/**
 * Calculates b(i) - the minimum average dissimilarity of point i to points in any other cluster.
 *
 * @param pointIndex - The index of the data point.
 * @param myClusterIndex - The cluster index to which pointIndex belongs.
 * @param assignments - Array of cluster assignments for all data points.
 * @param similarityMatrix - The similarity matrix.
 * @returns The value of b(i). Returns Infinity if there are no other clusters to compare against.
 */
function _calculateBi(
    pointIndex: number,
    myClusterIndex: number,
    assignments: number[],
    similarityMatrix: number[][],
): number {
    let minAvgDissimilarity = Infinity
    const uniqueClusterIndices = [...new Set(assignments)]
    const otherClusterIndices = uniqueClusterIndices.filter(
        cIdx => cIdx !== NOISE && cIdx !== myClusterIndex,
    )

    if (otherClusterIndices.length === 0) {
        return Infinity // No other clusters to compare against
    }

    for (const otherClusterIdx of otherClusterIndices) {
        const otherClusterMembers = _getClusterMembersIndices(otherClusterIdx, assignments)
        if (otherClusterMembers.length === 0) {
            // This cluster might be empty or only contain noise points
            continue
        }
        const avgDissimilarity = _calculateAverageDissimilarityToMembers(
            pointIndex,
            otherClusterMembers,
            similarityMatrix,
        )
        minAvgDissimilarity = Math.min(minAvgDissimilarity, avgDissimilarity)
    }
    return minAvgDissimilarity
}

if (import.meta.vitest) {
    const { describe, expect, it } = import.meta.vitest

    describe('_calculateBi', () => {
        it('should return Infinity when there are no other clusters', () => {
            const similarityMatrix = [
                [0, 0.2],
                [0.2, 0],
            ]
            const assignments = [0, 0] // only cluster 0
            expect(_calculateBi(0, 0, assignments, similarityMatrix)).toBe(Infinity)
        })

        it('should calculate minimum average dissimilarity to other clusters', () => {
            const similarityMatrix = [
                [0, 0.1, 0.5],
                [0.1, 0, 0.6],
                [0.5, 0.6, 0],
            ]
            const assignments = [0, 1, 2] // point 0 in cluster 0, others in clusters 1 and 2
            // avg dissimilarity to cluster 1 = 1 - 0.9 = 0.1; to cluster 2 = 1 - 0.5 = 0.5
            expect(_calculateBi(0, 0, assignments, similarityMatrix)).toBeCloseTo(0.1)
        })

        it('should ignore empty clusters and noise', () => {
            const similarityMatrix = [
                [0, 0.3, 0.4],
                [0.3, 0, 0.2],
                [0.4, 0.2, 0],
            ]
            const assignments = [0, NOISE, 1] // point 0 in cluster 0, index 1 is noise, index 2 in cluster 1
            // only cluster 1 is other valid cluster: avg dissimilarity = 1 - 0.6 = 0.4
            expect(_calculateBi(0, 0, assignments, similarityMatrix)).toBeCloseTo(0.4)
        })
    })

    describe('_calculatePointSilhouetteScore', () => {
        it('should return null when b_i is Infinity', () => {
            expect(_calculatePointSilhouetteScore(0.2, Infinity)).toBeNull()
        })

        it('should return null when a_i and b_i are zero', () => {
            expect(_calculatePointSilhouetteScore(0, 0)).toBeNull()
        })

        it('should compute positive silhouette score correctly', () => {
            const a_i = 0.2
            const b_i = 0.8
            expect(_calculatePointSilhouetteScore(a_i, b_i)).toBeCloseTo((b_i - a_i) / b_i)
        })

        it('should compute negative silhouette score correctly', () => {
            const a_i = 0.7
            const b_i = 0.3
            expect(_calculatePointSilhouetteScore(a_i, b_i)).toBeCloseTo((b_i - a_i) / a_i)
        })
    })
}

/**
 * Calculates the silhouette score s(i) for a single point.
 * s(i) = (b(i) - a(i)) / max(a(i), b(i))
 *
 * @param a_i - Average dissimilarity to own cluster members.
 * @param b_i - Minimum average dissimilarity to other cluster members.
 * @returns The silhouette score for the point, or null if it cannot be computed.
 */
function _calculatePointSilhouetteScore(a_i: number, b_i: number): number | null {
    if (!isFinite(b_i)) {
        // b_i is Infinity, e.g., no other clusters to compare to.
        return null
    }
    const max_ab = Math.max(a_i, b_i)
    if (max_ab === 0) {
        // Both a_i and b_i are 0, score is undefined (or 0 by convention, here null to exclude).
        return null
    }
    // a_i being Infinity is handled before this function is called.
    // If a_i were Infinity, max_ab would be Infinity. (b_i - Infinity) / Infinity -> -1.
    // This case is correctly handled by the check `!isFinite(a_i)` in the main function.
    return (b_i - a_i) / max_ab
}

/**
 * Calculates the Silhouette Score for a given clustering result.
 * The Silhouette Score measures how similar a point is to its own cluster (cohesion)
 * compared to other clusters (separation). The score ranges from -1 to +1, where a high
 * value indicates that the point is well matched to its own cluster and poorly
 * matched to neighboring clusters.
 *
 * @remarks
 * - This function assumes that `similarityMatrix[i][j]` represents the similarity
 *   between point `i` and point `j`. Dissimilarity (distance) is calculated as
 *   `1 - similarity`.
 * - Points assigned to a cluster identified by the `NOISE` constant (e.g., a conventionally
 *   negative number like -1, assumed to be defined elsewhere) are ignored in the calculation.
 * - Points in clusters with only one member are also ignored, as their intra-cluster
 *   dissimilarity `a(i)` (average distance to other members in the same cluster)
 *   cannot be computed.
 * - If a point has no other clusters to compare against (e.g., all points belong to one
 *   cluster, or all other clusters are empty or contain only noise points), its
 *   silhouette score `s(i)` cannot be computed, and the point is ignored.
 * - If both the average intra-cluster distance `a(i)` and the minimum average
 *   inter-cluster distance `b(i)` are zero, the point's silhouette score is not computed.
 * - The overall Silhouette Score is the arithmetic mean of the silhouette scores `s(i)`
 *   for all individual points for which `s(i)` could be validly computed.
 * - If no points are valid for score calculation (e.g., all points are noise, all points
 *   form singleton clusters, or other conditions prevent calculation), the function returns 0.
 *
 * @param similarityMatrix - A square 2D array where `similarityMatrix[i][j]` is the
 *                           similarity between data point `i` and data point `j`.
 *                           Values typically range from 0 (no similarity) to 1 (identical).
 * @param result - An object representing the clustering outcome. It must contain an
 *                 `assignments` array of numbers, where `assignments[i]` is the
 *                 cluster index to which data point `i` has been assigned.
 *                 The `NOISE` constant should be used for points not assigned to any valid cluster.
 * @returns The average Silhouette Score for the clustering. This score is between -1 and 1.
 *          Returns 0 if no silhouette scores could be calculated for any points.
 */
export function calculateSilhouetteScore(
    similarityMatrix: number[][],
    result: ClusteringResult,
): number {
    const n = similarityMatrix.length
    if (n === 0) {
        return 0
    }
    let totalSilhouetteScore = 0
    let validPoints = 0

    for (let i = 0; i < n; i++) {
        const myClusterIndex = result.assignments[i]

        if (myClusterIndex === NOISE) {
            continue // Ignore noise points
        }

        const a_i = _calculateAi(i, myClusterIndex, result.assignments, similarityMatrix)
        if (!isFinite(a_i)) {
            // Point is in a singleton cluster or a(i) cannot be computed (e.g. cluster has no other members)
            continue
        }

        const b_i = _calculateBi(i, myClusterIndex, result.assignments, similarityMatrix)
        // If b_i is Infinity (no other clusters to compare to),
        // _calculatePointSilhouetteScore will return null.

        const s_i = _calculatePointSilhouetteScore(a_i, b_i)

        if (s_i !== null) {
            totalSilhouetteScore += s_i
            validPoints++
        }
    }

    return validPoints > 0 ? totalSilhouetteScore / validPoints : 0
}
