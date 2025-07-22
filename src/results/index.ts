import type { components } from '../models'

/**
 * Results of clustering with helper methods.
 */
export class ClusterResult {
    /**
     * @param matrix - The pairwise similarity matrix for the dataset.
     * @param texts - Original array of texts corresponding to matrix rows/columns.
     */
    constructor(
        private matrix: number[][],
        private texts: string[],
    ) {}

    /** Raw similarity matrix returned by the clustering process. */
    get similarityMatrix(): number[][] {
        return this.matrix
    }
}

/**
 * Results of theme extraction with helper methods.
 */
export class ThemeExtractionResult {
    /**
     * @param response - The API response containing extraction data.
     * @param texts - Original array of texts processed.
     */
    constructor(
        private response: components['schemas']['ExtractionsResponse'],
        private texts: string[],
    ) {}

    /** Category columns returned by the API. */
    get columns(): string[] {
        return this.response.columns
    }

    /** Matrix of category scores per input text. */
    get matrix(): number[][] {
        return this.response.matrix
    }

    /**
     * Convert extraction results to a flat array of objects.
     *
     * @returns Array of entries each containing text, category, and score.
     */
    toArray(): Array<{ text: string; category: string; score: number }> {
        const rows: Array<{ text: string; category: string; score: number }> = []
        this.matrix.forEach((row, i) => {
            row.forEach((score, j) => {
                rows.push({ text: this.texts[i], category: this.columns[j], score })
            })
        })
        return rows
    }
}

export { SentimentResult } from './SentimentResult'
export { ThemeGenerationResult } from './ThemeGenerationResult'
export { ThemeAllocationResult } from './ThemeAllocationResult'
