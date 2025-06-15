import { describe, it, expect, vi } from 'vitest'
import { findOptimalEps } from './findOptimalEps'
import type { ClusteringResult, KModesResult } from '../types'
import { calculateSilhouetteScore } from './calculateSilhouetteScore'
import { NOISE } from '../config'
import { calculateClusterDistance } from './calculateClusterDistance'
import { getNeighbors } from './getNeighbors'
import { normalizeSimilarityMatrix } from './normalizeSimilarityMatrix'
import { calculateClusteringCost } from './calculateClusteringCost'

describe('calculateClusterDistance', () => {
    const matrix = [
        [0, 1, 5, 6],
        [1, 0, 4, 3],
        [5, 4, 0, 2],
        [6, 3, 2, 0],
    ]

    // Test cases for 'single' linkage
    describe('single linkage', () => {
        it('should return the minimum distance between points in two clusters', () => {
            const clusterA = [0, 1]
            const clusterB = [2, 3]
            // Distances: matrix[0][2]=5, matrix[0][3]=6, matrix[1][2]=4, matrix[1][3]=3
            // Min distance is 3
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'single')).toBe(3)
        })

        it('should return Infinity if clusterA is empty', () => {
            const clusterA: number[] = []
            const clusterB = [2, 3]
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'single')).toBe(Infinity)
        })

        it('should return Infinity if clusterB is empty', () => {
            const clusterA = [0, 1]
            const clusterB: number[] = []
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'single')).toBe(Infinity)
        })

        it('should return Infinity if both clusters are empty', () => {
            const clusterA: number[] = []
            const clusterB: number[] = []
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'single')).toBe(Infinity)
        })
    })

    // Test cases for 'complete' linkage
    describe('complete linkage', () => {
        it('should return the maximum distance between points in two clusters', () => {
            const clusterA = [0, 1]
            const clusterB = [2, 3]
            // Distances: matrix[0][2]=5, matrix[0][3]=6, matrix[1][2]=4, matrix[1][3]=3
            // Max distance is 6
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'complete')).toBe(6)
        })

        it('should return -Infinity if clusterA is empty', () => {
            const clusterA: number[] = []
            const clusterB = [2, 3]
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'complete')).toBe(-Infinity)
        })

        it('should return -Infinity if clusterB is empty', () => {
            const clusterA = [0, 1]
            const clusterB: number[] = []
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'complete')).toBe(-Infinity)
        })

        it('should return -Infinity if both clusters are empty', () => {
            const clusterA: number[] = []
            const clusterB: number[] = []
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'complete')).toBe(-Infinity)
        })
    })

    // Test cases for 'average' linkage
    describe('average linkage', () => {
        it('should return the average distance between points in two clusters', () => {
            const clusterA = [0, 1]
            const clusterB = [2, 3]
            // Distances: matrix[0][2]=5, matrix[0][3]=6, matrix[1][2]=4, matrix[1][3]=3
            // Sum = 5 + 6 + 4 + 3 = 18
            // Count = 4
            // Average = 18 / 4 = 4.5
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'average')).toBe(4.5)
        })

        it('should handle single point clusters for average linkage', () => {
            const clusterA = [0]
            const clusterB = [2]
            // Distance: matrix[0][2]=5
            // Average = 5 / 1 = 5
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'average')).toBe(5)
        })

        it('should return NaN if clusterA is empty', () => {
            const clusterA: number[] = []
            const clusterB = [2, 3]
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'average')).toBeNaN()
        })

        it('should return NaN if clusterB is empty', () => {
            const clusterA = [0, 1]
            const clusterB: number[] = []
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'average')).toBeNaN()
        })

        it('should return NaN if both clusters are empty', () => {
            const clusterA: number[] = []
            const clusterB: number[] = []
            expect(calculateClusterDistance(clusterA, clusterB, matrix, 'average')).toBeNaN()
        })
    })

    // Test with a different matrix and clusters
    describe('with a different matrix', () => {
        const matrix2 = [
            [0, 10, 20],
            [10, 0, 30],
            [20, 30, 0],
        ]

        it('single linkage: should return 10 for clusters [0] and [1]', () => {
            const clusterA = [0]
            const clusterB = [1]
            expect(calculateClusterDistance(clusterA, clusterB, matrix2, 'single')).toBe(10)
        })

        it('complete linkage: should return 30 for clusters [0,1] and [2]', () => {
            const clusterA = [0, 1]
            const clusterB = [2]
            // Distances: matrix[0][2]=20, matrix[1][2]=30
            // Max is 30
            expect(calculateClusterDistance(clusterA, clusterB, matrix2, 'complete')).toBe(30)
        })

        it('average linkage: should return 25 for clusters [0,1] and [2]', () => {
            const clusterA = [0, 1]
            const clusterB = [2]
            // Distances: matrix[0][2]=20, matrix[1][2]=30
            // Sum = 20 + 30 = 50
            // Count = 2
            // Average = 50 / 2 = 25
            expect(calculateClusterDistance(clusterA, clusterB, matrix2, 'average')).toBe(25)
        })
    })
})

