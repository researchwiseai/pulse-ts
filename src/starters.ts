/**
 * Quick starter helpers for common use cases.
 */
import fs from 'fs'
import path from 'path'
import { CoreClient } from './core/clients/CoreClient'
import { Analyzer } from './analyzer'
import { Cluster } from './processes/Cluster'
import { ThemeAllocation } from './processes/ThemeAllocation'
import { Sentiment } from './processes/Sentiment'
import { ClusterResult } from './results'
import { ThemeAllocationResult } from './results/ThemeAllocationResult'
import { SentimentResult } from './results/SentimentResult'
import { DataDictionaryResult } from './results/DataDictionaryResult'
import { processes } from './processes/types'
import type { components } from './models'

export function getStrings(source: string[] | string): string[] {
    if (Array.isArray(source)) {
        return source
    }
    if (typeof source === 'string' && fs.existsSync(source)) {
        const ext = path.extname(source).toLowerCase()
        const raw = fs.readFileSync(source, 'utf-8')
        if (ext === '.txt') {
            return raw
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(Boolean)
        }
        if (ext === '.csv' || ext === '.tsv') {
            const sep = ext === '.csv' ? ',' : '\t'
            return raw
                .split(/\r?\n/)
                .map(line => line.split(sep)[0])
                .filter(Boolean)
        }
    }
    throw new Error('Provide a list of strings or a valid .txt, .csv, or .tsv file path')
}

type ThemeGenerationOptions = Omit<components['schemas']['ThemesRequest'], 'fast' | 'inputs'>
type Theme = components['schemas']['Theme']

type ThemesInput = string[] | Theme[] | string | ThemeGenerationOptions

function getThemes(themes: string[]): string[]
function getThemes(themes: string): string[] | Theme[]
function getThemes(themes: Theme[] | string): Theme[]
function getThemes(themes: ThemeGenerationOptions | undefined): undefined
function getThemes(themes: ThemesInput | undefined): Theme[] | string[] | undefined
function getThemes(themes: ThemesInput | undefined): Theme[] | string[] | undefined {
    // If Theme[] or string[], return as is
    if (Array.isArray(themes) && themes.every(t => typeof t === 'string')) {
        return themes as string[]
    }
    if (Array.isArray(themes) && themes.every(t => typeof t === 'object')) {
        return themes as components['schemas']['Theme'][]
    }

    // If string, try to read file
    if (typeof themes === 'string' && fs.existsSync(themes)) {
        const ext = path.extname(themes).toLowerCase()
        const raw = fs.readFileSync(themes, 'utf-8')
        if (ext === '.txt') {
            return raw
                .split(/\r?\n/)
                .map(l => l.trim())
                .filter(Boolean)
        }
        if (ext === '.csv' || ext === '.tsv') {
            const sep = ext === '.csv' ? ',' : '\t'
            return raw
                .split(/\r?\n/)
                .map(line => line.split(sep))
                .map(t => ({
                    label: t[0],
                    shortLabel: t[1],
                    description: t[2],
                    representatives: [t[3], t[4]],
                }))
        }
    }
}

/**
 * Performs sentiment analysis on the provided text or array of texts.
 *
 * This function processes the input text(s) to determine their sentiment.
 * It automatically optimizes for performance by enabling a 'fast' mode
 * if the number of input texts is 200 or fewer. The analysis is conducted
 * using an `Analyzer` instance, which can be configured with a custom
 * `CoreClient` if provided in the options.
 *
 * @param inputData - The input string or array of strings to be analyzed for sentiment.
 * @param options - Optional configuration for the sentiment analysis process.
 * @param options.client - An optional `CoreClient` instance to use for the analysis.
 *                         If not provided, a new `CoreClient` will be instantiated and used.
 * @returns A promise that resolves to a `SentimentResult` object, which contains
 *          the sentiment analysis results for the input text(s).
 */
