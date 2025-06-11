import { ThemeExtractionResult } from '../results'
import { ThemeGenerationDependent } from './ThemeGeneration'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

/**
 * Process: extract elements matching themes from input strings.
 */

@staticImplements<ProcessStatic<'theme_extraction', ThemeExtractionResult>>()
export class ThemeExtraction<Name extends string = 'theme_extraction'>
    extends ThemeGenerationDependent
    implements Process<Name, ThemeExtractionResult>
{
    static readonly id = 'theme_extraction'
    readonly name: Name

    version?: string
    fast?: boolean

    constructor(
        options: { themes?: string[]; version?: string; fast?: boolean; name?: Name } = {}
    ) {
        super(options)
        this.version = options.version
        this.fast = options.fast
        this.name = options.name ?? (ThemeExtraction.id as Name)
    }

    get id() {
        return ThemeExtraction.id
    }

    async run(ctx: ContextBase) {
        const fastFlag = this.fast ?? ctx.fast
        const response = await ctx.client.extractElements(
            { inputs: ctx.dataset, themes: this.themeRepresentatives(ctx) },
            { fast: fastFlag }
        )
        return new ThemeExtractionResult(response, ctx.dataset, this.themeLabels(ctx))
    }
}
