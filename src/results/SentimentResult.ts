import type { SentimentResponse, SentimentResult as CoreSentimentResult } from '../models'

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
            text: this.texts[i] as string,
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