describe('calculateSilhouetteScore', () => {
    it('should return 0 for an empty similarity matrix', () => {
        const similarityMatrix: number[][] = []
        const result: ClusteringResult = { assignments: [] }
        expect(calculateSilhouetteScore(similarityMatrix, result)).toBe(0)
    })

    it('should return 0 if all points are noise', () => {
        const similarityMatrix = [
            [1, 0.5],
            [0.5, 1],
        ]
        const result: ClusteringResult = { assignments: [NOISE, NOISE] }
        expect(calculateSilhouetteScore(similarityMatrix, result)).toBe(0)
    })

    it('should return 0 if all points are in singleton clusters', () => {
        // a_i will be Infinity for all points, so they are skipped
        const similarityMatrix = [
            [1, 0.5],
            [0.5, 1],
        ]
        const result: ClusteringResult = { assignments: [0, 1] } // P0 in C0, P1 in C1
        expect(calculateSilhouetteScore(similarityMatrix, result)).toBe(0)
    })

    it('should return 0 if all points are in a single cluster', () => {
        // b_i will be Infinity for all points, s_i will be null, so they are skipped
        const similarityMatrix = [
            [1, 0.8, 0.7],
            [0.8, 1, 0.6],
            [0.7, 0.6, 1],
        ]
        const result: ClusteringResult = { assignments: [0, 0, 0] }
        expect(calculateSilhouetteScore(similarityMatrix, result)).toBe(0)
    })

    it('should calculate silhouette score correctly for two distinct clusters', () => {
        const similarityMatrix = [
            [0.0, 0.1, 0.9, 0.8], // P0
            [0.1, 0.0, 0.7, 0.9], // P1
            [0.9, 0.7, 0.0, 0.2], // P2
            [0.8, 0.9, 0.2, 0.0], // P3
        ]
        const result: ClusteringResult = { assignments: [0, 0, 1, 1] } // P0,P1 in C0; P2,P3 in C1

        // s_0 = (0.85 - 0.1) / 0.85 = 0.75 / 0.85
        // s_1 = (0.8 - 0.1) / 0.8 = 0.7 / 0.8
        // s_2 = (0.8 - 0.2) / 0.8 = 0.6 / 0.8
        // s_3 = (0.85 - 0.2) / 0.85 = 0.65 / 0.85
        const s0 = 0.75 / 0.85
        const s1 = 0.7 / 0.8
        const s2 = 0.6 / 0.8
        const s3 = 0.65 / 0.85
        const expectedScore = (s0 + s1 + s2 + s3) / 4

        expect(calculateSilhouetteScore(similarityMatrix, result)).toBeCloseTo(expectedScore)
    })

    it('should handle a poorly clustered point resulting in a negative score', () => {
        const similarityMatrix = [
            [0.0, 0.6, 0.9], // P0
            [0.6, 0.0, 0.2], // P1 (in C0, but closer to P2 in C1)
            [0.9, 0.2, 0.0], // P2
        ]
        const result: ClusteringResult = { assignments: [0, 0, 1] } // P0,P1 in C0; P2 in C1

        // P0: a_0 = 0.6, b_0 = 0.9. s_0 = (0.9-0.6)/0.9 = 1/3
        // P1: a_1 = 0.6, b_1 = 0.2. s_1 = (0.2-0.6)/0.6 = -2/3
        // P2: a_2 = Infinity (singleton), skipped.
        const s0 = 1 / 3
        const s1 = -2 / 3
        const expectedScore = (s0 + s1) / 2 // -1/6

        expect(calculateSilhouetteScore(similarityMatrix, result)).toBeCloseTo(expectedScore)
    })

    it('should skip point if a_i and b_i are both 0', () => {
        const similarityMatrix = [
            [0.0, 0.0, 0.0], // P0
            [0.0, 0.0, 0.5], // P1
            [0.0, 0.5, 0.0], // P2
        ]
        const result: ClusteringResult = { assignments: [0, 0, 1] } // P0,P1 in C0; P2 in C1

        // P0: a_0 = 0, b_0 = 0. s_0 = null, skipped.
        // P1: a_1 = 0, b_1 = 0.5. s_1 = (0.5-0)/0.5 = 1
        // P2: a_2 = Infinity (singleton), skipped.
        const expectedScore = 1 / 1

        expect(calculateSilhouetteScore(similarityMatrix, result)).toBeCloseTo(expectedScore)
    })

    it('should score 1 if a_i is 0 and b_i is positive (perfect cohesion, good separation)', () => {
        const similarityMatrix = [
            [0.0, 0.0, 0.8], // P0
            [0.0, 0.0, 0.7], // P1
            [0.8, 0.7, 0.0], // P2
        ]
        const result: ClusteringResult = { assignments: [0, 0, 1] }

        // P0: a_0 = 0, b_0 = 0.8. s_0 = (0.8-0)/0.8 = 1
        // P1: a_1 = 0, b_1 = 0.7. s_1 = (0.7-0)/0.7 = 1
        // P2: a_2 = Infinity (singleton), skipped.
        const expectedScore = (1 + 1) / 2

        expect(calculateSilhouetteScore(similarityMatrix, result)).toBeCloseTo(expectedScore)
    })

    it('should score -1 if b_i is 0 and a_i is positive (poor separation)', () => {
        const similarityMatrix = [
            [0.0, 0.5, 0.0], // P0
            [0.5, 0.0, 0.7], // P1
            [0.0, 0.7, 0.0], // P2
        ]
        const result: ClusteringResult = { assignments: [0, 0, 1] }

        // P0: a_0 = 0.5, b_0 = 0. s_0 = (0-0.5)/0.5 = -1
        // P1: a_1 = 0.5, b_1 = 0.7. s_1 = (0.7-0.5)/0.7 = 2/7
        // P2: a_2 = Infinity (singleton), skipped.
        const s0 = -1
        const s1 = 2 / 7
        const expectedScore = (s0 + s1) / 2 // (-1 + 2/7)/2 = -5/14

        expect(calculateSilhouetteScore(similarityMatrix, result)).toBeCloseTo(expectedScore)
    })

    it('should handle a mixed scenario with noise and singleton clusters', () => {
        const similarityMatrix = [
            [0.0, 0.1, 0.9, 0.8, 0.7, 0.7], // P0 (C0)
            [0.1, 0.0, 0.9, 0.9, 0.8, 0.8], // P1 (C0)
            [0.9, 0.9, 0.0, 0.2, 0.9, 0.9], // P2 (C1) - singleton
            [0.8, 0.9, 0.2, 0.0, 0.9, 0.9], // P3 (NOISE)
            [0.7, 0.8, 0.9, 0.9, 0.0, 0.3], // P4 (C2)
            [0.7, 0.8, 0.9, 0.9, 0.3, 0.0], // P5 (C2)
        ]
        const result: ClusteringResult = { assignments: [0, 0, 1, NOISE, 2, 2] }

        // P0: a_0=0.1, b_0=min( (1-0.1), avg(1-0.3,1-0.3) ) = min(0.9, 0.7) = 0.7. s_0=(0.7-0.1)/0.7 = 6/7
        // P1: a_1=0.1, b_1=min( (1-0.1), avg(1-0.2,1-0.2) ) = min(0.9, 0.8) = 0.8. s_1=(0.8-0.1)/0.8 = 7/8
        // P2: a_2=Infinity, skipped.
        // P3: NOISE, skipped.
        // P4: a_4=0.3, b_4=min( avg(1-0.3,1-0.2), (1-0.1) ) = min(0.75, 0.9) = 0.75. s_4=(0.75-0.3)/0.75 = 0.45/0.75 = 3/5
        // P5: a_5=0.3, b_5=min( avg(1-0.3,1-0.2), (1-0.1) ) = min(0.75, 0.9) = 0.75. s_5=(0.75-0.3)/0.75 = 3/5

        const s0 = 6 / 7
        const s1 = 7 / 8
        const s4 = 3 / 5
        const s5 = 3 / 5
        const expectedScore = (s0 + s1 + s4 + s5) / 4

        expect(calculateSilhouetteScore(similarityMatrix, result)).toBeCloseTo(expectedScore)
    })

    it('should return 0 if no valid points for score calculation', () => {
        // Example: one point is noise, another is singleton, another has b_i = Infinity
        const similarityMatrix = [
            [1.0, 0.5, 0.5],
            [0.5, 1.0, 0.5],
            [0.5, 0.5, 1.0],
        ]
        // P0 is NOISE
        // P1 is in singleton cluster C0 (a_1 = Inf)
        // P2 is in cluster C1, but C1 is the only non-noise, non-singleton cluster (b_2 = Inf)
        const result: ClusteringResult = { assignments: [NOISE, 0, 1] }
        // P0: skipped (NOISE)
        // P1: a_1 = Infinity (singleton), skipped
        // P2: a_2 = Infinity (singleton), skipped
        // If P2 was not singleton, e.g. assignments: [NOISE, 0, 1, 1]
        // P2: a_2 = (1-sim[2][3]), b_2 = (1-sim[2][1]) (to C0)
        // Let's use a simpler setup for this specific case:
        // All points lead to s_i = null or are skipped
        const resultAllSkipped: ClusteringResult = { assignments: [NOISE, 0, 1] }
        expect(calculateSilhouetteScore(similarityMatrix, resultAllSkipped)).toBe(0)

        // All points in one cluster (b_i = Inf for all)
        const resultOneCluster: ClusteringResult = { assignments: [0, 0, 0] }
        expect(calculateSilhouetteScore(similarityMatrix, resultOneCluster)).toBe(0)
    })
})

