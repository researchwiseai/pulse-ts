import { ClusterResult } from '../results'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// Internal helper type for DSL inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process that clusters a dataset by computing pairwise similarity among items.
 *
 * This process computes a similarity matrix between all input texts and assigns clusters accordingly.
 *
 * @template Name - Custom name type for this process instance.
 */
@staticImplements<ProcessStatic<'cluster', ClusterResult>>()
export class Cluster<Name extends string = 'cluster'> implements Process<Name, ClusterResult> {
    static readonly id = 'cluster'
    name: Name
    dependsOn: string[] = []

    fast?: boolean

    /**
     * Create a new Cluster process instance.
     *
     * @param options.fast - If true, use fast (synchronous) processing.
     * @param options.name - Optional custom name for this process instance.
     */
    constructor(options: { fast?: boolean; name?: Name } = {}) {
        this.fast = options.fast
        this.name = options.name ?? (Cluster.id as Name)
    }

    get id() {
        return Cluster.id
    }

    /**
     * Execute the clustering process on the provided dataset.
     *
     * @param ctx - Context containing dataset and client configuration.
     * @returns A ClusterResult object with clustering output.
     */
    async run(ctx: ContextBase): Promise<ClusterResult> {
        const inp = (this as unknown as ProcWithInputs)._inputs?.[0] ?? 'dataset'
        const arr = ctx.datasets[inp]
        const texts: string[] = Array.isArray(arr) ? arr : [arr]
        const fastFlag = this.fast ?? ctx.fast
        await ctx.client.compareSimilarity({ set: texts }, { fast: fastFlag, awaitJobResult: true })

        return new ClusterResult([], texts)
    }
}
