import type { components } from '../models'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// Internal helper for DSL inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process that generates a summary for input texts.
 */
@staticImplements<ProcessStatic<'generateSummary', components['schemas']['SummariesResponse']>>()
export class GenerateSummary<Name extends string = 'generateSummary'>
    implements Process<Name, components['schemas']['SummariesResponse']>
{
    static readonly id = 'generateSummary'
    name: Name
    dependsOn: string[] = []
    question: string
    fast?: boolean
    length?: components['schemas']['SummariesRequest']['length']
    preset?: components['schemas']['SummariesRequest']['preset']

    constructor(
        options: {
            question?: string
            fast?: boolean
            length?: components['schemas']['SummariesRequest']['length']
            preset?: components['schemas']['SummariesRequest']['preset']
            name?: Name
        } = {},
    ) {
        if (!options.question) {
            throw new Error('generateSummary: question is required')
        }
        this.question = options.question
        this.fast = options.fast
        this.length = options.length
        this.preset = options.preset
        this.name = options.name ?? (GenerateSummary.id as Name)
    }

    get id() {
        return GenerateSummary.id
    }

    async run(ctx: ContextBase): Promise<components['schemas']['SummariesResponse']> {
        const inp = (this as unknown as ProcWithInputs)._inputs?.[0] ?? 'dataset'
        const arr = ctx.datasets[inp]
        const texts: string[] = Array.isArray(arr) ? arr : [arr]
        const fastFlag = this.fast ?? ctx.fast
        return ctx.client.generateSummary(texts, this.question, {
            fast: fastFlag,
            length: this.length,
            preset: this.preset,
        })
    }
}
