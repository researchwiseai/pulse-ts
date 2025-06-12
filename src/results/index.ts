/**
 * Result helper classes for analysis processes.
 */
import type { ExtractionsResponse } from '../models'

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

    score(a: string, b: string): number {
        const idxA = this.texts.indexOf(a)
        const idxB = this.texts.indexOf(b)
        if (idxA === -1 || idxB === -1) {
            throw new Error('Text not found in the provided texts list')
        }
        return this.matrix[idxA][idxB]
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
    get extractions(): ExtractionsResponse['extractions'] {
        return this.response.extractions
    }

    /** Convert extraction results to plain array of objects. */
    toArray(): Array<{ text: string; theme: string; extraction: any }> {
        const rows: Array<{ text: string; theme: string; extraction: any }> = []
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
