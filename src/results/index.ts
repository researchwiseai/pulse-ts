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
    private data: { dictionary: string[]; results: string[][][]; requestId: string }

    /**
     * @param data - Extraction results containing the dictionary and extracted elements.
     * @param texts - Original array of texts processed.
     */
    constructor(
        data: { dictionary: string[]; results: string[][][]; requestId: string },
        private texts: string[],
    ) {
        this.data = data
    }

    /** Dictionary terms used for extraction. */
    get dictionary(): string[] {
        return this.data.dictionary
    }

    /** 3D array of extraction results: [text_index][dictionary_index][matches] */
    get results(): string[][][] {
        return this.data.results
    }

    /**
     * Request identifier returned by the API.
     */
    get requestId(): string {
        return this.data.requestId
    }

    /**
     * Convert extraction results to a flat array of objects.
     *
     * @returns Array of entries each containing text, term, and matches.
     */
    toArray(): Array<{ text: string; term: string; matches: string[] }> {
        const rows: Array<{ text: string; term: string; matches: string[] }> = []
        this.results.forEach((textResults, textIndex) => {
            textResults.forEach((matches, termIndex) => {
                if (matches.length > 0) {
                    rows.push({
                        text: this.texts[textIndex] ?? '',
                        term: this.dictionary[termIndex] ?? '',
                        matches,
                    })
                }
            })
        })
        return rows
    }
}

export { SentimentResult } from './SentimentResult'
export { ThemeGenerationResult } from './ThemeGenerationResult'
export { ThemeAllocationResult } from './ThemeAllocationResult'
export { DataDictionaryResult } from './DataDictionaryResult'
