import { vi, describe, it, expect, beforeEach } from 'vitest'
import { hacFromDistance } from './hacFromDistance'
import type { HACConfig } from './types'
import * as clusterHelpers from './helpers'

const mockedCalculateClusterDistance = vi.spyOn(clusterHelpers, 'calculateClusterDistance')

describe('hacFromDistance', () => {
    beforeEach(() => {
        mockedCalculateClusterDistance.mockReset()
    })

    it('should correctly cluster points until k is reached, verifying merge order', () => {
        const distMatrix = [
            [0, 1, 5, 6], // Point 0
            [1, 0, 2, 7], // Point 1
            [5, 2, 0, 3], // Point 2
            [6, 7, 3, 0], // Point 3
        ]
        const config: HACConfig = { mode: 'hac', k: 2, linkage: 'average' }

        // Iteration 1: Clusters = [[0], [1], [2], [3]]
        // Mock calls to force (0,1) merge first (distance 1)
        mockedCalculateClusterDistance
            .mockImplementationOnce((c1, c2) => (c1.includes(0) && c2.includes(1) ? 1 : Infinity)) // dist([0],[1])
            .mockImplementationOnce((c1, c2) => (c1.includes(0) && c2.includes(2) ? 5 : Infinity)) // dist([0],[2])
            .mockImplementationOnce((c1, c2) => (c1.includes(0) && c2.includes(3) ? 6 : Infinity)) // dist([0],[3])
            .mockImplementationOnce((c1, c2) => (c1.includes(1) && c2.includes(2) ? 2 : Infinity)) // dist([1],[2])
            .mockImplementationOnce((c1, c2) => (c1.includes(1) && c2.includes(3) ? 7 : Infinity)) // dist([1],[3])
            .mockImplementationOnce((c1, c2) => (c1.includes(2) && c2.includes(3) ? 3 : Infinity)) // dist([2],[3])

        // After (0,1) merge: Clusters = [[0,1], [2], [3]]
        // Iteration 2: Mock calls to force (2,3) merge next (distance 3)
        mockedCalculateClusterDistance
            .mockImplementationOnce((c1, c2) =>
                c1.includes(0) && c1.includes(1) && c2.includes(2) ? 3.5 : Infinity,
            ) // dist([0,1],[2])
            .mockImplementationOnce((c1, c2) =>
                c1.includes(0) && c1.includes(1) && c2.includes(3) ? 6.5 : Infinity,
            ) // dist([0,1],[3])
            .mockImplementationOnce((c1, c2) => (c1.includes(2) && c2.includes(3) ? 3 : Infinity)) // dist([2],[3])

        const result = hacFromDistance(distMatrix, config)

        expect(result.assignments[0]).toBe(result.assignments[1]) // Points 0 and 1 in same cluster
        expect(result.assignments[2]).toBe(result.assignments[3]) // Points 2 and 3 in same cluster
        expect(result.assignments[0]).not.toBe(result.assignments[2]) // Clusters are distinct

        const uniqueAssignments = Array.from(new Set(result.assignments)).sort()
        expect(uniqueAssignments).toEqual([0, 1]) // Cluster IDs are 0 and 1

        expect(mockedCalculateClusterDistance).toHaveBeenCalledTimes(6 + 3) // 6 calls in 1st pass, 3 in 2nd

        expect(mockedCalculateClusterDistance.mock.calls[0]).toEqual([
            [0, 1],
            [1],
            distMatrix,
            'average',
        ])
        expect(mockedCalculateClusterDistance.mock.calls[5]).toEqual([
            [2, 3],
            [3],
            distMatrix,
            'average',
        ])
        expect(mockedCalculateClusterDistance.mock.calls[6]).toEqual([
            [0, 1],
            [2, 3],
            distMatrix,
            'average',
        ])
    })

    it('should return n clusters if k=n (no merging)', () => {
        const distMatrix = [
            [0, 1],
            [1, 0],
        ]
        const n = distMatrix.length
        const config: HACConfig = { mode: 'hac', k: n }
        const result = hacFromDistance(distMatrix, config)

        expect(result.assignments.length).toBe(n)
        expect(result.assignments[0]).not.toBe(result.assignments[1]) // Points in different clusters
        const uniqueAssignments = Array.from(new Set(result.assignments)).sort()
        expect(uniqueAssignments).toEqual(Array.from({ length: n }, (_, i) => i)) // Cluster IDs [0, 1, ...]

        expect(mockedCalculateClusterDistance).not.toHaveBeenCalled()
    })

    it('should handle k=1, merging all points into one cluster', () => {
        const distMatrix = [
            [0, 1, 5], // P0
            [1, 0, 2], // P1
            [5, 2, 0], // P2
        ]
        const config: HACConfig = { mode: 'hac', k: 1, linkage: 'single' }

        // Iteration 1: Clusters = [[0],[1],[2]]. Merge (0,1) (dist 1)
        mockedCalculateClusterDistance
            .mockImplementationOnce(() => 1) // dist([0],[1])
            .mockImplementationOnce(() => 5) // dist([0],[2])
            .mockImplementationOnce(() => 2) // dist([1],[2])

        // Iteration 2: Clusters = [[0,1],[2]]. Merge ([0,1],[2]) (dist 2 for single linkage)
        mockedCalculateClusterDistance.mockImplementationOnce(() => 2) // dist([0,1],[2])

        const result = hacFromDistance(distMatrix, config)
        expect(result.assignments).toEqual([0, 0, 0])
        expect(mockedCalculateClusterDistance).toHaveBeenCalledTimes(3 + 1)
        expect(mockedCalculateClusterDistance.mock.calls[0][3]).toBe('single') // Check linkage passed
        expect(mockedCalculateClusterDistance.mock.calls[3][3]).toBe('single')
    })

    it('should use default linkage "average" if not specified', () => {
        const distMatrix = [
            [0, 1],
            [1, 0],
        ]
        const config: HACConfig = { mode: 'hac', k: 1 } // No linkage specified

        mockedCalculateClusterDistance.mockReturnValue(1)
        hacFromDistance(distMatrix, config)

        expect(mockedCalculateClusterDistance).toHaveBeenCalled()
        expect(mockedCalculateClusterDistance.mock.calls[0][3]).toBe('average')
    })

    it('should handle an empty distance matrix (n=0)', () => {
        const distMatrix: number[][] = []
        const config: HACConfig = { mode: 'hac', k: 0 }
        const result = hacFromDistance(distMatrix, config)
        expect(result.assignments).toEqual([])
        expect(mockedCalculateClusterDistance).not.toHaveBeenCalled()
    })

    it('should handle k=0, merging all points into one cluster if n > 0', () => {
        const distMatrix = [
            [0, 1],
            [1, 0],
        ]
        const config: HACConfig = { mode: 'hac', k: 0 }
        mockedCalculateClusterDistance.mockReturnValue(1) // dist([0],[1]) = 1

        const result = hacFromDistance(distMatrix, config)
        // Merges [0] and [1] into [0,1]. Then loop `while(1 > 0)` runs.
        // Inner loops for finding pairs won't find any pairs if clusters.length is 1.
        // `closestA` remains -1, loop breaks. Result is one cluster [0,1].
        expect(result.assignments).toEqual([0, 0])
        expect(mockedCalculateClusterDistance).toHaveBeenCalledTimes(1)
    })

    it('should break loop if no closest clusters found (minDistance remains Infinity)', () => {
        const distMatrix = [
            [0, 10],
            [10, 0],
        ]
        const config: HACConfig = { mode: 'hac', k: 1 }
        mockedCalculateClusterDistance.mockReturnValue(Infinity)

        const result = hacFromDistance(distMatrix, config)
        // Initial clusters: [[0],[1]]. Loop `while (2 > 1)`.
        // calc([0],[1]) -> Infinity. closestA = -1. Break.
        // Assignments from [[0],[1]] -> [0,1]
        expect(result.assignments).toEqual([0, 1])
        expect(mockedCalculateClusterDistance).toHaveBeenCalledTimes(1)
    })

    it('should correctly assign sequential cluster IDs starting from 0', () => {
        const distMatrix = [
            [0, 10, 1, 11], // P0
            [10, 0, 12, 2], // P1
            [1, 12, 0, 13], // P2
            [11, 2, 13, 0], // P3
        ]
        const config: HACConfig = { mode: 'hac', k: 2, linkage: 'average' }

        // Iteration 1: Merge (0,2) (dist 1)
        mockedCalculateClusterDistance
            .mockImplementationOnce((c1, c2) => (c1.includes(0) && c2.includes(1) ? 10 : Infinity))
            .mockImplementationOnce((c1, c2) => (c1.includes(0) && c2.includes(2) ? 1 : Infinity)) // Min
            .mockImplementationOnce((c1, c2) => (c1.includes(0) && c2.includes(3) ? 11 : Infinity))
            .mockImplementationOnce((c1, c2) => (c1.includes(1) && c2.includes(2) ? 12 : Infinity))
            .mockImplementationOnce((c1, c2) => (c1.includes(1) && c2.includes(3) ? 2 : Infinity))
            .mockImplementationOnce((c1, c2) => (c1.includes(2) && c2.includes(3) ? 13 : Infinity))
        // Clusters: [[0,2], [1], [3]]

        // Iteration 2: Merge (1,3) (dist 2)
        mockedCalculateClusterDistance
            .mockImplementationOnce((c1, c2) =>
                c1.includes(0) && c1.includes(2) && c2.includes(1) ? 11 : Infinity,
            ) // dist([0,2],[1])
            .mockImplementationOnce((c1, c2) =>
                c1.includes(0) && c1.includes(2) && c2.includes(3) ? 12 : Infinity,
            ) // dist([0,2],[3])
            .mockImplementationOnce((c1, c2) => (c1.includes(1) && c2.includes(3) ? 2 : Infinity)) // dist([1],[3]) Min
        // Clusters: [[0,2], [1,3]]

        const result = hacFromDistance(distMatrix, config)
        const assignments = result.assignments

        expect(assignments.length).toBe(4)
        const uniqueIds = Array.from(new Set(assignments)).sort((a, b) => a - b)
        expect(uniqueIds).toEqual([0, 1])

        expect(assignments[0]).toBe(assignments[2]) // 0 and 2 in same cluster
        expect(assignments[1]).toBe(assignments[3]) // 1 and 3 in same cluster
        expect(assignments[0]).not.toBe(assignments[1]) // Clusters are distinct
    })
})
