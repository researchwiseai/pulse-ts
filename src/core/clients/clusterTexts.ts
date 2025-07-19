import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'
import type { components } from '../../models'

/** Inputs for text clustering requests. */
export type ClusterTextsInputs = Omit<components['schemas']['ClusteringRequest'], 'fast'>

/** Options controlling clustering requests. */
export type ClusterTextsOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> = UniversalFeatureOptions<Fast, AwaitJobResult>

/**
 * Cluster input texts using the Pulse API.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false when fast=false, return Job handle.
 * @param client - Core client instance for API calls.
 * @param inputs - Clustering request inputs.
 * @param options - Feature options controlling async behavior.
 * @returns ClusteringResponse or Job handle based on options.
 */
export async function clusterTexts<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
>(
    client: CoreClient,
    inputs: ClusterTextsInputs,
    options: ClusterTextsOptions<Fast, AwaitJobResult> = {},
): Promise<
    AwaitJobResult extends false
        ? Job<components['schemas']['ClusteringResponse']>
        : components['schemas']['ClusteringResponse']
> {
    return requestFeature(client, '/clustering', inputs, options)
}
