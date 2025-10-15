import { DataDictionaryResult } from '../results/DataDictionaryResult'
import { type ContextBase, type Process } from './types'

/**
 * Process that generates a DDI Codebook from 2D tabular data.
 *
 * @template Name - Custom name type for this process instance.
 * @remarks
 * Unlike other processes, this process requires data to be passed directly in the constructor
 * since it needs a 2D array structure rather than reading from context datasets.
 */
export class GenerateDataDictionary<Name extends string = 'generateDataDictionary'>
    implements Process<Name, DataDictionaryResult>
{
    /**
     * The static identifier for the generateDataDictionary process.
     *
     * @readonly
     */
    static readonly id = 'generateDataDictionary'
    /**
     * The name associated with the generateDataDictionary process.
     *
     * @remarks
     * This property represents the identifier or label for the data dictionary generation process.
     */
    name: Name
    /**
     * An array of process names or identifiers that this process depends on.
     * The process will only execute after all dependencies listed here have completed.
     */
    dependsOn: string[] = []

    /**
     * The 2D array of tabular data to analyze.
     */
    data: string[][]

    /**
     * Optional title for the data dictionary.
     */
    title?: string

    /**
     * Optional description for the data dictionary.
     */
    description?: string

    /**
     * Optional context information to guide the analysis.
     */
    context?: string

    /**
     * Optional language code (e.g., 'en', 'es') for the data dictionary.
     */
    language?: string

    /**
     * Create a new GenerateDataDictionary process instance.
     *
     * @param options.name - Optional custom name for this process instance.
     * @param options.data - The 2D array of tabular data to analyze.
     * @param options.title - Optional title for the data dictionary.
     * @param options.description - Optional description for the data dictionary.
     * @param options.context - Optional context information to guide the analysis.
     * @param options.language - Optional language code for the data dictionary.
     */
    constructor(options: {
        name?: Name
        data: string[][]
        title?: string
        description?: string
        context?: string
        language?: string
    }) {
        this.name = options.name ?? (GenerateDataDictionary.id as Name)
        this.data = options.data
        this.title = options.title
        this.description = options.description
        this.context = options.context
        this.language = options.language
    }

    /**
     * Gets the static identifier for the GenerateDataDictionary class.
     * @returns The unique identifier associated with the GenerateDataDictionary class.
     */
    get id() {
        return GenerateDataDictionary.id
    }

    /**
     * Execute the data dictionary generation process.
     *
     * @param ctx - Execution context including datasets, client, and fast flag.
     * @returns A promise resolving to a DataDictionaryResult object.
     */
    async run(ctx: ContextBase): Promise<DataDictionaryResult> {
        const response = await ctx.client.generateDataDictionary(this.data, {
            title: this.title,
            description: this.description,
            context: this.context,
            language: this.language,
            fast: false,
            awaitJobResult: true,
        })

        return new DataDictionaryResult(response)
    }
}
