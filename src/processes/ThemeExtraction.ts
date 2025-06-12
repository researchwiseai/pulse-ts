import { ThemeExtractionResult } from '../results'
import { ThemeGenerationDependent } from './ThemeGeneration'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

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

    sourceNames = {
        inputs: 'dataset',
        themes: 'themes',
    }

    constructor(
        options: {
            themes?: string[]
            version?: string
            fast?: boolean
            name?: Name
            sourceNames?: { inputs: string; themes: string }
        } = {},
    ) {
        super(options)
        this.version = options.version
        this.fast = options.fast
        this.name = options.name ?? (ThemeExtraction.id as Name)

        if (options.sourceNames) {
            if (options.sourceNames.inputs) {
                this.sourceNames.inputs = options.sourceNames.inputs
            }
            if (options.sourceNames.themes) {
                this.sourceNames.themes = options.sourceNames.themes
            }
        }
    }

    get id() {
        return ThemeExtraction.id
    }

    async run(ctx: ContextBase) {
        const fastFlag = this.fast ?? ctx.fast
        const response = await ctx.client.extractElements(
            {
                inputs: ctx.sources[this.sourceNames.inputs],
                themes: this.themeRepresentatives(ctx),
            },
            { fast: fastFlag },
        )
        return new ThemeExtractionResult(
            response,
            ctx.sources[this.sourceNames.inputs],
            this.themeLabels(ctx),
        )
    }
}
