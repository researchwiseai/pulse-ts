/**
 * Results of clustering with helper methods.
 *
 * Provides convenience methods for performing various clustering algorithms
 * (K-Means, K-Medoids, HAC, DBSCAN) on the similarity matrix, using automatic
 * parameter selection when parameters are omitted.
 */
import { cluster, autoCluster } from '../clustering'
import type {
    AutoConfigMap,
    ConfigMap,
    ResultMap,
    ClusteringResultWithMetrics,
} from '../clustering/types'

export class ClusterResult {
    /**
     * @param matrix - The pairwise similarity matrix for the dataset.
     * @param texts - Original array of texts corresponding to matrix rows/columns.
     */
    constructor(
        private matrix: number[][],
        private texts: string[],
    ) {}

    /** Raw similarity matrix returned by the clustering process. */
    get similarityMatrix(): number[][] {
        return this.matrix
    }

    /**
     * Perform K-Means clustering (mean-based) on the similarity matrix.
     * If `k` is provided in `config`, manual clustering is used; otherwise automatic clustering is performed.
     * @param config Configuration for K-Means clustering (optional).
     * @returns Clustering result with assignments, centers, iterations, and metrics.
     */
    kMeans(
        config: Omit<AutoConfigMap['mean'], 'mode'> = {},
    ): ClusteringResultWithMetrics<ResultMap['mean']> {
        return autoCluster(this.matrix, { mode: 'mean', ...config })
    }

    /**
     * Perform K-Medoids clustering (medoid-based) on the similarity matrix.
     * If `k` is provided in `config`, manual clustering is used; otherwise automatic clustering is performed.
     * @param config Configuration for K-Medoids clustering (optional).
     * @returns Clustering result with assignments, medoid indices, iterations, and metrics.
     */
    kMedoids(
        config: Omit<AutoConfigMap['medoid'], 'mode'> = {},
    ): ClusteringResultWithMetrics<ResultMap['medoid']> {
        return autoCluster(this.matrix, { mode: 'medoid', ...config })
    }

    /**
     * Perform Hierarchical Agglomerative Clustering (HAC) on the similarity matrix.
     * If `k` is provided in `config`, manual clustering is used; otherwise automatic clustering is performed.
     * @param config Configuration for HAC clustering (optional).
     * @returns Clustering result with assignments and metrics.
     */
    hac(
        config: Omit<AutoConfigMap['hac'], 'mode'> = {},
    ): ClusteringResultWithMetrics<ResultMap['hac']> {
        return autoCluster(this.matrix, { mode: 'hac', ...config })
    }

    /**
     * Perform DBSCAN clustering on the similarity matrix.
     * If `eps` or `minPts` is provided in `config`, manual clustering is used; otherwise automatic clustering is performed.
     * @param config Configuration for DBSCAN clustering (optional).
     * @returns Clustering result with assignments and metrics.
     */
    dbscan(
        config: Omit<AutoConfigMap['dbscan'], 'mode'> = {},
    ): ClusteringResultWithMetrics<ResultMap['dbscan']> {
        return autoCluster(this.matrix, { mode: 'dbscan', ...config })
    }

    /**
     * Perform manual clustering using the specified algorithm and parameters.
     * @param config Configuration for manual clustering (mode, required parameters).
     * @returns Raw clustering result without metrics.
     */
    cluster<M extends keyof ConfigMap>(config: ConfigMap[M]): ResultMap[M] {
        return cluster(this.matrix, config)
    }
}
