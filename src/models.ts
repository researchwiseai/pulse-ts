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