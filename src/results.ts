/**
 * Result helper classes for analysis processes.
 */
import type {
    Theme,
    ThemesResponse,
    SentimentResponse,
    SentimentResult as CoreSentimentResult,
    ExtractionsResponse,
} from './models'

/**
 * Results of theme generation with helper methods.
 */
export class ThemeGenerationResult {
    constructor(
        private response: ThemesResponse,
        private texts: string[],
    ) {}

    /** Generated themes metadata. */
    get themes(): Theme[] {
        return this.response.themes
    }

    /** Convert theme metadata to a plain array of objects. */
    toArray(): Array<{
        shortLabel: string
        label: string
        description: string
        representative_1: string
        representative_2: string
    }> {
        return this.response.themes.map(theme => ({
            shortLabel: theme.shortLabel,
            label: theme.label,
            description: theme.description,
            representative_1: theme.representatives[0],
            representative_2: theme.representatives[1],
        }))
    }
}

/**
 * Results of sentiment analysis with helper methods.
 */
export class SentimentResult {
    constructor(
        private response: SentimentResponse,
        private texts: string[],
    ) {}

    /** List of raw sentiment results. */
    get sentiments(): CoreSentimentResult[] {
        return this.response.results
    }

    /** Convert results to plain array of objects. */
    toArray(): Array<{ text: string; sentiment: string; confidence: number }> {
        return this.response.results.map((r, i) => ({
            text: this.texts[i],
            sentiment: r.sentiment,
            confidence: r.confidence,
        }))
    }

    /** Summary counts of each sentiment label. */
    summary(): Record<string, number> {
        const counts: Record<string, number> = {}
        for (const r of this.response.results) {
            counts[r.sentiment] = (counts[r.sentiment] ?? 0) + 1
        }
        return counts
    }
}

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

    /** Assign single theme per text. */
    assignSingle(threshold?: number): Record<string, string | null> {
        const thr = threshold ?? this.threshold
        const result: Record<string, string | null> = {}
        this.similarity.forEach((row, i) => {
            const bestIdx = row.reduce((best, _, j) => (row[j] > row[best] ? j : best), 0)
            const bestVal = row[bestIdx]
            result[this.texts[i]] = bestVal >= thr ? this.themesArr[bestIdx] : null
        })
        return result
    }

    /** Assign top-k themes per text. */
    assignMulti(k?: number): Array<Record<string, string>> {
        const topK = k ?? this.themesArr.length
        return this.similarity.map((row, i) => {
            const sorted = row
                .map((val, idx) => [idx, val] as [number, number])
                .sort((a, b) => b[1] - a[1])
                .slice(0, topK)
            const entry: Record<string, string> = {}
            sorted.forEach(([idx], j) => {
                entry[`theme_${j + 1}`] = this.themesArr[idx]
            })
            return entry
        })
    }
}

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
    get extractions(): any[] {
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
