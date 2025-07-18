/**
 * Results of theme allocation with helper methods.
 */

export class ThemeAllocationResult {
    private themesArr: string[]
    constructor(
        private texts: string[],
        themes: string[],
        private assignments: number[],
        private singleLabel: boolean = true,
        private threshold: number = 0.5,
        private similarity: number[][],
    ) {
        if (!similarity) {
            throw new Error('Similarity matrix is required for ThemeAllocationResult')
        }
        this.themesArr = themes
    }

    /** List of theme labels. */
    get themes(): string[] {
        return this.themesArr
    }

    /**
     * Assign a single theme per text based on the similarity threshold.
     *
     * @param threshold - Optional override for the similarity threshold.
     * @returns A record mapping each text to the assigned theme label or null.
     */
    assignSingle(threshold?: number): Record<string, string | null> {
        const thr = threshold ?? this.threshold
        const result: Record<string, string | null> = {}
        this.similarity.forEach((row, i) => {
            const bestIdx = row.reduce(
                (best, _, j) => ((row[j] as number) > (row[best] as number) ? j : best),
                0,
            )
            const bestVal = row[bestIdx] as number
            result[this.texts[i] as string] =
                bestVal >= thr ? (this.themesArr[bestIdx] ?? null) : null
        })
        return result
    }

    /**
     * Assign the top-K themes per text based on similarity scores.
     *
     * @param k - Number of top themes to select; defaults to number of available themes.
     * @returns An array where each entry maps theme positions to theme labels for each text.
     */
    assignMulti(k?: number): Array<Record<string, string>> {
        const topK = k ?? this.themesArr.length
        return this.similarity.map(row => {
            const sorted = row
                .map((val, idx) => [idx, val] as [number, number])
                .sort((a, b) => b[1] - a[1])
                .slice(0, topK)
            const entry: Record<string, string> = {}
            sorted.forEach(([idx], j) => {
                entry[`theme_${j + 1}`] = this.themesArr[idx] as string
            })
            return entry
        })
    }
}
