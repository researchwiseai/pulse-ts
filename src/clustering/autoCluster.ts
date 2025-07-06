import { findOptimalEps } from './helpers/findOptimalEps'
import { cluster } from './cluster'
import type {
    AutoConfigMap,
    Mode,
    ClusteringResultWithMetrics,
    ResultMap,
    DBSCANConfig,
    KModesConfig,
    HACConfig,
} from './types'
import {
    calculateSilhouetteScore,
    calculateClusteringCost,
    normalizeSimilarityMatrix,
} from './helpers'

/**
 * Performs automatic clustering on a similarity matrix using the specified mode and configuration.
 *
 * This function supports several clustering algorithms: DBSCAN, HAC (Hierarchical Agglomerative Clustering),
 * Medoid clustering, and Mean-based clustering.
 *
 * - For DBSCAN, if `eps` (epsilon distance) or `minPts` (minimum points) are not provided in the
 *   configuration, they will be automatically determined. `eps` is found using `findOptimalEps`,
 *   and `minPts` defaults to a value between 2 and 4, adjusted based on the dataset size `n`
 *   (specifically `Math.min(n - 1, Math.max(2, 4))`).
 * - For HAC, Medoid, and Mean modes, if the number of clusters `k` is not specified in the
 *   configuration, the function will search for an optimal `k`. This search is performed
 *   over a range of `k` values (e.g., from 2 up to `min(n-1, 9)`). The optimal `k` is chosen
 *   by maximizing the silhouette score of the resulting clustering.
 *
 * The function logs its progress for automatic parameter determination (e.g., chosen `eps` and `minPts`
 * for DBSCAN, or `k` search progress for other modes).
 *
 * The function returns the clustering result along with key metrics: the number of clusters `k`,
 * the clustering cost, and the silhouette score.
 *
 * @template TConfig - The type of the configuration object, constrained by the selected clustering mode.
 *                     It extends `AutoConfigMap[Mode]`, where `AutoConfigMap` maps a clustering
 *                     `Mode` to its specific configuration type.
 *
 * @param similarityMatrix - A 2D array where `similarityMatrix[i][j]` represents the similarity
 *                           between item `i` and item `j`. The matrix should be square and symmetric.
 *                           `n` (number of items) is inferred from `similarityMatrix.length`.
 * @param config - The configuration object for the auto-clustering process.
 *                 It must include a `mode` property specifying the clustering algorithm
 *                 (e.g., 'dbscan', 'hac', 'medoid', 'mean').
 *                 - For `mode: 'dbscan'`, `config` can optionally include `eps` and `minPts`.
 *                   If not provided, they are determined automatically.
 *                 - For `mode: 'hac'`, `mode: 'medoid'`, or `mode: 'mean'`, `config` can optionally
 *                   include `k` (the number of clusters). If not provided, optimal `k` is searched.
 *
 * @returns An object conforming to `ClusteringResultWithMetrics<ResultMap[TConfig['mode']]>`.
 *          `ResultMap` maps a `Mode` to its specific clustering result type.
 *          The returned object includes:
 *          - `assignments`: An array where `assignments[i]` is the cluster ID for item `i`.
 *                           Noise points in DBSCAN are assigned -1.
 *          - `k`: The number of clusters found (for DBSCAN, this excludes noise points).
 *          - `cost`: The calculated cost of the clustering (e.g., sum of intra-cluster distances
 *                    or a mode-specific cost).
 *          - `silhouetteScore`: The silhouette score, a measure of cluster cohesion and separation,
 *                               ranging from -1 to 1. Higher scores indicate better-defined clusters.
 *          - Potentially other properties specific to the clustering result of the chosen mode
 *            (e.g., cluster centers for mean-based clustering, or medoid indices for medoid clustering).
 *
 * @throws Error if an invalid or unsupported auto-clustering configuration is provided
 *         (though type constraints on `TConfig` aim to make this scenario unreachable at runtime
 *         if TypeScript compilation succeeds).
 */
export function autoCluster<TConfig extends AutoConfigMap[Mode]>(
    similarityMatrix: number[][],
    config: TConfig,
): ClusteringResultWithMetrics<ResultMap[TConfig['mode']]> {
    const n = similarityMatrix.length

    // In auto-clustering, we default to normalizing the similarity matrix
    // unless explicitly disabled in the config.
    const distMatrix = normalizeSimilarityMatrix(similarityMatrix, !(config.normalize ?? true))

    // By using a generic TConfig, the switch statement correctly narrows the type of 'config'.
    switch (config.mode) {
        case 'dbscan': {
            const minPts = config.minPts ?? Math.min(n - 1, Math.max(2, 4))
            const eps = config.eps ?? findOptimalEps(distMatrix, minPts)

            console.log(`Auto DBSCAN: Using eps=${eps.toFixed(4)}, minPts=${minPts}`)
            const finalConfig: DBSCANConfig = { mode: 'dbscan', eps, minPts }
            const result = cluster(distMatrix, finalConfig)

            const k = new Set(result.assignments.filter(c => c !== -1)).size
            const cost = calculateClusteringCost(distMatrix, result)
            const silhouette = calculateSilhouetteScore(distMatrix, result)
            const withMetrics: ClusteringResultWithMetrics<ResultMap['dbscan']> = {
                ...result,
                k,
                cost,
                silhouetteScore: silhouette,
            }
            return withMetrics as ClusteringResultWithMetrics<ResultMap[TConfig['mode']]>
        }

        case 'hac':
        case 'medoid':
        case 'mean': {
            if (config.k) {
                const result = cluster(distMatrix, config as KModesConfig | HACConfig)
                const cost = calculateClusteringCost(distMatrix, result)
                const silhouette = calculateSilhouetteScore(distMatrix, result)
                const withMetrics: ClusteringResultWithMetrics<ResultMap[typeof config.mode]> = {
                    ...result,
                    k: config.k,
                    cost,
                    silhouetteScore: silhouette,
                }
                return withMetrics as ClusteringResultWithMetrics<ResultMap[TConfig['mode']]>
            } else {
                const kRange = Array.from({ length: Math.min(n - 2, 8) }, (_, i) => i + 2)
                console.log(
                    `Auto k: Searching for optimal k in range [${kRange[0]}...${kRange[kRange.length - 1]}]...`,
                )

                const resultsWithMetrics = kRange.map(k => {
                    const finalConfig = { ...config, k } as KModesConfig | HACConfig
                    const result = cluster(distMatrix, finalConfig)
                    const cost = calculateClusteringCost(distMatrix, result)
                    const silhouette = calculateSilhouetteScore(distMatrix, result)
                    console.log(`  k=${k}, Silhouette=${silhouette.toFixed(4)}`)
                    return {
                        ...result,
                        k,
                        cost,
                        silhouetteScore: silhouette,
                    } as ClusteringResultWithMetrics<ResultMap[typeof config.mode]>
                })

                return resultsWithMetrics.reduce((best, current) =>
                    current.silhouetteScore > best.silhouetteScore ? current : best,
                ) as ClusteringResultWithMetrics<ResultMap[TConfig['mode']]>
            }
        }
        default:
            // This case should be unreachable due to the type constraints.
            throw new Error('Invalid auto-clustering configuration.')
    }
}