describe('findOptimalEps', () => {
    it('should find the elbow point in a typical k-distance plot', () => {
        const matrix = [
            [0, 0.1, 0.9, 0.85],
            [0.1, 0, 0.8, 0.75],
            [0.9, 0.8, 0, 0.2],
            [0.85, 0.75, 0.2, 0],
        ]
        const minPts = 3 // k = 2 (minPts - 1), index for k-distance is minPts - 2 = 1
        // P0: dists [0.1, 0.9, 0.85], sorted [0.1, 0.85, 0.9]. kDist (idx 1) = 0.85
        // P1: dists [0.1, 0.8, 0.75], sorted [0.1, 0.75, 0.8]. kDist (idx 1) = 0.75
        // P2: dists [0.9, 0.8, 0.2], sorted [0.2, 0.8, 0.9]. kDist (idx 1) = 0.8
        // P3: dists [0.85, 0.75, 0.2], sorted [0.2, 0.75, 0.85]. kDist (idx 1) = 0.75
        // kDistances = [0.85, 0.75, 0.8, 0.75]. Sorted: [0.75, 0.75, 0.8, 0.85]
        // Diffs: (0.75-0.75)=0, (0.8-0.75)=0.05, (0.85-0.8)=0.05.
        // Max diff is 0.05. First occurrence at index 2 (for kDistances[2] - kDistances[1]).
        // So elbowIndex = 2.
        // Expected: kDistances[2] = 0.8
        expect(findOptimalEps(matrix, minPts)).toBe(0.8)
    })

    it('should return 0.5 for an empty matrix', () => {
        expect(findOptimalEps([], 2)).toBe(0.5)
    })

    it('should return 0.5 if minPts is too high for any point to have enough neighbors', () => {
        const matrix = [
            [0, 0.5],
            [0.5, 0],
        ]
        // For P0, distancesToOthers = [0.5]. length = 1.
        // If minPts = 3, minPts - 1 = 2. Condition 1 >= 2 is false.
        // kDistances will be empty.
        expect(findOptimalEps(matrix, 3)).toBe(0.5)
    })

    it('should return 0.5 for a single-point matrix', () => {
        const matrix = [[0]]
        // distancesToOthers will be empty for the single point.
        // kDistances will be empty.
        expect(findOptimalEps(matrix, 2)).toBe(0.5)
    })

    it('should handle all points being equidistant (no clear elbow, maxDiff remains 0)', () => {
        const matrix = [
            [0, 0.5, 0.5],
            [0.5, 0, 0.5],
            [0.5, 0.5, 0],
        ]
        const minPts = 2 // k=1, index=0
        // P0: dists [0.5, 0.5]. kDist = 0.5
        // P1: dists [0.5, 0.5]. kDist = 0.5
        // P2: dists [0.5, 0.5]. kDist = 0.5
        // kDistances = [0.5, 0.5, 0.5]. Sorted: [0.5, 0.5, 0.5]
        // Diffs: 0, 0. maxDiff = 0, elbowIndex = 0.
        // Result: kDistances[0] = 0.5
        expect(findOptimalEps(matrix, minPts)).toBe(0.5)
    })

    it('should return 0.5 when minPts is 1, due to undefined k-distances', () => {
        const matrix = [
            [0, 0.5],
            [0.5, 0],
        ]
        // minPts = 1. minPts - 2 = -1. distancesToOthers[-1] is undefined.
        // kDistances will be [undefined, undefined].
        // Diffs will be NaN. elbowIndex remains 0.
        // kDistances[0] is undefined, so undefined ?? 0.5 -> 0.5.
        expect(findOptimalEps(matrix, 1)).toBe(0.5)
    })

    it('should correctly identify elbow with a sharp increase at the end', () => {
        const matrix = [
            [0, 0.1, 0.2, 0.8],
            [0.1, 0, 0.15, 0.75],
            [0.2, 0.15, 0, 0.7],
            [0.8, 0.75, 0.7, 0],
        ]
        const minPts = 2 // k=1, index=0
        // P0: dists [0.1, 0.2, 0.8]. kDist = 0.1
        // P1: dists [0.1, 0.15, 0.75]. kDist = 0.1
        // P2: dists [0.15, 0.2, 0.7]. kDist = 0.15
        // P3: dists [0.7, 0.75, 0.8]. kDist = 0.7
        // kDistances = [0.1, 0.1, 0.15, 0.7]. Sorted: [0.1, 0.1, 0.15, 0.7]
        // Diffs: 0, 0.05, 0.55. maxDiff = 0.55, elbowIndex = 3.
        // Result: kDistances[3] = 0.7
        expect(findOptimalEps(matrix, minPts)).toBe(0.7)
    })

    it('should handle similarities close to 0 and 1', () => {
        const matrix = [
            [0, 0.01, 0.99],
            [0.01, 0, 0.98],
            [0.99, 0.98, 0],
        ]
        const minPts = 2 // k=1, index=0
        // P0: dists [0.01, 0.99]. kDist = 0.01
        // P1: dists [0.01, 0.98]. kDist = 0.01
        // P2: dists [0.98, 0.99]. kDist = 0.98
        // kDistances = [0.01, 0.01, 0.98]. Sorted: [0.01, 0.01, 0.98]
        // Diffs: 0, 0.97. maxDiff = 0.97, elbowIndex = 2.
        // Result: kDistances[2] = 0.98
        expect(findOptimalEps(matrix, minPts)).toBe(0.98)
    })

    it('should return the first k-distance if all diffs are zero', () => {
        const matrix = [
            [0, 0.1, 0.1],
            [0.1, 0, 0.1],
            [0.1, 0.1, 0],
        ]
        const minPts = 2 // k=1, index=0
        // P0: dists [0.1, 0.1]. kDist = 0.1
        // P1: dists [0.1, 0.1]. kDist = 0.1
        // P2: dists [0.1, 0.1]. kDist = 0.1
        // kDistances = [0.1, 0.1, 0.1]. Sorted: [0.1, 0.1, 0.1]
        // Diffs: 0, 0. maxDiff = 0, elbowIndex = 0.
        // Result: kDistances[0] = 0.1
        expect(findOptimalEps(matrix, 2)).toBeCloseTo(0.1, 1e-6)
    })

    it('should handle a matrix with two points', () => {
        const matrix = [
            [0, 0.3],
            [0.3, 0],
        ]
        const minPts = 2 // k=1, index=0
        // P0: dists [0.3]. kDist = 0.3
        // P1: dists [0.3]. kDist = 0.3
        // kDistances = [0.3, 0.3]. Sorted: [0.3, 0.3]
        // Diffs: 0. maxDiff = 0, elbowIndex = 0.
        // Result: kDistances[0] = 0.3
        expect(findOptimalEps(matrix, minPts)).toBeCloseTo(0.3, 1e-6)
    })

    it('should pick the first elbow if multiple diffs are maximal', () => {
        // kDistances will be [0.1, 0.2, 0.3, 0.3]
        // Diffs: 0.1, 0.1, 0
        // maxDiff = 0.1. elbowIndex will be 1 (from k[1]-k[0])
        const matrix = [
            [0, 0.1, 0.2, 0.3, 0.3], // P0: dists [0.1, 0.2, 0.3, 0.3]. kDist(minPts=2)=0.1
            [0.1, 0, 0.2, 0.3, 0.3], // P1: dists [0.1, 0.2, 0.3, 0.3]. kDist(minPts=2)=0.1 -> actually 0.2 (P0 to P1 is 0.1, P0 to P2 is 0.2)
            [0.2, 0.2, 0, 0.3, 0.3], // P2: dists [0.2, 0.2, 0.3, 0.3]. kDist(minPts=2)=0.2
            [0.3, 0.3, 0.3, 0, 0.3], // P3: dists [0.3, 0.3, 0.3, 0.3]. kDist(minPts=2)=0.3
            [0.3, 0.3, 0.3, 0.3, 0], // P4: dists [0.3, 0.3, 0.3, 0.3]. kDist(minPts=2)=0.3
        ]
        // For minPts = 2 (k=1, index=0):
        // P0: dists [0.1, 0.2, 0.3, 0.3]. kDist = 0.1
        // P1: dists [0.1, 0.2, 0.3, 0.3]. kDist = 0.1
        // P2: dists [0.2, 0.2, 0.3, 0.3]. kDist = 0.2
        // P3: dists [0.3, 0.3, 0.3, 0.3]. kDist = 0.3
        // P4: dists [0.3, 0.3, 0.3, 0.3]. kDist = 0.3
        // kDistances = [0.1, 0.1, 0.2, 0.3, 0.3]. Sorted: [0.1, 0.1, 0.2, 0.3, 0.3]
        // Diffs: 0, 0.1, 0.1, 0
        // Loop:
        // i=1: diff=0. maxDiff=0, elbowIndex=0
        // i=2: diff=0.1. maxDiff=0.1, elbowIndex=2
        // i=3: diff=0.1. (0.1 > 0.1) is false. elbowIndex remains 2.
        // i=4: diff=0. (0 > 0.1) is false. elbowIndex remains 2.
        // Result: kDistances[2] = 0.2
        expect(findOptimalEps(matrix, 2)).toBe(0.2)
    })
})

