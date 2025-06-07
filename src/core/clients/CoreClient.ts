import type { Auth } from '../../auth'
import { analyzeSentiment, type AnalyzeSentimentOptions } from './analyzeSentiment'
import {
    compareSimilarity,
    type CompareSimilarityInputs,
    type CompareSimilarityOptions,
} from './compareSimilarity'
import type { CoreClientOptions } from './CoreClientOptions'
import { createEmbeddings, type CreateEmbeddingsOptions } from './createEmbeddings'
import {
    extractElements,
    type ExtractElementsInputs,
    type ExtractElementsOptions,
} from './extractElements'
import { generateThemes, type GenerateThemeOptions } from './generateThemes'

export class CoreClient {
    private readonly _baseUrl: string
    private readonly _auth: Auth

    constructor(options: CoreClientOptions) {
        this._baseUrl = options.baseUrl.replace(/\/+$/g, '')
        this._auth = options.auth
    }

    get baseUrl(): string {
        return this._baseUrl
    }

    get auth(): Auth {
        return this._auth
    }

    /** Create embeddings for an array of text inputs. */
    async createEmbeddings<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined
    >(inputs: string[], opts: CreateEmbeddingsOptions<Fast, AwaitJobResult> = {}) {
        return createEmbeddings(this, inputs, opts)
    }

    /**
     * Compute similarity scores between texts.
     *
     * @param set Array of text items to compare.
     * @param fast If true, return instant response; otherwise may enqueue a job.
     * @param awaitJobResult If false and fast=false, return a Job handle instead of awaiting result.
     */
    async compareSimilarity<
        Fast extends boolean | undefined,
        AwaitJobResult extends boolean | undefined
    >(inputs: CompareSimilarityInputs, opts?: CompareSimilarityOptions<Fast, AwaitJobResult>) {
        return await compareSimilarity(this, inputs, opts)
    }

    /**
     * Generate themes for a set of input texts.
     *
     * @param inputs Array of input texts to analyze.
     * @param minThemes Minimum number of themes to return.
     * @param maxThemes Maximum number of themes to return.
     * @param fast If true, request a fast synchronous response; otherwise may enqueue a job.
     * @param awaitJobResult If false and fast=false, return a Job handle instead of awaiting the result.
     */
    async generateThemes<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined
    >(inputs: string[], opts: GenerateThemeOptions<Fast, AwaitJobResult> = {}) {
        return generateThemes(this, inputs, opts)
    }

    /**
     * Analyze sentiment for an array of input texts.
     *
     * @param inputs Array of text inputs to analyze.
     * @param opts Analyze sentiment options
     * @param opts.fast If true, request a fast synchronous response; otherwise may enqueue a job.
     * @param opts.awaitJobResult If false and fast=false, return a Job handle instead of awaiting the result.
     */
    async analyzeSentiment<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined
    >(inputs: string[], opts: AnalyzeSentimentOptions<Fast, AwaitJobResult> = {}) {
        return analyzeSentiment(this, inputs, opts)
    }

    /**
     * Extract specified elements from an array of input texts.
     *
     * @param inputs Array of text inputs to extract from.
     * @param elements Array of element names to extract.
     * @param fast If true, request a fast synchronous response; otherwise may enqueue a job.
     * @param awaitJobResult If false and fast=false, return a Job handle instead of awaiting the result.
     */
    async extractElements<
        Fast extends boolean | undefined,
        AwaitJobResult extends boolean | undefined
    >(inputs: ExtractElementsInputs, opts: ExtractElementsOptions<Fast, AwaitJobResult>) {
        return await extractElements(this, inputs, opts)
    }
}
