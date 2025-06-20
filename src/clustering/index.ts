export { autoCluster } from './autoCluster'
export { cluster } from './cluster'
import { UNCLASSIFIED, NOISE } from './config'
import type { ClusteringResult, DBSCANConfig, DBSCANResult } from './types'
import { getNeighbors } from './helpers/getNeighbors'

export function dbscanFromDistance(distMatrix: number[][], config: DBSCANConfig): DBSCANResult {
    const { eps, minPts } = config
    const n = distMatrix.length
    const assignments = new Array(n).fill(UNCLASSIFIED)
    let clusterId = 0
    for (let i = 0; i < n; i++) {
        if (assignments[i] !== UNCLASSIFIED) continue
        const neighbors = getNeighbors(i, eps, distMatrix)
        if (neighbors.length < minPts) {
            assignments[i] = NOISE
            continue
        }
        assignments[i] = clusterId
        const seedSet = [...neighbors]
        for (let j = 0; j < seedSet.length; j++) {
            const pointIndex = seedSet[j]
            if (assignments[pointIndex] === NOISE) assignments[pointIndex] = clusterId
            if (assignments[pointIndex] !== UNCLASSIFIED) continue
            assignments[pointIndex] = clusterId
            const pointNeighbors = getNeighbors(pointIndex, eps, distMatrix)
            if (pointNeighbors.length >= minPts) {
                seedSet.push(...pointNeighbors.filter(p => !seedSet.includes(p)))
            }
        }
        clusterId++
    }
    return { assignments }
}

export function calculateClusteringCost(
    _similarityMatrix: number[][],
    _result: ClusteringResult,
): number {
    /* ... implementation ... */ return 0
}
// --- Example Usage ---
// const cosineSimilarityMatrix: number[][] = [
//     [1.0, 0.9, 0.85, 0.1, 0.2, 0.01],
//     [0.9, 1.0, 0.95, 0.15, 0.25, 0.02],
//     [0.85, 0.95, 1.0, 0.05, 0.1, 0.03],
//     [0.1, 0.15, 0.05, 1.0, 0.85, 0.04],
//     [0.2, 0.25, 0.1, 0.85, 1.0, 0.05],
//     [0.01, 0.02, 0.03, 0.04, 0.05, 1.0],
// ]

// console.log('--- Running Auto K-Medoids (k is optional) ---')
// const bestKmedoids = autoCluster(cosineSimilarityMatrix, { mode: 'medoid' })
// // Intellisense now correctly infers that `bestKmedoids` has `centers` and `iterations`
// console.log(
//     `Optimal k found: ${bestKmedoids.k}. Centers: ${bestKmedoids.centers}. Silhouette Score: ${bestKmedoids.silhouetteScore.toFixed(4)}`,
// )

// console.log('\n--- Running Manual DBSCAN (eps and minPts are required) ---')
// const dbscanResult = cluster(cosineSimilarityMatrix, { mode: 'dbscan', eps: 0.2, minPts: 3 })
// // Intellisense correctly infers `dbscanResult` has `assignments` but NOT `centers`.
// console.log('DBSCAN Assignments:', dbscanResult.assignments)
