import type { Theme as ThemeModel } from '../models';
import { ThemeGeneration } from './ThemeGeneration';
import type { Process } from './types';

/**
 * Process: allocate themes to texts based on generation results.
 */

export class ThemeAllocation implements Process {
    static readonly id = 'theme_allocation';
    id = ThemeAllocation.id;
    dependsOn: string[] = [ThemeGeneration.id];

    themes?: string[] | ThemeModel[];
    singleLabel: boolean;
    fast?: boolean;
    threshold: number;

    constructor(
        options: {
            themes?: string[] | ThemeModel[];
            singleLabel?: boolean;
            fast?: boolean;
            threshold?: number;
        } = {}
    ) {
        this.themes = options.themes;
        this.singleLabel = options.singleLabel ?? true;
        this.fast = options.fast;
        this.threshold = options.threshold ?? 0.5;
    }

    async run(ctx: any) {
        const texts: string[] = Array.isArray(ctx.dataset) ? ctx.dataset : [];
        let rawThemes: any[];
        if (this.themes != null) {
            rawThemes = [...this.themes];
        } else {
            const alias = (this as any)._themesFromAlias || ThemeGeneration.id;
            const prev = ctx.results[alias];
            if (prev != null && Array.isArray(prev.themes)) {
                rawThemes = prev.themes;
            } else if (ctx.sources?.[alias]) {
                rawThemes = [...ctx.sources[alias]];
            } else {
                throw new Error(`${alias} result not available for allocation`);
            }
        }
        // Prepare labels and representative texts
        let labels: string[];
        let simTexts: string[];
        if (rawThemes.length > 0 && typeof (rawThemes[0] as any).shortLabel === 'string') {
            labels = (rawThemes as ThemeModel[]).map(t => t.shortLabel);
            simTexts = (rawThemes as ThemeModel[]).map(t => t.representatives.join(' '));
        } else {
            labels = rawThemes as string[];
            simTexts = rawThemes as string[];
        }
        const fastFlag = this.fast ?? ctx.fast;
        const resp = await ctx.client.compare_similarity(texts, fastFlag, false);
        // similarity matrix or nested arrays
        const simMatrix: number[][] = (resp as any).similarity ?? (resp as number[][]);
        // compute assignments
        const assignments = simMatrix.map(row => row.reduce((bestIdx, _, i) => (row[i] > row[bestIdx] ? i : bestIdx), 0)
        );
        return { themes: labels, assignments, similarity: simMatrix };
    }
}
