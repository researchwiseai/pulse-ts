import { ThemeExtractionResult } from '../results'
import { ThemeGenerationDependent } from './ThemeGeneration'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// Internal helper for DSL-provided inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process that extracts elements matching themes from input texts.
 *
 * Uses the Pulse API to perform element extraction for each theme.
 *
 * @template Name - Custom name for this process instance.
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

    /**
     * Create a new ThemeExtraction process instance.
     *
     * @param options.themes - Optional array of theme labels to use.
     * @param options.version - Optional version string for extraction model.
     * @param options.fast - If true, enables fast (synchronous) processing.
     * @param options.name - Optional custom name for this process instance.
     */
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

    /**
     * Execute the theme extraction process on the input dataset.
     *
     * @param ctx - Execution context with datasets, client, and fast flag.
     * @returns A promise resolving to a ThemeExtractionResult object.
     */
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
