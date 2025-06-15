import { dbscanFromDistance } from '.'
import { hacFromDistance } from './hacFromDistance'
import { kModesFromDistance } from './kModesFromDistance'
import type { Mode, ConfigMap, ResultMap } from './types'

export function cluster<M extends Mode>(
    similarityMatrix: number[][],
    config: ConfigMap[M],
): ResultMap[M]
/**
 * Performs clustering on a given distance matrix using a specified algorithm.
 *
 * This function routes the clustering task to the appropriate implementation
 * based on the `mode` provided in the `config` object.
 *
 * @param distanceMatrix A 2D array of numbers representing the similarity
 *                         between items. `distanceMatrix[i][j]` should be the
 *                         distance between item `i` and item `j`.
 * @param config A configuration object of type `ConfigMap[Mode]`, where `Mode`
 *               is a string literal type defining the clustering algorithm.
 *               The `config.mode` property determines the clustering algorithm:
 *               - `'hac'`: Hierarchical Agglomerative Clustering.
 *               - `'dbscan'`: Density-Based Spatial Clustering of Applications with Noise.
 *               - `'mean'`: K-Modes clustering (using means, adapted for similarity matrices).
 *               - `'medoid'`: K-Modes clustering (using medoids, adapted for similarity matrices).
 *               The `config` object also contains other parameters specific to the chosen mode.
 * @returns A `ResultMap[Mode]` object containing the results of the clustering.
 *          The structure of this object is specific to the `Mode` used.
 * @throws {Error} If an invalid or unsupported `config.mode` is provided.
 */
export function cluster(distanceMatrix: number[][], config: ConfigMap[Mode]): ResultMap[Mode] {
    switch (config.mode) {
        case 'hac':
            return hacFromDistance(distanceMatrix, config)
        case 'dbscan':
            return dbscanFromDistance(distanceMatrix, config)
        case 'mean':
        case 'medoid':
            return kModesFromDistance(distanceMatrix, config)
        default:
            throw new Error(`Invalid clustering mode.`)
    }
}
