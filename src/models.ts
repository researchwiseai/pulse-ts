/**
 * Data models & types for Pulse API requests and responses.
 * TODO: Generate or hand-craft these interfaces/classes based on the OpenAPI specification.
 */

/** Response for text embeddings creation. */
export interface EmbeddingResponse {
  /** Unique request identifier. */
  requestId: string;
  /** Embedding vectors corresponding to each input text. */
  embeddings: { vector: number[]; text?: string }[];
}

/** Response for similarity computation between texts. */
export interface SimilarityResponse {
  /** Unique request identifier or job request id. */
  requestId: string;
  /** Full matrix of similarity scores (n×n). */
  matrix: number[][];
  /** Flattened similarity scores (if requested). */
  flattened: number[];
  /** Convenience alias for reading similarity scores uniformly (matrix or flattened). */
  similarity: number[][];
  /** Scenario of comparison: 'self' for within one set, 'cross' for between two sets. */
  scenario: 'self' | 'cross';
  /** Mode of result shape: 'matrix' or 'flattened'. */
  mode: 'matrix' | 'flattened';
  /** Number of items compared (size of set). */
  n: number;
}

/**
 * Single theme item returned by the generate_themes endpoint.
 */
export interface Theme {
  /** Abbreviated label for the theme. */
  shortLabel: string;
  /** Full human-readable label for the theme. */
  label: string;
  /** Description of the theme. */
  description: string;
  /** Representative input texts exemplifying the theme. */
  representatives: string[];
}

/**
 * Response for the theme generation endpoint.
 */
export interface ThemesResponse {
  /** Unique request identifier or job request id. */
  requestId: string;
  /** List of generated themes. */
  themes: Theme[];
}

/**
 * Single sentiment result from the analyze_sentiment endpoint.
 */
export interface SentimentResult {
  /** Predicted sentiment label. */
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** Confidence score for the sentiment prediction (0 to 1). */
  confidence: number;
}

/**
 * Response for the sentiment analysis endpoint.
 */
export interface SentimentResponse {
  /** Unique request identifier or job request id. */
  requestId: string;
  /** Array of sentiment results corresponding to each input. */
  results: SentimentResult[];
}