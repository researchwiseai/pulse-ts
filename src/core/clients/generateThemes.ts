import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { ThemesResponse } from '../../models'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'

/**
 * Options for theme generation requests.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false when fast=false, return Job handle.
 */
export interface GenerateThemeOptions<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
> extends UniversalFeatureOptions<Fast, AwaitJobResult> {
    minThemes?: number
    maxThemes?: number
    context?: string
}

/**
 * Generate themes for a set of input texts via the Pulse API.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false and fast=false, return a Job handle.
 * @param client - CoreClient instance for API calls.
 * @param inputs - Array of input texts to analyze for themes.
 * @param options - Theme generation options (minThemes, maxThemes, fast, awaitJobResult).
 * @returns ThemesResponse or Job<ThemesResponse> based on options.
 */
export async function generateThemes<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
>(
    client: CoreClient,
    inputs: string[],
    options: GenerateThemeOptions<Fast, AwaitJobResult> = {},
): Promise<AwaitJobResult extends false ? Job<ThemesResponse> : ThemesResponse> {
    return requestFeature(
        client,
        '/themes',
        {
            inputs,
            context: options.context,
            maxThemes: options.maxThemes,
            minThemes: options.minThemes,
        },
        options,
    )
}
