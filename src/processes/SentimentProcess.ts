import type { ContextBase, Process } from './types';

/**
 * Process: classify sentiment for texts.
 */

export class Sentiment implements Process {
    static readonly id = 'sentiment';
    id = Sentiment.id;
    dependsOn: string[] = [];

    fast?: boolean;

    constructor(options: { fast?: boolean; } = {}) {
        this.fast = options.fast;
    }

    run(ctx: ContextBase) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : [];
        const fastFlag = this.fast ?? ctx.fast;
        return ctx.client.analyze_sentiment(texts, fastFlag);
    }
}
