export interface ClusteringResult {
    assignments: number[] // Index=point, Value=cluster ID. -1 for noise.
}

export interface KModesResult extends ClusteringResult {
    centers: number[]
    iterations: number
}

export type HACResult = ClusteringResult

export type DBSCANResult = ClusteringResult

export interface ResultMap {
    medoid: KModesResult
    mean: KModesResult
    hac: HACResult
    dbscan: DBSCANResult
}

export type ClusteringResultWithMetrics<R extends ClusteringResult> = R & {
    k: number // The number of clusters found (excluding noise).
    cost: number
    silhouetteScore: number
}

interface ClusteringConfig {
    mode: 'medoid' | 'mean' | 'hac' | 'dbscan'
    normalize?: boolean // Whether to normalize the similarity matrix before clustering.
}

export interface KModesConfig extends ClusteringConfig {
    mode: 'medoid' | 'mean'
    k: number
    maxIterations?: number
}

export interface HACConfig extends ClusteringConfig {
    mode: 'hac'
    k: number
    linkage?: 'single' | 'complete' | 'average'
}

export interface DBSCANConfig extends ClusteringConfig {
    mode: 'dbscan'
    eps: number
    minPts: number
}

export interface ConfigMap {
    medoid: KModesConfig
    mean: KModesConfig
    hac: HACConfig
    dbscan: DBSCANConfig
}

export type AutoConfigMap = {
    // Omit the required params, then make them optional
    medoid: Omit<KModesConfig, 'k'> & { k?: number }
    mean: Omit<KModesConfig, 'k'> & { k?: number }
    hac: Omit<HACConfig, 'k'> & { k?: number }
    dbscan: Omit<DBSCANConfig, 'eps' | 'minPts'> & { eps?: number; minPts?: number }
}

export type Mode = keyof ConfigMap

/**
 * Type guard to check if a given clustering result is a KModesResult.
 *
 * A KModesResult is identified by the presence of 'centers' and 'iterations' properties.
 *
 * @param result - The clustering result to check.
 * @returns True if the result is a KModesResult, false otherwise.
 */
export function isKModesResult(result: ClusteringResult): result is KModesResult {
    return 'centers' in result && 'iterations' in result
}

/**
 * Checks if the given `ClusteringResult` is a `HACResult`.
 *
 * This type guard function narrows down the type of `ClusteringResult`
 * by verifying the presence of an `assignments` property and the
 * absence of `centers` and `iterations` properties, which are
 * characteristic of Hierarchical Agglomerative Clustering (HAC) results.
 *
 * @param result - The `ClusteringResult` object to inspect.
 * @returns `true` if the `result` is a `HACResult`, `false` otherwise.
 */
export function isHACResult(result: ClusteringResult): result is HACResult {
    return 'assignments' in result && !('centers' in result) && !('iterations' in result)
}

/**
 * Type guard function to determine if a given `ClusteringResult` is specifically a `DBSCANResult`.
 *
 * This function checks for the presence of an `assignments` property and the absence of
 * `centers` and `iterations` properties to identify a `DBSCANResult`.
 *
 * @param result - The `ClusteringResult` object to be checked.
 * @returns `true` if the `result` is a `DBSCANResult`, `false` otherwise.
 */
export function isDBSCANResult(result: ClusteringResult): result is DBSCANResult {
    return 'assignments' in result && !('centers' in result) && !('iterations' in result)
}

/**
 * Type guard to determine if a given `ClusteringResult` is one of the specific clustering algorithm result types
 * (`HACResult`, `DBSCANResult`, or `KModesResult`).
 *
 * This function checks if the input `result` conforms to the structure of `HACResult`, `DBSCANResult`,
 * or `KModesResult` by calling their respective type guard functions (`isHACResult`, `isDBSCANResult`, `isKModesResult`).
 * If this function returns `true`, TypeScript will narrow down the type of `result` to
 * `HACResult | DBSCANResult | KModesResult` within the scope where this check is true.
 *
 * @param result - The clustering result object to check. Its type is initially `ClusteringResult`.
 * @returns `true` if `result` is a `HACResult`, `DBSCANResult`, or `KModesResult`; `false` otherwise.
 *          This also serves as a type predicate, narrowing the type of `result`.
 */
export function isClusteringResult(
    result: ClusteringResult,
): result is HACResult | DBSCANResult | KModesResult {
    return isHACResult(result) || isDBSCANResult(result) || isKModesResult(result)
}