export async function sentimentAnalysis(
    inputData: string[] | string,
    options: { client?: CoreClient } = {},
): Promise<SentimentResult> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const sentimentProcess = new Sentiment({ fast })
    const analyzer = new Analyzer({
        datasets: { dataset: texts },
        processes: [sentimentProcess],
        client: options.client ?? new CoreClient(),
        fast,
    })
    const res = await analyzer.run()
    return res.sentiment
}

export interface ThemeAllocationOptions {
    themes?: ThemesInput | undefined
    client?: CoreClient
}

/**
 * Performs theme allocation on the provided text(s).
 *
 * This function analyzes input text(s) and allocates them to specified themes.
 * It automatically enables a "fast" mode for smaller datasets (200 texts or fewer)
 * to optimize performance.
 *
 * @async
 * @param inputData - A single string or an array of strings to be analyzed and allocated to themes.
 * @param options - Optional configuration for the theme allocation process.
 * @param options.themes - The themes to allocate the input texts against. This is typically an array of
 *                         theme definitions or a structure that can be processed by `getThemes`.
 *                         The exact type depends on the `ThemeAllocationOptions` definition and `getThemes` implementation.
 * @param options.client - An optional `CoreClient` instance to use for the analysis.
 *                         If not provided, a new `CoreClient` instance will be created and used.
 * @returns A promise that resolves to a `ThemeAllocationResult` object,
 *          which contains the outcome of the theme allocation process for the input texts.
 *          The structure of `ThemeAllocationResult` is defined elsewhere and typically includes
 *          mappings of texts to themes and associated scores or confidence levels.
 */
export async function themeAllocation(
    inputData: string[] | string,
    options: ThemeAllocationOptions = {},
): Promise<ThemeAllocationResult> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const analyzer = new Analyzer({
        datasets: { dataset: texts },
        processes: processes(new ThemeAllocation({ themes: getThemes(options.themes) })),
        client: options.client ?? new CoreClient(),
        fast,
    })
    const res = await analyzer.run()
    return res.themeAllocation
}

/**
 * Performs cluster analysis on the provided input data.
 *
 * This function takes an array of strings or a single string as input, processes it
 * using an Analyzer, and returns the clustering result. It can operate in a "fast"
 * mode if the number of input texts is 200 or less.
 *
 * @param inputData - An array of strings or a single string to be analyzed.
 * @param options - Optional configuration for the analysis.
 * @param options.client - An optional `CoreClient` instance to use for the analysis.
 *                         If not provided, a new `CoreClient` will be instantiated.
 * @returns A promise that resolves to a `ClusterResult` object containing the
 *          clustering information.
 *
 * @example A plain array of strings
 * ```typescript
 * const data = ["text one", "text two", "another piece of text"];
 * const result = await clusterAnalysis(data);
 * console.log(result);
 * ```
 *
 *
 * @example
 * ```typescript
 * // Example with a single string (assuming getStrings handles this)
 * const singleTextData = "This is a single document for clustering.";
 * const singleResult = await clusterAnalysis(singleTextData);
 * console.log(singleResult);
 * ```
 *
 * // Example with a custom client
 * import { CoreClient } from './path-to-core-client'; // Adjust path as needed
 * const myClient = new CoreClient();
 * const resultWithClient = await clusterAnalysis(data, { client: myClient });
 * console.log(resultWithClient);
 * ```
 */
export async function clusterAnalysis(
    inputData: string[] | string,
    options: { client?: CoreClient } = {},
): Promise<ClusterResult> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const analyzer = new Analyzer({
        datasets: { dataset: texts },
        processes: processes(new Cluster()),
        client: options.client ?? new CoreClient(),
        fast,
    })
    const res = await analyzer.run()
    return res.cluster
}

interface SummarizeOptions {
    client?: CoreClient
    length?: components['schemas']['SummariesRequest']['length']
    preset?: components['schemas']['SummariesRequest']['preset']
}

/**
 * Generate a summary for the given texts using the provided question.
 */
