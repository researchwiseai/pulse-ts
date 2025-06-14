/**
 * Alias for CoreClient exported as PulseAPIClient.
 *
 * Use PulseAPIClient to interact with the core Pulse API operations.
 */
export { CoreClient as PulseAPIClient } from './CoreClient'
export type { CoreClientOptions } from './CoreClientOptions'
export type { AnalyzeSentimentOptions } from './analyzeSentiment'
export type {
    CompareSimilarityInputs,
    CompareSimilarityOptions,
    CompareSimilaritySelf,
    CompareSimilarityCross,
} from './compareSimilarity'
export type { CreateEmbeddingsOptions } from './createEmbeddings'
export type { ExtractElementsInputs, ExtractElementsOptions } from './extractElements'
export type { GenerateThemeOptions } from './generateThemes'
export type { UniversalFeatureOptions } from './types'
