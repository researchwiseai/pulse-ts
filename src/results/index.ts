/**
 * Result helper classes for analysis processes.
 */
import type { ExtractionResult, ExtractionsResponse } from '../models'

/**
 * Results of clustering with helper methods.
 */
export class ClusterResult {
    constructor(
        private matrix: number[][],
        private texts: string[],
    ) {}

    /** Raw similarity matrix. */
    get similarityMatrix(): number[][] {
        return this.matrix
    }
}

/**
 * Results of theme extraction with helper methods.
 */
export class ThemeExtractionResult {
    constructor(
        private response: ExtractionsResponse,
        private texts: string[],
        private themes: string[],
    ) {}

    /** Nested list of extracted elements per text per theme. */
    get extractions(): ExtractionResult[] {
        return this.response.extractions
    }

    /** Convert extraction results to plain array of objects. */
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