describe('getNeighbors', () => {
    it('should return an empty array if no neighbors are found', () => {
        const matrix = [
            [0, 10, 20],
            [10, 0, 30],
            [20, 30, 0],
        ]
        const pIdx = 0
        const eps = 5
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([])
    })

    it('should return an array of neighbor indices', () => {
        const matrix = [
            [0, 5, 10],
            [5, 0, 15],
            [10, 15, 0],
        ]
        const pIdx = 0
        const eps = 5
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([1])
    })

    it('should include points with distance exactly equal to eps', () => {
        const matrix = [
            [0, 5, 10],
            [5, 0, 15],
            [10, 15, 0],
        ]
        const pIdx = 0
        const eps = 10
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([1, 2])
    })

    it('should not include the point itself as a neighbor', () => {
        const matrix = [
            [0, 1, 2],
            [1, 0, 3],
            [2, 3, 0],
        ]
        const pIdx = 0
        const eps = 0.1 // Small epsilon, only distance 0 would qualify
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([])
    })

    it('should handle an empty matrix', () => {
        const matrix: number[][] = []
        const pIdx = 0
        const eps = 5
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([])
    })

    it('should handle a matrix with a single point', () => {
        const matrix = [[0]]
        const pIdx = 0
        const eps = 5
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([])
    })

    it('should return all other points if eps is large enough', () => {
        const matrix = [
            [0, 1, 2],
            [1, 0, 3],
            [2, 3, 0],
        ]
        const pIdx = 0
        const eps = 100
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([1, 2])
    })

    it('should work with different pIdx values', () => {
        const matrix = [
            [0, 1, 10],
            [1, 0, 5],
            [10, 5, 0],
        ]
        const pIdx = 1
        const eps = 5
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([0, 2])
    })

    it('should return an empty array if eps is 0 and no other points are at distance 0', () => {
        const matrix = [
            [0, 1, 2],
            [1, 0, 3],
            [2, 3, 0],
        ]
        const pIdx = 0
        const eps = 0
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([])
    })

    it('should return neighbors if eps is 0 and other points are at distance 0', () => {
        const matrix = [
            [0, 0, 2],
            [0, 0, 3],
            [2, 3, 0],
        ]
        const pIdx = 0
        const eps = 0
        expect(getNeighbors(pIdx, eps, matrix)).toEqual([1])
    })
})

