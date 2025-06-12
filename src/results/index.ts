/**
 * Result helper classes for analysis processes.
 */
import type { ExtractionResult, ExtractionsResponse } from '../models'

/**
 * Results of clustering with helper methods.
 */
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
/**
 * Results of theme extraction with helper methods.
 */
export class ThemeExtractionResult {
    /**
     * @param response - The API response containing extraction data.
     * @param texts - Original array of texts processed.
     * @param themes - Theme labels corresponding to extraction categories.
     */
    constructor(
        private response: ExtractionsResponse,
        private texts: string[],
        private themes: string[],
    ) {}

    /** Nested list of extracted elements per text per theme. */
    get extractions(): ExtractionResult[] {
        return this.response.extractions
    }

    /**
     * Convert extraction results to a flat array of objects.
     *
     * @returns Array of entries each containing text, theme, and extracted element.
     */
    toArray(): Array<{ text: string; theme: string; extraction: unknown }> {
        const rows: Array<{ text: string; theme: string; extraction: unknown }> = []
        this.texts.forEach((text, i) => {
            this.themes.forEach((theme, j) => {
                const items = this.response.extractions[i]?.[j] ?? []
                for (const item of items) {
                    rows.push({ text, theme, extraction: item })
                }
            })
        })
        return rows
    }
}
