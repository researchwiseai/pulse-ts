import { SentimentResult } from '../results/SentimentResult'
import { staticImplements, type ContextBase, type Process, type ProcessStatic } from './types'

/**
 * Process: classify sentiment for texts.
 */

@staticImplements<ProcessStatic<'sentiment', SentimentResult>>()
/**
 * Represents a sentiment analysis process that can be run within a processing pipeline.
 *
 * @template Name - The name type for the process, defaults to 'sentiment'.
 *
 * @implements {Process<Name, SentimentResult>}
 *
 * @property {string} name - The name of the process instance.
 * @property {string[]} dependsOn - List of process IDs this process depends on.
 * @property {boolean} [fast] - Optional flag to enable fast sentiment analysis.
 *
 * @constructor
 * @param {Object} [options] - Optional configuration for the sentiment process.
 * @param {boolean} [options.fast] - Whether to use the fast analysis mode.
 * @param {Name} [options.name] - Custom name for the process instance.

 */
export class Sentiment<Name extends string = 'sentiment'>
    implements Process<Name, SentimentResult>
{
    /**
     * @static
     * @readonly
     * @property {string} id - The static identifier for the sentiment process.
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
     * Creates a new instance of the class.
     *
     * @param options - Optional configuration object.
     * @param options.fast - If true, enables fast mode.
     * @param options.name - Optional name for the instance. Defaults to `Sentiment.id` if not provided.
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
     * Runs the sentiment analysis using the provided context.
     * @param {ContextBase} ctx - The context containing the dataset and client.
     * @returns {Promise<SentimentResult>} The result of the sentiment analysis.
     * @returns
     */
    async run(ctx: ContextBase) {
        const fastFlag = this.fast ?? ctx.fast
        const response = await ctx.client.analyzeSentiment(ctx.dataset, { fast: fastFlag })
        return new SentimentResult(response, ctx.dataset)
    }
}
