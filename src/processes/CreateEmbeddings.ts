import type { components } from '../models'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// DSL inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process that creates embeddings for input texts.
 */
@staticImplements<ProcessStatic<'createEmbeddings', components['schemas']['EmbeddingsResponse']>>()
export class CreateEmbeddings<Name extends string = 'createEmbeddings'>
    implements Process<Name, components['schemas']['EmbeddingsResponse']>
{
    static readonly id = 'createEmbeddings'
    name: Name
    dependsOn: string[] = []
    fast?: boolean

    constructor(options: { fast?: boolean; name?: Name } = {}) {
        this.fast = options.fast
        this.name = options.name ?? (CreateEmbeddings.id as Name)
    }

    get id() {
        return CreateEmbeddings.id
    }

    async run(ctx: ContextBase): Promise<components['schemas']['EmbeddingsResponse']> {
        const inp = (this as unknown as ProcWithInputs)._inputs?.[0] ?? 'dataset'
        const arr = ctx.datasets[inp]
        const texts: string[] = Array.isArray(arr) ? arr : [arr]
        const fastFlag = this.fast ?? ctx.fast
        return ctx.client.createEmbeddings(texts, { fast: fastFlag })
    }
}
