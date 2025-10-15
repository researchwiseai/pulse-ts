import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'
import type { components } from '../../models'

/**
 * Configuration options for the generateDataDictionary function.
 *
 * @property fast - Not supported for data dictionary generation. Must be false or omitted.
 * @property awaitJobResult - If false, returns a Job object for polling; if true or omitted, awaits and returns the job result.
 * @property title - Optional title for the data dictionary.
 * @property description - Optional description of the dataset.
 * @property context - Optional contextual information about the data.
 * @property language - Optional language code (e.g., 'en', 'es').
 */
export interface GenerateDataDictionaryOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {
    title?: string
    description?: string
    context?: string
    language?: string
}

/**
 * Generates a DDI Codebook data dictionary from a 2D array of tabular data.
 *
 * Analyzes the provided data to infer variable types, detect value ranges, and generate
 * comprehensive DDI (Data Documentation Initiative) Codebook documentation in JSON format.
 *
 * **Note**: Data dictionary generation only supports asynchronous mode. The `fast` option
 * must be `false` or omitted. Attempting to use `fast=true` will throw an error.
 *
 * **Data Limits**:
 * - Maximum 50,000 rows
 * - Maximum 1,000 columns
 * - Maximum 100,000 total cells
 *
 * @param client - The CoreClient instance used to send authenticated requests.
 * @param data - A 2D array of strings representing tabular data. First row typically contains column headers.
 * @param options - Configuration options including optional metadata (title, description, context, language).
 * @param options.fast - Must be false or omitted. Fast mode is not supported for data dictionary generation.
 * @param options.awaitJobResult - If false, returns a Job object for polling; if true or omitted, awaits and returns the job result.
 * @param options.title - Optional title for the data dictionary.
 * @param options.description - Optional description of the dataset.
 * @param options.context - Optional contextual information about the data.
 * @param options.language - Optional language code (e.g., 'en', 'es').
 * @returns A `DataDictionaryResponse` when the job completes, or a `Job<DataDictionaryResponse>` if awaitJobResult is false.
 * @throws {Error} When fast=true is specified (not supported for data dictionary generation).
 * @throws {PulseAPIError} When the HTTP response status is not in the 2xx range or data limits are exceeded.
 *
 * @example
 * ```typescript
 * const data = [
 *   ['Name', 'Age', 'City'],
 *   ['John', '25', 'New York'],
 *   ['Jane', '30', 'Los Angeles']
 * ];
 *
 * const result = await client.generateDataDictionary(data, {
 *   title: 'Customer Survey',
 *   description: 'Survey responses from Q1 2024'
 * });
 * ```
 */
export async function generateDataDictionary<
    Fast extends boolean | undefined = undefined,
    AwaitJobResult extends boolean | undefined = undefined,
>(
    client: CoreClient,
    data: string[][],
    options: GenerateDataDictionaryOptions<Fast, AwaitJobResult> = {},
): Promise<
    AwaitJobResult extends false
        ? Job<components['schemas']['DataDictionaryResponse']>
        : components['schemas']['DataDictionaryResponse']
> {
    // Validate that fast mode is not requested
    if (options.fast === true) {
        throw new Error(
            'Data dictionary generation only supports asynchronous mode (fast=false or omitted)',
        )
    }

    // Build request payload
    const payload: components['schemas']['DataDictionaryRequest'] = {
        data,
        fast: false,
    }

    // Add optional metadata if provided
    if (options.title || options.description || options.context || options.language) {
        payload.options = {
            language: options.language ?? 'en', // Default to 'en' as per API spec
            ...(options.title !== undefined && { title: options.title }),
            ...(options.description !== undefined && { description: options.description }),
            ...(options.context !== undefined && { context: options.context }),
        }
    }

    return requestFeature(client, '/data-dictionary', payload, { ...options, fast: false })
}
