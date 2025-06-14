import { SentimentResult } from '../results/SentimentResult'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

// Internal helper for DSL-provided inputs metadata
type ProcWithInputs = { _inputs?: string[] }

/**
 * Process that performs sentiment analysis on input texts.
 *
 * @template Name - Custom name type for this process instance.
 */
@staticImplements<ProcessStatic<'sentiment', SentimentResult>>()
export class Sentiment<Name extends string = 'sentiment'>
    implements Process<Name, SentimentResult>
{
    /**
     * The static identifier for the sentiment process.
     *
     * @readonly
     */
    static readonly id = 'sentiment'
    /**
     * The name associated with the sentiment process.
     *
     * @remarks
     * This property represents the identifier or label for the sentiment process.
     */
    name: Name
    /**
     * An array of process names or identifiers that this process depends on.
     * The process will only execute after all dependencies listed here have completed.
     */
    dependsOn: string[] = []

    /**
     * If true, enables a faster but potentially less thorough processing mode.
     */
    fast?: boolean

    /**
     * Create a new Sentiment process instance.
     *
     * @param options.fast - If true, enables fast (synchronous) sentiment analysis.
     * @param options.name - Optional custom name for this process instance.
     */
    constructor(options: { fast?: boolean; name?: Name } = {}) {
        this.fast = options.fast
        this.name = options.name ?? (Sentiment.id as Name)
    }

    /**
     * Gets the static identifier for the Sentiment class.
     * @returns The unique identifier associated with the Sentiment class.
     */
    get id() {
        return Sentiment.id
    }

    /**
     * Execute the sentiment analysis process.
     *
     * @param ctx - Execution context including datasets, client, and fast flag.
     * @returns A promise resolving to a SentimentResult object.
     */
    async run(ctx: ContextBase): Promise<SentimentResult> {
        const inp = (this as unknown as ProcWithInputs)._inputs?.[0] ?? 'dataset'
        const arr = ctx.datasets[inp]
        const texts: string[] = Array.isArray(arr) ? arr : [arr]
        const fastFlag = this.fast ?? ctx.fast
        const response = await ctx.client.analyzeSentiment(texts, { fast: fastFlag })
        return new SentimentResult(response, texts)
    }
}
