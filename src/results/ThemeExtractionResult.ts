import type { components } from '../models'

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
        private response: components['schemas']['ExtractionsResponse'],
        private texts: string[],
        private themes: string[],
    ) {}

    /** Nested list of extracted elements per text per theme. */
    get extractions(): string[][][] {
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
