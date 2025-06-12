import type { SentimentResponse, SentimentResult as CoreSentimentResult } from '../models'

/**
 * Results of sentiment analysis with helper methods.
 */

/**
 * Results of sentiment analysis with helper methods.
 */
export class SentimentResult {
    /**
     * @param response - The raw sentiment response from the API.
     * @param texts - The array of input texts corresponding to results.
     */
    constructor(
        private response: SentimentResponse,
        private texts: string[],
    ) {}

    /** Array of raw sentiment result objects. */
    get sentiments(): CoreSentimentResult[] {
        return this.response.results
    }

    /**
     * Convert results to plain array of objects containing text, sentiment label, and confidence.
     *
     * @returns Array of objects with sentiment details per input text.
     */
    toArray(): Array<{ text: string; sentiment: string; confidence: number }> {
        return this.response.results.map((r, i) => ({
            text: this.texts[i] as string,
            sentiment: r.sentiment,
            confidence: r.confidence,
        }))
    }

    /**
     * Generate summary counts for each sentiment label.
     *
     * @returns A record mapping sentiment labels to their occurrence counts.
     */
    summary(): Record<string, number> {
        const counts: Record<string, number> = {}
        for (const r of this.response.results) {
            counts[r.sentiment] = (counts[r.sentiment] ?? 0) + 1
        }
        return counts
    }
}
