import type { Process } from './types';

/**
 * Process: compute similarity matrix for clustering.
 */

export class Cluster implements Process {
    static readonly id = 'cluster';
    id = Cluster.id;
    dependsOn: string[] = [];

    fast?: boolean;

    constructor(options: { fast?: boolean; } = {}) {
        this.fast = options.fast;
    }

    run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : [];
        const fastFlag = this.fast ?? ctx.fast;
        return ctx.client.compare_similarity(texts, fastFlag, false);
    }
}
