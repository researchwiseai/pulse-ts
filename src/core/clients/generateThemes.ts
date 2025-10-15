import type { CoreClient } from './CoreClient'
import type { UniversalFeatureOptions } from './types'
import type { Job } from '../job'
import { requestFeature } from './requestFeature'
import type { components } from '../../models'

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
    version?: string
    prune?: number
    /** Enables interactive theme generation. Default false. */
    interactive?: boolean
    /** Number of initial theme sets to generate (1-3). Values >1 require interactive=true. Default 1. */
    initialSets?: number
}

/**
 * Generate themes for a set of input texts via the Pulse API.
 *
 * @typeParam Fast - If true, request synchronous processing.
 * @typeParam AwaitJobResult - If false and fast=false, return a Job handle.
 * @param client - CoreClient instance for API calls.
 * @param inputs - Array of input texts to analyze for themes.
 * @param options - Theme generation options (minThemes, maxThemes, context, version, prune, interactive, initialSets, provider, fast, awaitJobResult).
 * @returns ThemesResponse, ThemeSetsResponse, or Job based on options.
 */
export async function generateThemes<
    Fast extends boolean | undefined,
    AwaitJobResult extends boolean | undefined,
>(
    client: CoreClient,
    inputs: string[],
    options: GenerateThemeOptions<Fast, AwaitJobResult> = {},
): Promise<
    AwaitJobResult extends false
        ? Job<components['schemas']['ThemesResponse'] | components['schemas']['ThemeSetsResponse']>
        : components['schemas']['ThemesResponse'] | components['schemas']['ThemeSetsResponse']
> {
    return requestFeature(
        client,
        '/themes',
        {
            inputs,
            context: options.context,
            maxThemes: options.maxThemes,
            minThemes: options.minThemes,
            version: options.version,
            prune: options.prune,
            interactive: options.interactive,
            initialSets: options.initialSets,
            provider: options.provider,
        },
        options,
    )
}
