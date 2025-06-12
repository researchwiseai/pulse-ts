/**
 * Data models & types generated from the Pulse API OpenAPI specification.
 *
 * NOTE: This file re-exports the relevant schema types from `openapi.ts` for
 * convenient consumption across the codebase.
 */

import type { components } from './openapi'

export type EmbeddingResponse = components['schemas']['EmbeddingsResponse']

export type SimilarityResponse = components['schemas']['SimilarityResponse']

export type Theme = components['schemas']['Theme']

export type ThemesResponse = components['schemas']['ThemesResponse']

export type SentimentResult = components['schemas']['SentimentResult']

export type SentimentResponse = components['schemas']['SentimentResponse']

export type ExtractionsResponse = components['schemas']['ExtractionsResponse']

export type ExtractionResult = ExtractionsResponse['extractions'][number][number][number]