describe('normalizeSimilarityMatrix', () => {
    it('should convert a [0, 1] similarity matrix to a distance matrix (skip=false)', () => {
        const matrix = [
            [1, 0.5, 0],
            [0.5, 1, 0.2],
            [0, 0.2, 1],
        ]
        const expected = [
            [0, 0.5, 1],
            [0.5, 0, 0.8],
            [1, 0.8, 0],
        ]
        expect(normalizeSimilarityMatrix(matrix)).toEqual(expected)
    })

    it('should convert a [0, 1] similarity matrix to a distance matrix (skip=true)', () => {
        const matrix = [
            [1, 0.5, 0],
            [0.5, 1, 0.2],
            [0, 0.2, 1],
        ]
        const expected = [
            [0, 0.5, 1],
            [0.5, 0, 0.8],
            [1, 0.8, 0],
        ]
        expect(normalizeSimilarityMatrix(matrix, true)).toEqual(expected)
    })

    it('should normalize a [-1, 1] similarity matrix to a [0, 1] distance matrix (skip=false)', () => {
        const matrix = [
            [1, 0, -1],
            [0, 1, 0.5],
            [-1, 0.5, 1],
        ]
        // min = -1, max = 1. Range = 1 - (-1) = 2
        // (1 - 1) / 2 = 0
        // (1 - 0) / 2 = 0.5
        // (1 - (-1)) / 2 = 1
        // (1 - 0.5) / 2 = 0.25
        const expected = [
            [0, 0.5, 1],
            [0.5, 0, 0.25],
            [1, 0.25, 0],
        ]
        const result = normalizeSimilarityMatrix(matrix)
        result.forEach((row, i) => {
            row.forEach((val, j) => {
                expect(val).toBeCloseTo(expected[i][j])
            })
        })
    })

    it('should convert a [-1, 1] similarity matrix using 1-sim if skip=true', () => {
        const matrix = [
            [1, 0, -1],
            [0, 1, 0.5],
            [-1, 0.5, 1],
        ]
        const expected = [
            [0, 1, 2],
            [1, 0, 0.5],
            [2, 0.5, 0],
        ]
        expect(normalizeSimilarityMatrix(matrix, true)).toEqual(expected)
    })

    it('should handle a matrix with values outside [0,1] but not strictly [-1,1] (skip=false)', () => {
        const matrix = [
            [0.5, 0, -0.5], // min = -0.5, max = 0.5. Range = 0.5 - (-0.5) = 1
        ]
        // (1 - 0.5) / 1 = 0.5
        // (1 - 0) / 1 = 1
        // (1 - (-0.5)) / 1 = 1.5
        const expected = [[0, 0.5, 1]]
        const result = normalizeSimilarityMatrix(matrix)
        result.forEach((row, i) => {
            row.forEach((val, j) => {
                expect(val).toBeCloseTo(expected[i][j])
            })
        })
    })

    it('should handle a matrix with all identical values (skip=false, needs normalization)', () => {
        const matrix = [
            [-0.5, -0.5],
            [-0.5, -0.5],
        ]
        // min = -0.5, max = -0.5. Range = 0. All distances should be 0.
        const expected = [
            [0, 0],
            [0, 0],
        ]
        expect(normalizeSimilarityMatrix(matrix)).toEqual(expected)
    })

    it('should handle a matrix with all identical values within [0,1] (skip=false)', () => {
        const matrix = [
            [0.5, 0.5],
            [0.5, 0.5],
        ]
        const expected = [
            [0.5, 0.5],
            [0.5, 0.5],
        ]
        expect(normalizeSimilarityMatrix(matrix)).toEqual(expected)
    })

    it('should handle a matrix with all identical values (skip=true)', () => {
        const matrix = [
            [-0.5, -0.5],
            [-0.5, -0.5],
        ]
        const expected = [
            [1.5, 1.5],
            [1.5, 1.5],
        ]
        expect(normalizeSimilarityMatrix(matrix, true)).toEqual(expected)
    })

    it('should handle an empty matrix', () => {
        const matrix: number[][] = []
        const expected: number[][] = []
        expect(normalizeSimilarityMatrix(matrix)).toEqual(expected)
        expect(normalizeSimilarityMatrix(matrix, true)).toEqual(expected)
    })

    it('should handle a matrix with empty rows', () => {
        const matrix: number[][] = [[], []]
        const expected: number[][] = [[], []]
        expect(normalizeSimilarityMatrix(matrix)).toEqual(expected)
        expect(normalizeSimilarityMatrix(matrix, true)).toEqual(expected)
    })

    it('should handle a matrix with a single element (in [0,1] range)', () => {
        const matrix = [[0.7]]
        const expected = [[0.3]]
        expect(normalizeSimilarityMatrix(matrix)[0][0]).toBeCloseTo(expected[0][0])
    })

    it('should handle a matrix with a single element (outside [0,1] range, skip=false)', () => {
        const matrix = [[-0.5]] // min = -0.5, max = -0.5. Range = 0.
        const expected = [[0]] // (1 - (-0.5)) / (should be 0 due to max === min)
        expect(normalizeSimilarityMatrix(matrix)).toEqual(expected)
    })

    it('should handle a matrix with a single element (skip=true)', () => {
        const matrix = [[-0.5]]
        const expected = [[1.5]]
        expect(normalizeSimilarityMatrix(matrix, true)).toEqual(expected)
    })

    it('should correctly normalize when min and max are very close and within range but not equal', () => {
        const matrix = [
            [1.0, 0.9999999999],
            [0.9999999999, 1.0],
        ]
        // min = 0.9999999999, max = 1.0. Range = 1.0 - 0.9999999999 = 0.0000000001
        // (1 - 0.9999999999) / 0.0000000001 = 1
        // (1 - 1.0) / 0.0000000001 = 0
        const expected = [
            [0, 0.0000000001],
            [0.0000000001, 0],
        ]
        const result = normalizeSimilarityMatrix(matrix, false)
        result.forEach((row, i) => {
            row.forEach((val, j) => {
                expect(val).toBeCloseTo(expected[i][j])
            })
        })
    })

    it('should correctly normalize when min and max are very close and not in range but not equal', () => {
        const matrix = [
            [2.0, 1.9999999999],
            [1.9999999999, 2.0],
        ]
        // min = 1.9999999999, max = 2.0. Range = 2.0 - 1.9999999999 = 0.0000000001
        // (1 - 2.0) / 0.0000000001 = -10000000000
        // (1 - 1.9999999999) / 0.0000000001 = -9999999999
        const expected = [
            [0, 1],
            [1, 0],
        ]
        const result = normalizeSimilarityMatrix(matrix, false)

        result.forEach((row, i) => {
            row.forEach((val, j) => {
                expect(val).toBeCloseTo(expected[i][j])
            })
        })
    })

    it('should correctly normalize a matrix with positive values > 1 (skip=false)', () => {
        const matrix = [
            [2, 1.5], // min = 1, max = 2. Range = 1
            [1.5, 1],
        ]
        const expected = [
            [0, 0.5],
            [0.5, 1],
        ]
        const result = normalizeSimilarityMatrix(matrix, false)
        result.forEach((row, i) => {
            row.forEach((val, j) => {
                expect(val).toBeCloseTo(expected[i][j])
            })
        })
    })
})

