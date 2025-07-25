import type { components } from '../models'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// Internal helper for DSL inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process that computes similarity for a set of texts.
 */
@staticImplements<ProcessStatic<'compareSimilarity', components['schemas']['SimilarityResponse']>>()
export class CompareSimilarity<Name extends string = 'compareSimilarity'>
    implements Process<Name, components['schemas']['SimilarityResponse']>
{
    static readonly id = 'compareSimilarity'
    name: Name
    dependsOn: string[] = []
    fast?: boolean

    constructor(options: { fast?: boolean; name?: Name } = {}) {
        this.fast = options.fast
        this.name = options.name ?? (CompareSimilarity.id as Name)
    }

    get id() {
        return CompareSimilarity.id
    }

    async run(ctx: ContextBase): Promise<components['schemas']['SimilarityResponse']> {
        const inp = (this as unknown as ProcWithInputs)._inputs?.[0] ?? 'dataset'
        const arr = ctx.datasets[inp]
        const texts: string[] = Array.isArray(arr) ? arr : [arr]
        const fastFlag = this.fast ?? ctx.fast
        return ctx.client.compareSimilarity({ set: texts }, { fast: fastFlag })
    }
}
