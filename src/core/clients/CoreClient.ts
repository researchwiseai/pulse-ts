import { Auth } from '../../auth'
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

/**
 * Core client for interacting with the Pulse API operations.
 *
 * Provides methods for embeddings, similarity, themes, sentiment, and element extraction.
 */
export class CoreClient {
    private readonly _baseUrl: string
    private readonly _auth: Auth.Auth
    /** When true, include the `x-pulse-debug` header on requests. */
    private readonly _debug: boolean

    /**
     * Construct a new CoreClient.
     *
     * @param options - Configuration options including the API baseUrl and authentication.
     */
    constructor(options: Partial<CoreClientOptions> = {}) {
        this._baseUrl =
            options?.baseUrl?.replace(/\/{1,100}$/g, '') ??
            process.env.PULSE_BASE_URL ??
            'https://core.researchwiseai.com/pulse/v1'
        this._auth = options.auth ?? new Auth.AutoAuth()
        this._debug = options.debug ?? false
    }

    /** The normalized base URL used for API requests. */
    get baseUrl(): string {
        return this._baseUrl
    }

    /** The authenticator instance used to sign requests. */
    get auth(): Auth.Auth {
        return this._auth
    }

    /** Whether debug mode is enabled. */
    get debug(): boolean {
        return this._debug
    }

    /**
     * Create embeddings for an array of text inputs.
     *
     * @typeParam Fast - Flag to enable synchronous processing.
     * @typeParam AwaitJobResult - Flag to await background job result.
     * @param inputs - Array of text strings to embed.
     * @param opts - Embedding options controlling processing mode.
     * @returns EmbeddingResponse or Job handle, based on options.
     */
    async createEmbeddings<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined,
    >(inputs: string[], opts: CreateEmbeddingsOptions<Fast, AwaitJobResult> = {}) {
        return createEmbeddings(this, inputs, opts)
    }

    /**
     * Compute similarity scores between texts.
     *
     * @typeParam Fast - Flag to enable synchronous processing.
     * @typeParam AwaitJobResult - Flag to await background job result.
     * @param inputs - Inputs for similarity computation (self or cross comparison).
     * @param opts - Options controlling processing mode and result shape.
     * @returns SimilarityResponse or Job handle, based on options.
     */
    async compareSimilarity<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined,
    >(inputs: CompareSimilarityInputs, opts: CompareSimilarityOptions<Fast, AwaitJobResult> = {}) {
        return compareSimilarity(this, inputs, opts)
    }

    /**
     * Generate themes for a set of input texts.
     *
     * @typeParam Fast - Flag to enable synchronous processing.
     * @typeParam AwaitJobResult - Flag to await background job result.
     * @param inputs - Array of input texts to analyze.
     * @param opts - Options for theme generation (minThemes, maxThemes, fast, awaitJobResult).
     * @returns ThemesResponse or Job handle, based on options.
     */
    async generateThemes<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined,
    >(inputs: string[], opts: GenerateThemeOptions<Fast, AwaitJobResult> = {}) {
        return generateThemes(this, inputs, opts)
    }

    /**
     * Analyze sentiment for an array of input texts.
     *
     * @typeParam Fast - Flag to enable synchronous processing.
     * @typeParam AwaitJobResult - Flag to await background job result.
     * @param inputs - Array of text inputs to analyze.
     * @param opts - Sentiment analysis options (fast, awaitJobResult).
     * @returns SentimentResponse or Job handle, based on options.
     */
    async analyzeSentiment<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined,
    >(inputs: string[], opts: AnalyzeSentimentOptions<Fast, AwaitJobResult> = {}) {
        return analyzeSentiment(this, inputs, opts)
    }

    /**
     * Extract specified elements from an array of input texts.
     *
     * @typeParam Fast - Flag to enable synchronous processing.
     * @typeParam AwaitJobResult - Flag to await background job result.
     * @param inputs - Elements extraction inputs (texts and theme list).
     * @param opts - Extraction options (fast, awaitJobResult).
     * @returns ExtractionsResponse or Job handle, based on options.
     */
    async extractElements<
        Fast extends boolean | undefined = undefined,
        AwaitJobResult extends boolean | undefined = undefined,
    >(inputs: ExtractElementsInputs, opts: ExtractElementsOptions<Fast, AwaitJobResult> = {}) {
        return extractElements(this, inputs, opts)
    }
}