export async function summarize(
    inputData: string[] | string,
    question: string,
    options: SummarizeOptions = {},
): Promise<components['schemas']['SummariesResponse']> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const client = options.client ?? new CoreClient()
    return client.generateSummary(texts, question, {
        fast,
        length: options.length,
        preset: options.preset,
    })
}

/**
 * Create embeddings for the given texts.
 */
export async function createEmbeddings(
    inputData: string[] | string,
    options: { client?: CoreClient } = {},
): Promise<components['schemas']['EmbeddingsResponse']> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const client = options.client ?? new CoreClient()
    return client.createEmbeddings(texts, { fast })
}

/**
 * Compute similarity for the given texts.
 */
export async function compareSimilarity(
    inputData: string[] | string,
    options: { client?: CoreClient } = {},
): Promise<components['schemas']['SimilarityResponse']> {
    const texts = getStrings(inputData)
    const fast = texts.length <= 200
    const client = options.client ?? new CoreClient()
    return client.compareSimilarity({ set: texts }, { fast })
}

interface GenerateDataDictionaryOptions {
    client?: CoreClient
    title?: string
    description?: string
    context?: string
    language?: string
}

/**
 * Generate a data dictionary (DDI Codebook) for the provided 2D array of tabular data.
 *
 * This function analyzes tabular data and produces comprehensive DDI (Data Documentation Initiative)
 * Codebook documentation in JSON format. The AI intelligently analyzes data patterns, infers variable
 * types, detects value ranges, and generates meaningful metadata descriptions conforming to DDI standards.
 *
 * Note: Data dictionary generation only supports asynchronous mode due to the computational complexity
 * of analyzing large datasets. The function will automatically poll for job completion.
 *
 * @param data - A 2D array of strings representing tabular data. The first row typically contains
 *               column headers, and subsequent rows contain the data values.
 *               Maximum limits: 50,000 rows, 1,000 columns, or 100,000 total cells.
 * @param options - Optional configuration for the data dictionary generation.
 * @param options.client - An optional `CoreClient` instance to use for the analysis.
 *                         If not provided, a new `CoreClient` will be instantiated.
 * @param options.title - Optional title for the data dictionary.
 * @param options.description - Optional description of the dataset.
 * @param options.context - Optional contextual information to help guide the AI analysis.
 * @param options.language - Optional language code (e.g., 'en', 'es') for the documentation.
 * @returns A promise that resolves to a `DataDictionaryResult` object containing the DDI Codebook
 *          with variables, value domains, categories, and other metadata.
 *
 * @example Basic usage
 * ```typescript
 * const surveyData = [
 *   ['Name', 'Age', 'City', 'Satisfaction'],
 *   ['John Doe', '25', 'New York', 'Very Satisfied'],
 *   ['Jane Smith', '30', 'Los Angeles', 'Satisfied']
 * ];
 * const result = await generateDataDictionary(surveyData);
 * console.log(result.getVariables());
 * ```
 *
 * @example With metadata
 * ```typescript
 * const result = await generateDataDictionary(surveyData, {
 *   title: 'Customer Survey 2024',
 *   description: 'Annual customer satisfaction survey responses',
 *   context: 'Survey conducted among retail customers',
 *   language: 'en'
 * });
 * console.log(result.getSummary());
 * ```
 *
 * @example With custom client
 * ```typescript
 * import { CoreClient } from '@rwai/pulse';
 * const myClient = new CoreClient();
 * const result = await generateDataDictionary(surveyData, { client: myClient });
 * ```
 */
export async function generateDataDictionary(
    data: string[][],
    options: GenerateDataDictionaryOptions = {},
): Promise<DataDictionaryResult> {
    const client = options.client ?? new CoreClient()

    const response = await client.generateDataDictionary(data, {
        title: options.title,
        description: options.description,
        context: options.context,
        language: options.language,
        fast: false, // Data dictionary always uses async mode
    })

    return new DataDictionaryResult(response)
}