// Mock isKModesResult for testing purposes
vi.mock('../types', async () => {
    const actual = await vi.importActual('../types')
    return {
        ...actual,
        isKModesResult: (result: KModesResult | ClusteringResult): result is KModesResult =>
            'centers' in result && Array.isArray((result as KModesResult).centers),
    }
})

describe('calculateClusteringCost', () => {
    const distMatrix1 = [
        [0, 0.2, 1],
        [0.2, 0, 0.8],
        [1, 0.8, 0],
    ]

    const kModesResult1: KModesResult = {
        assignments: [0, 0, 1],
        centers: [0, 2],
        iterations: 2,
    }

    it('should calculate the correct cost for a valid KModesResult', () => {
        // Point 0 to center 0 (distMatrix[0][0]) = 0
        // Point 1 to center 0 (distMatrix[1][0]) = 1
        // Point 2 to center 1 (distMatrix[2][2]) = 0
        // Total cost = 0 + 1 + 0 = 1
        expect(calculateClusteringCost(distMatrix1, kModesResult1)).toBe(0.2)
    })

    it('should return 0 if result is not KModesResult (no centers)', () => {
        const clusteringResult: ClusteringResult = {
            assignments: [0, 0, 1],
        }
        expect(calculateClusteringCost(distMatrix1, clusteringResult)).toBe(0)
    })

    it('should exclude noise points from cost calculation', () => {
        const distMatrix2 = [
            [0, 2, 3, 1],
            [2, 0, 1, 4],
            [3, 1, 0, 2],
            [1, 4, 2, 0],
        ]
        const kModesResultWithNoise: KModesResult = {
            assignments: [0, NOISE, 1, 0], // Point 1 is noise
            centers: [0, 2], // Cluster 0 center is point 0, Cluster 1 center is point 2
            iterations: 1,
        }
        // Point 0 to center 0 (distMatrix2[0][0]) = 0
        // Point 1 is NOISE, skipped.
        // Point 2 to center 1 (distMatrix2[2][2]) = 0
        // Point 3 to center 0 (distMatrix2[3][0]) = 1
        // Total cost = 0 + 0 + 1 = 1
        expect(calculateClusteringCost(distMatrix2, kModesResultWithNoise)).toBe(1)
    })

    it('should handle invalid cluster assignments and log a warning', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const kModesResultInvalidAssignment: KModesResult = {
            assignments: [0, 0, 2], // Cluster 2 does not exist in centers
            centers: [0, 1],
            iterations: 1,
        }
        // Point 0 to center 0 (distMatrix1[0][0]) = 0
        // Point 1 to center 0 (distMatrix1[1][0]) = 1
        // Point 2 has invalid assignment, skipped.
        // Total cost = 0 + 1 = 1
        expect(calculateClusteringCost(distMatrix1, kModesResultInvalidAssignment)).toBe(0.2)
        expect(consoleWarnSpy).toHaveBeenCalledWith('Point 2 has an invalid cluster assignment: 2')
        consoleWarnSpy.mockRestore()
    })

    it('should handle invalid center indices and log a warning', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const kModesResultInvalidCenter: KModesResult = {
            assignments: [0, 0, 1],
            centers: [0, 100], // Center for cluster 1 (index 100) is out of bounds
            iterations: 1,
        }
        // Point 0 to center 0 (distMatrix1[0][0]) = 0
        // Point 1 to center 0 (distMatrix1[1][0]) = 1
        // Point 2 assigned to cluster 1, but center 100 is invalid, skipped.
        // Total cost = 0 + 1 = 1
        expect(calculateClusteringCost(distMatrix1, kModesResultInvalidCenter)).toBe(0.2)
        expect(consoleWarnSpy).toHaveBeenCalledWith('Cluster 1 has an invalid center: 100')
        consoleWarnSpy.mockRestore()
    })

    it('should return 0 for an empty distance matrix and empty result', () => {
        const emptyDistMatrix: number[][] = []
        const emptyKModesResult: KModesResult = {
            assignments: [],
            centers: [],
            iterations: 0,
        }
        expect(calculateClusteringCost(emptyDistMatrix, emptyKModesResult)).toBe(0)
    })

    it('should return 0 if all points are noise', () => {
        const kModesResultAllNoise: KModesResult = {
            assignments: [NOISE, NOISE, NOISE],
            centers: [0, 1], // Centers exist but all points are noise
            iterations: 2,
        }
        expect(calculateClusteringCost(distMatrix1, kModesResultAllNoise)).toBe(0)
    })

    it('should handle a case where a center is undefined (though type should prevent this)', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const kModesResultUndefinedCenter: KModesResult = {
            assignments: [0, 0, 1],
            centers: [0, undefined as any], // Forcing an undefined center
            iterations: 2,
        }
        // Point 0 to center 0 (distMatrix1[0][0]) = 0
        // Point 1 to center 0 (distMatrix1[1][0]) = 1
        // Point 2 assigned to cluster 1, but center is undefined, skipped.
        // Total cost = 0 + 1 = 1
        expect(calculateClusteringCost(distMatrix1, kModesResultUndefinedCenter)).toBe(0.2)
        expect(consoleWarnSpy).toHaveBeenCalledWith('Cluster 1 has an invalid center: undefined')
        consoleWarnSpy.mockRestore()
    })

    it('should handle a case with a single point and cluster', () => {
        const singlePointMatrix = [[0]]
        const singlePointResult: KModesResult = {
            assignments: [0],
            centers: [0],
            iterations: 1,
        }
        // Point 0 to center 0 (singlePointMatrix[0][0]) = 0
        expect(calculateClusteringCost(singlePointMatrix, singlePointResult)).toBe(0)
    })

    it('should handle a case where a point is NOISE by ignoring it with no warning logged', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const kModesResultNegativeCluster: KModesResult = {
            assignments: [-1, 0, 1],
            centers: [0, 2],
            iterations: 2,
        }
        // Point 0 has invalid assignment (-1), skipped.
        // Point 1 to center 0 (distMatrix1[1][0]) = 1
        // Point 2 to center 1 (distMatrix1[2][2]) = 0
        // Total cost = 1 + 0 = 1
        expect(calculateClusteringCost(distMatrix1, kModesResultNegativeCluster)).toBe(0.2)
        expect(consoleWarnSpy).not.toBeCalled()
        consoleWarnSpy.mockRestore()
    })

    it('should handle a case where a point has an invalid cluster ID', () => {
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const kModesResultNegativeCluster: KModesResult = {
            assignments: [-2, 0, 1],
            centers: [0, 2],
            iterations: 2,
        }
        // Point 0 has invalid assignment (-1), skipped.
        // Point 1 to center 0 (distMatrix1[1][0]) = 1
        // Point 2 to center 1 (distMatrix1[2][2]) = 0
        // Total cost = 1 + 0 = 1
        expect(calculateClusteringCost(distMatrix1, kModesResultNegativeCluster)).toBe(0.2)
        expect(consoleWarnSpy).toHaveBeenCalledWith('Point 0 has an invalid cluster assignment: -2')
        consoleWarnSpy.mockRestore()
    })
})
