import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

/**
 * Process: compute similarity matrix for clustering.
 */

@staticImplements<ProcessStatic<'cluster', number[]>>()
export class Cluster<Name extends string = 'cluster'> implements Process<Name, number[]> {
    static readonly id = 'cluster'
    name: Name
    dependsOn: string[] = []

    fast?: boolean

    constructor(options: { fast?: boolean; name?: Name } = {}) {
        this.fast = options.fast
        this.name = options.name ?? (Cluster.id as Name)
    }

    get id() {
        return Cluster.id
    }

    async run(ctx: ContextBase) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : []
        const fastFlag = this.fast ?? ctx.fast
        const upperTriangle = await ctx.client.compareSimilarity(
            {
                set: texts,
            },
            { fast: fastFlag, awaitJobResult: true }
        )

        return []
    }
}
