import { ThemeExtractionResult } from '../results'
import { ThemeGenerationDependent } from './ThemeGeneration'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// Internal helper for DSL-provided inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process: extract elements matching themes from input strings.
 */
@staticImplements<ProcessStatic<'themeExtraction', ThemeExtractionResult>>()
export class ThemeExtraction<Name extends string = 'themeExtraction'>
    extends ThemeGenerationDependent
    implements Process<Name, ThemeExtractionResult>
{
    static readonly id = 'themeExtraction'
    readonly name: Name

    version?: string
    fast?: boolean

    constructor(
        options: { themes?: string[]; version?: string; fast?: boolean; name?: Name } = {},
    ) {
        super(options)
        this.version = options.version
        this.fast = options.fast
        this.name = options.name ?? (ThemeExtraction.id as Name)
    }

    get id() {
        return ThemeExtraction.id
    }

    async run(ctx: ContextBase): Promise<ThemeExtractionResult> {
        const inp = (this as unknown as ProcWithInputs)._inputs?.[0] ?? 'dataset'
        const arr = ctx.datasets[inp]
        const texts: string[] = Array.isArray(arr) ? arr : [arr]
        const fastFlag = this.fast ?? ctx.fast
        const response = await ctx.client.extractElements(
            { inputs: texts, themes: this.themeRepresentatives(ctx) },
            { fast: fastFlag },
        )
        return new ThemeExtractionResult(response, texts, this.themeLabels(ctx))
    }
}
