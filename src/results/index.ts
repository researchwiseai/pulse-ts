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
    private data: { dictionary: string[]; results: string[][][] }

    /**
     * @param data - Extraction results containing dictionary and matches.
     * @param texts - Original array of texts processed.
     */
    constructor(
        data: { dictionary: string[]; results: string[][][] },
        private texts: string[],
    ) {
        this.data = data
    }

    /** Canonical dictionary returned by the API. */
    get dictionary(): string[] {
        return this.data.dictionary
    }

    /** Extraction results per input text. */
    get results(): string[][][] {
        return this.data.results
    }

    /**
     * Convert extraction results to a flat array of objects.
     *
     * @returns Array of entries each containing text, canonical term, and extracted span.
     */
    toArray(): Array<{ text: string; canonical: string; span: string }> {
        const rows: Array<{ text: string; canonical: string; span: string }> = []
        this.results.forEach((res, i) => {
            const [canonicals = [], spans = []] = res
            canonicals.forEach((term, idx) => {
                rows.push({ text: this.texts[i], canonical: term, span: spans[idx] ?? '' })
            })
        })
        return rows
    }
}

export { SentimentResult } from './SentimentResult'
export { ThemeGenerationResult } from './ThemeGenerationResult'
export { ThemeAllocationResult } from './ThemeAllocationResult'
